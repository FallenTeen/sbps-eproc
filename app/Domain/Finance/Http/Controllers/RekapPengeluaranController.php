<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Domain\Finance\Actions\GetRekapPengeluaranAction;
use App\Domain\Finance\Exports\RekapPengeluaranExport;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\RekapManual;
use App\Domain\Finance\Models\RekapPublikSetting;
use App\Domain\Finance\Support\PeriodeRekap;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class RekapPengeluaranController extends Controller
{
    /**
     * Menu Rekap Pengeluaran (TD-D1) - hanya transaksi keluar,
     * tanpa kartu pemasukan/selisih.
     */
    public function index(Request $request)
    {
        $filters = $this->resolveFilters($request);

        $rekap = (new GetRekapPengeluaranAction)->execute(
            $filters['unit_bisnis_id'],
            $filters['kategori'],
            $filters['akun_kas_id'],
            $filters['tanggal_mulai'],
            $filters['tanggal_sampai'],
        );

        $setting = RekapPublikSetting::current();
        $plain = $this->decryptPublikPassword($setting);

        return Inertia::render('Finance/RekapPengeluaran/Index', [
            'transaksi' => $rekap['transaksi'],
            'summary' => [
                'total_pengeluaran' => $rekap['total_pengeluaran'],
            ],
            'unitBisnisList' => AkunKasBank::query()
                ->join('unit_bisnis', 'unit_bisnis.id', '=', 'akun_kas_banks.unit_bisnis_id')
                ->where('akun_kas_banks.aktif', true)
                ->orderBy('unit_bisnis.nama')
                ->select('unit_bisnis.id', 'unit_bisnis.nama')
                ->distinct()
                ->get(),
            'akunKasList' => AkunKasBank::where('aktif', true)
                ->orderBy('nama')
                ->get(['id', 'nama', 'unit_bisnis_id']),
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
                'akun_kas_id' => $filters['akun_kas_id'] ?? '',
            ],
            'periode_preset' => PeriodeRekap::PRESETS,
            'periode_label' => $rekap['periode_label'],
            'publik' => [
                'requires_password' => $setting->requires_password,
                'revealable' => $plain !== null,
                'password' => $plain,
                'password_length' => $plain !== null ? strlen($plain) : 6,
                'url' => route('rekap-pengeluaran-publik.index'),
            ],
        ]);
    }

    /**
     * Penyesuaian manual - hanya bertipe keluar, ditulis ke
     * mutasi_kas_banks (satu sumber kebenaran yang sama dengan Rekap Kas).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateMutasi($request);

        $manual = RekapManual::create(['created_by' => Auth::id()]);

        MutasiKasBank::create([
            'akun_kas_bank_id' => $validated['akun_kas_bank_id'],
            'kategori' => $validated['kategori'],
            'tipe' => 'keluar',
            'jumlah' => $validated['jumlah'],
            'tanggal' => $validated['tanggal'],
            'catatan' => $validated['catatan'] ?? null,
            'referensi_type' => RekapManual::class,
            'referensi_id' => $manual->id,
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('finance.rekap-pengeluaran.index')
            ->with('success', 'Pengeluaran berhasil dicatat. Saldo kas ikut diperbarui.');
    }

    /**
     * Hanya baris manual (referensi RekapManual) yang boleh diubah.
     */
    public function update(Request $request, MutasiKasBank $mutasiKas): RedirectResponse
    {
        $this->assertManualRow($mutasiKas);

        $validated = $this->validateMutasi($request);

        $mutasiKas->update([
            'akun_kas_bank_id' => $validated['akun_kas_bank_id'],
            'kategori' => $validated['kategori'],
            'tipe' => 'keluar',
            'jumlah' => $validated['jumlah'],
            'tanggal' => $validated['tanggal'],
            'catatan' => $validated['catatan'] ?? null,
        ]);

        return redirect()->route('finance.rekap-pengeluaran.index')
            ->with('success', 'Pengeluaran berhasil diperbarui.');
    }

    /**
     * Hanya baris manual yang boleh dihapus.
     */
    public function destroy(MutasiKasBank $mutasiKas): RedirectResponse
    {
        $this->assertManualRow($mutasiKas);

        $mutasiKas->delete();
        RekapManual::find($mutasiKas->referensi_id)?->delete();

        return redirect()->route('finance.rekap-pengeluaran.index')
            ->with('success', 'Pengeluaran berhasil dihapus.');
    }

    /**
     * Export Excel (.xlsx) khusus pengeluaran.
     */
    public function export(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $rekap = (new GetRekapPengeluaranAction)->execute(
            $filters['unit_bisnis_id'],
            $filters['kategori'],
            $filters['akun_kas_id'],
            $filters['tanggal_mulai'],
            $filters['tanggal_sampai'],
        );

        $rows = $this->buildRows($rekap['transaksi']);

        $export = new RekapPengeluaranExport(
            ['No', 'Tanggal', 'Unit Bisnis', 'Akun Kas', 'Kategori', 'Jumlah (Rp)', 'Catatan'],
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

    /**
     * Panel sandi halaman publik pindah ke sini (TD-D4) - singleton
     * rekap_publik_settings dipakai ulang; sandi tetap reversible
     * (Crypt::encryptString) agar bisa direveal sebagai pengingat.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|min:6|max:64',
        ]);

        $setting = RekapPublikSetting::current();
        $setting->password = Crypt::encryptString($validated['password']);
        $setting->updated_by = Auth::id();
        $setting->save();

        return redirect()->route('finance.rekap-pengeluaran.index')
            ->with('success', 'Password halaman publik berhasil diperbarui.');
    }

    protected function validateMutasi(Request $request): array
    {
        return $request->validate([
            'akun_kas_bank_id' => 'required|exists:akun_kas_banks,id',
            'kategori' => 'required|string|max:255',
            'jumlah' => 'required|numeric|min:0.01',
            'tanggal' => 'required|date',
            'catatan' => 'nullable|string|max:500',
        ]);
    }

    protected function assertManualRow(MutasiKasBank $mutasiKas): void
    {
        abort_if($mutasiKas->referensi_type !== RekapManual::class, 403,
            'Hanya transaksi manual rekap yang boleh diubah/dihapus.');
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
            'akun_kas_id' => $request->input('akun_kas_id') ?: null,
            'periode' => $periode['periode'],
            'tanggal_mulai' => $periode['tanggal_mulai'],
            'tanggal_sampai' => $periode['tanggal_sampai'],
            'tanggal_mulai_raw' => $request->input('tanggal_mulai') ?: '',
            'tanggal_sampai_raw' => $request->input('tanggal_sampai') ?: '',
        ];
    }

    /**
     * Dekripsi password publik; null jika belum diatur / tidak bisa
     * didekripsi (legacy hash lama).
     */
    protected function decryptPublikPassword(RekapPublikSetting $setting): ?string
    {
        if (! $setting->requires_password) {
            return null;
        }

        try {
            return Crypt::decryptString($setting->password);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Ubah koleksi transaksi rekap menjadi baris data Excel.
     */
    protected function buildRows(iterable $transaksi): array
    {
        $rows = [];
        $no = 1;

        foreach ($transaksi as $row) {
            $rows[] = [
                $no++,
                $row['tanggal'],
                $row['unit_bisnis'],
                $row['akun_kas'],
                $row['kategori'],
                (float) $row['jumlah'],
                $row['catatan'],
            ];
        }

        return $rows;
    }
}
