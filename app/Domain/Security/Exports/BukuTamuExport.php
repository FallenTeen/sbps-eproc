<?php

namespace App\Domain\Security\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class BukuTamuExport implements FromCollection, WithHeadings
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows->map(fn ($t) => [
            'waktu_masuk' => optional($t->waktu_masuk)->format('Y-m-d H:i'),
            'nama' => $t->nama,
            'jumlah_orang' => $t->jumlah_orang,
            'asal' => $t->asal,
            'nomor_telepon' => $t->nomor_telepon,
            'kendaraan' => $t->kendaraan,
            'plat_nomor' => $t->plat_nomor,
            'waktu_keluar' => optional($t->waktu_keluar)->format('Y-m-d H:i'),
            'catatan' => $t->catatan,
            'dicatat_oleh' => $t->pencatat?->name,
        ]);
    }

    public function headings(): array
    {
        return ['Waktu Masuk', 'Nama', 'Jumlah Orang', 'Asal', 'No. Telepon', 'Kendaraan', 'Plat', 'Waktu Keluar', 'Catatan', 'Dicatat Oleh'];
    }
}
