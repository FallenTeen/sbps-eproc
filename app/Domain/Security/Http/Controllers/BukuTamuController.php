<?php

namespace App\Domain\Security\Http\Controllers;

use App\Domain\Security\Exports\BukuTamuExport;
use App\Domain\Security\Models\BukuTamu;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Web Security - Buku Tamu (TD-F2): daftar lintas hari, pencarian, filter,
 * tombol tandai keluar, dan ekspor Excel.
 */
class BukuTamuController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'cari' => 'nullable|string|max:100',
            'tanggal' => 'nullable|date',
            'kendaraan' => 'nullable|in:tanpa_kendaraan,motor,mobil,truk,lainnya',
        ]);

        $rows = $this->query($validated)->paginate(20)->withQueryString();

        return Inertia::render('Security/BukuTamu', [
            'rows' => $rows,
            'filters' => $validated,
        ]);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'cari' => 'nullable|string|max:100',
            'tanggal' => 'nullable|date',
            'kendaraan' => 'nullable|in:tanpa_kendaraan,motor,mobil,truk,lainnya',
        ]);

        $nama = 'buku-tamu_'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(new BukuTamuExport($this->query($validated)->get()), $nama);
    }

    public function keluar(BukuTamu $bukuTamu)
    {
        if (! $bukuTamu->waktu_keluar) {
            $bukuTamu->update(['waktu_keluar' => now()]);
        }

        return back()->with('success', 'Tamu '.$bukuTamu->nama.' ditandai keluar.');
    }

    private function query(array $filters)
    {
        return BukuTamu::query()->with('pencatat:id,name')
            ->when(! empty($filters['cari']), function ($q) use ($filters) {
                $c = $filters['cari'];
                $q->where(fn ($w) => $w->where('nama', 'like', "%{$c}%")
                    ->orWhere('asal', 'like', "%{$c}%")
                    ->orWhere('nomor_telepon', 'like', "%{$c}%")
                    ->orWhere('plat_nomor', 'like', "%{$c}%"));
            })
            ->when(! empty($filters['tanggal']), fn ($q) => $q->whereDate('waktu_masuk', $filters['tanggal']))
            ->when(! empty($filters['kendaraan']), fn ($q) => $q->where('kendaraan', $filters['kendaraan']))
            ->latest('waktu_masuk');
    }
}
