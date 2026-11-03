<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Domain\Finance\Actions\GetRekapKasAction;
use App\Domain\Finance\Exports\RekapKasExport;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\RekapPublikSetting;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class RekapPublikController extends Controller
{
    /**
     * Halaman rekap untuk pelanggan - TANPA LOGIN.
     * Gate: password sederhana (session). Jika password belum
     * diatur oleh Owner, halaman bebas diakses.
     */
    public function index(Request $request)
    {
        $setting = RekapPublikSetting::current();
        $requiresPassword = $setting->requires_password;
        $unlocked = ! $requiresPassword || $request->session()->get('rekap_publik_unlocked', false);

        $filters = $this->resolveFilters($request);
        $rekap = null;

        if ($unlocked) {
            $rekap = (new GetRekapKasAction)->execute(
                $filters['unit_bisnis_id'],
                $filters['bulan'],
                $filters['tahun'],
            );
        }

        return Inertia::render('Public/RekapPublik', [
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
            'filters' => [
                'unit_bisnis_id' => $filters['unit_bisnis_id'] ?? '',
                'bulan' => $filters['bulan'] ? sprintf('%02d', $filters['bulan']) : '',
                'tahun' => $filters['tahun'] ? (string) $filters['tahun'] : '',
            ],
        ]);
    }

    /**
     * Verifikasi password publik → session gate.
     */
    public function unlock(Request $request): RedirectResponse
    {
        $setting = RekapPublikSetting::current();

        if (! $setting->requires_password) {
            return redirect()->route('rekap-publik.index');
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

        return redirect()->route('rekap-publik.index', $request->only(['unit_bisnis_id', 'bulan', 'tahun']));
    }

    public function lock(Request $request): RedirectResponse
    {
        $request->session()->forget('rekap_publik_unlocked');

        return redirect()->route('rekap-publik.index');
    }

    /**
     * Export Excel (.xlsx) publik (hanya jika terbuka).
     */
    public function export(Request $request)
    {
        $setting = RekapPublikSetting::current();
        $unlocked = ! $setting->requires_password || $request->session()->get('rekap_publik_unlocked', false);

        abort_unless($unlocked, 403);

        $filters = $this->resolveFilters($request);
        $rekap = (new GetRekapKasAction)->execute(
            $filters['unit_bisnis_id'],
            $filters['bulan'],
            $filters['tahun'],
        );

        $rows = [];
        $no = 1;

        foreach ($rekap['transaksi'] as $row) {
            $rows[] = [
                $no++,
                $row['tanggal'],
                $row['unit_bisnis'],
                $row['kategori'],
                ucfirst($row['tipe']),
                (float) $row['jumlah'],
                $row['catatan'],
            ];
        }

        $export = new RekapKasExport(
            ['No', 'Tanggal', 'Unit Bisnis', 'Kategori', 'Jenis', 'Jumlah (Rp)', 'Catatan'],
            $rows,
            [
                ['Total Pemasukan', $rekap['total_masuk']],
                ['Total Pengeluaran', $rekap['total_keluar']],
                ['Selisih', $rekap['selisih']],
            ],
            'Rekapitulasi Pemasukan & Pengeluaran - '.$rekap['periode_label'],
            'Rekap',
        );

        return Excel::download(
            $export,
            Str::slug('rekap_pemasukan_pengeluaran').'_'.date('Ymd_His').'.xlsx',
        );
    }

    protected function resolveFilters(Request $request): array
    {
        $bulan = (int) $request->input('bulan', 0);
        $tahun = (int) $request->input('tahun', 0);

        return [
            'unit_bisnis_id' => $request->input('unit_bisnis_id') ?: null,
            'bulan' => $bulan >= 1 && $bulan <= 12 ? $bulan : null,
            'tahun' => $tahun >= 2000 && $tahun <= 2100 ? $tahun : null,
        ];
    }
}
