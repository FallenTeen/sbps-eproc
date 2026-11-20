<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Domain\Finance\Actions\GetRekapKasAction;
use App\Domain\Finance\Exports\RekapKasExport;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\RekapManual;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class RekapKasController extends Controller
{
    /**
     * Rekapitulasi pemasukan & pengeluaran (Owner + Keuangan).
     */
    public function index(Request $request)
    {
        $filters = $this->resolveFilters($request);

        $rekap = (new GetRekapKasAction)->execute(
            $filters['unit_bisnis_id'],
            $filters['bulan'],
            $filters['tahun'],
        );

        return Inertia::render('Finance/RekapKas/Index', [
            'transaksi' => $rekap['transaksi'],
            'summary' => [
                'total_masuk' => $rekap['total_masuk'],
                'total_keluar' => $rekap['total_keluar'],
                'selisih' => $rekap['selisih'],
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
            'filters' => [
                'unit_bisnis_id' => $filters['unit_bisnis_id'] ?? '',
                'bulan' => $filters['bulan'] ? sprintf('%02d', $filters['bulan']) : '',
                'tahun' => $filters['tahun'] ? (string) $filters['tahun'] : '',
            ],
            'periode_label' => $rekap['periode_label'],
        ]);
    }

    /**
     * Tambah penyesuaian manual - ditulis ke mutasi_kas_banks
     * agar saldo kas & rekap tetap satu sumber kebenaran.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateMutasi($request);

        $manual = RekapManual::create(['created_by' => Auth::id()]);

        MutasiKasBank::create([
            'akun_kas_bank_id' => $validated['akun_kas_bank_id'],
            'kategori' => $validated['kategori'],
            'tipe' => $validated['tipe'],
            'jumlah' => $validated['jumlah'],
            'tanggal' => $validated['tanggal'],
            'catatan' => $validated['catatan'] ?? null,
            'referensi_type' => RekapManual::class,
            'referensi_id' => $manual->id,
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('finance.rekap-kas.index')
            ->with('success', 'Transaksi rekap berhasil dicatat. Saldo kas ikut diperbarui.');
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
            'tipe' => $validated['tipe'],
            'jumlah' => $validated['jumlah'],
            'tanggal' => $validated['tanggal'],
            'catatan' => $validated['catatan'] ?? null,
        ]);

        return redirect()->route('finance.rekap-kas.index')
            ->with('success', 'Transaksi rekap berhasil diperbarui.');
    }

    /**
     * Hanya baris manual yang boleh dihapus.
     */
    public function destroy(MutasiKasBank $mutasiKas): RedirectResponse
    {
        $this->assertManualRow($mutasiKas);

        $mutasiKas->delete();
        RekapManual::find($mutasiKas->referensi_id)?->delete();

        return redirect()->route('finance.rekap-kas.index')
            ->with('success', 'Transaksi rekap berhasil dihapus.');
    }

    /**
     * Export Excel (.xlsx) - format kolom rapi via RekapKasExport.
     */
    public function export(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $rekap = (new GetRekapKasAction)->execute(
            $filters['unit_bisnis_id'],
            $filters['bulan'],
            $filters['tahun'],
        );

        $rows = $this->buildRows($rekap['transaksi'], true);

        $export = new RekapKasExport(
            ['No', 'Tanggal', 'Unit Bisnis', 'Akun Kas', 'Kategori', 'Jenis', 'Jumlah (Rp)', 'Catatan'],
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

    protected function validateMutasi(Request $request): array
    {
        return $request->validate([
            'akun_kas_bank_id' => 'required|exists:akun_kas_banks,id',
            'kategori' => 'required|string|max:255',
            'tipe' => 'required|in:masuk,keluar',
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
        $bulan = (int) $request->input('bulan', 0);
        $tahun = (int) $request->input('tahun', 0);

        return [
            'unit_bisnis_id' => $request->input('unit_bisnis_id') ?: null,
            'bulan' => $bulan >= 1 && $bulan <= 12 ? $bulan : null,
            'tahun' => $tahun >= 2000 && $tahun <= 2100 ? $tahun : null,
        ];
    }

    /**
     * Ubah koleksi transaksi rekap menjadi baris data Excel.
     */
    protected function buildRows(iterable $transaksi, bool $withAkun = true): array
    {
        $rows = [];
        $no = 1;

        foreach ($transaksi as $row) {
            $cells = [
                $no++,
                $row['tanggal'],
                $row['unit_bisnis'],
            ];

            if ($withAkun) {
                $cells[] = $row['akun_kas'];
            }

            $cells[] = $row['kategori'];
            $cells[] = ucfirst($row['tipe']);
            $cells[] = (float) $row['jumlah'];
            $cells[] = $row['catatan'];

            $rows[] = $cells;
        }

        return $rows;
    }
}
