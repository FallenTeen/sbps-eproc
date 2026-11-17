<?php

namespace App\Domain\Security\Http\Controllers;

use App\Domain\Security\Exports\BukuTamuExport;
use App\Domain\Security\Models\BukuTamu;
use App\Http\Controllers\Controller;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Web Security - Buku Tamu (TD-F2): daftar lintas hari, pencarian, filter,
 * tombol tandai keluar, dan ekspor Excel.
 */
class BukuTamuController extends Controller
{
    use FilterableTable;

    public function index(Request $request)
    {
        $columns = [
            'nama' => ['type' => 'like'],
            'asal' => ['type' => 'like'],
            'nomor_telepon' => ['type' => 'like'],
            'plat_nomor' => ['type' => 'like'],
            'kendaraan' => ['type' => 'exact'],
            'waktu_masuk' => ['type' => 'date'],
            'waktu_keluar' => ['type' => 'date'],
        ];

        $query = BukuTamu::query()->with('pencatat:id,name');

        $sort = $this->applyTableQuery($query, $request, $columns, ['waktu_masuk' => 'desc']);

        $rows = $query->paginate($this->tablePerPage($request))->withQueryString();

        return Inertia::render('Security/BukuTamu', [
            'rows' => $rows,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    public function export(Request $request)
    {
        $filters = $request->input('filters', []);

        $legacy = $request->only(['cari', 'tanggal', 'kendaraan']);

        $query = BukuTamu::query()->with('pencatat:id,name');

        if (! empty($filters)) {
            foreach ($filters as $key => $value) {
                if (is_array($value)) {
                    if (! empty($value['from'])) {
                        $query->whereDate($key, '>=', $value['from']);
                    }
                    if (! empty($value['to'])) {
                        $query->whereDate($key, '<=', $value['to']);
                    }
                } elseif (! empty($value)) {
                    if ($key === 'kendaraan') {
                        $query->where($key, $value);
                    } else {
                        $query->where($key, 'like', "%{$value}%");
                    }
                }
            }
        } elseif (! empty($legacy['cari'])) {
            $c = $legacy['cari'];
            $query->where(fn ($w) => $w->where('nama', 'like', "%{$c}%")
                ->orWhere('asal', 'like', "%{$c}%")
                ->orWhere('nomor_telepon', 'like', "%{$c}%")
                ->orWhere('plat_nomor', 'like', "%{$c}%"));
        }

        if (! empty($legacy['tanggal'])) {
            $query->whereDate('waktu_masuk', $legacy['tanggal']);
        }
        if (! empty($legacy['kendaraan'])) {
            $query->where('kendaraan', $legacy['kendaraan']);
        }

        $query->latest('waktu_masuk');

        $nama = 'buku-tamu_'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(new BukuTamuExport($query->get()), $nama);
    }

    public function keluar(BukuTamu $bukuTamu)
    {
        if (! $bukuTamu->waktu_keluar) {
            $bukuTamu->update(['waktu_keluar' => now()]);
        }

        return back()->with('success', 'Tamu '.$bukuTamu->nama.' ditandai keluar.');
    }
}
