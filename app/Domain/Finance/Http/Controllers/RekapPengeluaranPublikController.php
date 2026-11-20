<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Domain\Finance\Actions\GetRekapPengeluaranAction;
use App\Domain\Finance\Exports\RekapPengeluaranExport;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\RekapPublikSetting;
use App\Domain\Finance\Support\PeriodeRekap;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Halaman publik Rekap Pengeluaran (TD-D3) - menggantikan
 * /rekap-publik: tanpa login, gate sandi berbasis sesi, hanya
 * transaksi keluar, tanpa kartu pemasukan/selisih. Singleton
 * rekap_publik_settings dipakai ulang (sandi sama).
 */
class RekapPengeluaranPublikController extends Controller
{
    public function index(Request $request)
    {
        $setting = RekapPublikSetting::current();
        $requiresPassword = $setting->requires_password;
        $unlocked = ! $requiresPassword || $request->session()->get('rekap_publik_unlocked', false);

        $filters = $this->resolveFilters($request);
        $rekap = null;

        if ($unlocked) {
            $rekap = (new GetRekapPengeluaranAction)->execute(
                $filters['unit_bisnis_id'],
                $filters['kategori'],
                null,
                $filters['tanggal_mulai'],
                $filters['tanggal_sampai'],
            );
        }

        return Inertia::render('Public/RekapPengeluaranPublik', [
            'locked' => ! $unlocked,
            'requires_password' => $requiresPassword,
            'rekap' => $rekap,
            'unitBisnisList' => AkunKasBank::query()
                ->join('unit_bisnis', 'unit_bisnis.id', '=', 'akun_kas_banks.unit_bisnis_id')
                ->where('akun_kas_banks.aktif', true)
                ->orderBy('unit_bisnis.nama')
                ->select('unit_bisnis.id', 'unit_bisnis.nama')
                ->distinct()
                ->get(),
            'kategoriList' => MutasiKasBank::query()
                ->keluar()
                ->whereNotNull('kategori')
                ->where('kategori', '!=', '')
                ->distinct()
                ->orderBy('kategori')
                ->pluck('kategori'),
            'filters' => [
                'unit_bisnis_id' => $filters['unit_bisnis_id'] ?? '',
                'periode' => $filters['periode'],
                'tanggal_mulai' => $filters['tanggal_mulai_raw'] ?? '',
                'tanggal_sampai' => $filters['tanggal_sampai_raw'] ?? '',
                'kategori' => $filters['kategori'] ?? '',
            ],
            'periode_preset' => PeriodeRekap::PRESETS,
        ]);
    }

    /**
     * Verifikasi password publik → session gate (sandi sama dengan
     * singleton rekap_publik_settings).
     */
    public function unlock(Request $request): RedirectResponse
    {
        $setting = RekapPublikSetting::current();

        if (! $setting->requires_password) {
            return redirect()->route('rekap-pengeluaran-publik.index');
        }

        $request->validate(['password' => 'required|string']);

        $input = (string) $request->input('password');
        $valid = false;

        try {
            $plain = $setting->password ? Crypt::decryptString($setting->password) : null;
            $valid = $plain !== null && hash_equals($plain, $input);
        } catch (\Throwable) {
            // Password legacy berformat hash (bcrypt): verifikasi via Hash::check
            $valid = Hash::check($input, $setting->password ?? '');
        }

        if (! $valid) {
            return back()->withErrors(['password' => 'Password salah.']);
        }

        $request->session()->put('rekap_publik_unlocked', true);

        return redirect()->route('rekap-pengeluaran-publik.index', $request->only([
            'unit_bisnis_id', 'periode', 'tanggal_mulai', 'tanggal_sampai', 'kategori',
        ]));
    }

    public function lock(Request $request): RedirectResponse
    {
        $request->session()->forget('rekap_publik_unlocked');

        return redirect()->route('rekap-pengeluaran-publik.index');
    }

    /**
     * Export Excel (.xlsx) publik - hanya jika terbuka; tanpa kolom
     * akun kas & tanpa baris pemasukan/selisih.
     */
    public function export(Request $request)
    {
        $setting = RekapPublikSetting::current();
        $unlocked = ! $setting->requires_password || $request->session()->get('rekap_publik_unlocked', false);

        abort_unless($unlocked, 403);

        $filters = $this->resolveFilters($request);
        $rekap = (new GetRekapPengeluaranAction)->execute(
            $filters['unit_bisnis_id'],
            $filters['kategori'],
            null,
            $filters['tanggal_mulai'],
            $filters['tanggal_sampai'],
        );

        $rows = [];
        $no = 1;

        foreach ($rekap['transaksi'] as $row) {
            $rows[] = [
                $no++,
                $row['tanggal'],
                $row['unit_bisnis'],
                $row['kategori'],
                (float) $row['jumlah'],
                $row['catatan'],
            ];
        }

        $export = new RekapPengeluaranExport(
            ['No', 'Tanggal', 'Unit Bisnis', 'Kategori', 'Jumlah (Rp)', 'Catatan'],
            $rows,
            [
                ['Total Pengeluaran', $rekap['total_pengeluaran']],
            ],
            'Rekapitulasi Pengeluaran - '.$rekap['periode_label'],
            'Pengeluaran',
        );

        return Excel::download(
            $export,
            Str::slug('rekap_pengeluaran').'_'.date('Ymd_His').'.xlsx',
        );
    }

    protected function resolveFilters(Request $request): array
    {
        $periode = PeriodeRekap::resolve(
            $request->input('periode'),
            $request->input('tanggal_mulai'),
            $request->input('tanggal_sampai'),
        );

        return [
            'unit_bisnis_id' => $request->input('unit_bisnis_id') ?: null,
            'kategori' => $request->input('kategori') ?: null,
            'periode' => $periode['periode'],
            'tanggal_mulai' => $periode['tanggal_mulai'],
            'tanggal_sampai' => $periode['tanggal_sampai'],
            'tanggal_mulai_raw' => $request->input('tanggal_mulai') ?: '',
            'tanggal_sampai_raw' => $request->input('tanggal_sampai') ?: '',
        ];
    }
}
