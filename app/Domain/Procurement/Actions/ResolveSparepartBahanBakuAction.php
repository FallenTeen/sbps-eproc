<?php

namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\BahanBaku;
use Illuminate\Validation\ValidationException;

class ResolveSparepartBahanBakuAction
{
    public function execute(array $item, string $context = 'armada'): ?array
    {
        $nama = trim((string) ($item['nama_item'] ?? ''));
        $bahanBakuId = $item['bahan_baku_id'] ?? null;

        if (! $bahanBakuId && $nama === '') {
            return null;
        }

        $query = BahanBaku::query()->sparepart()->aktif();

        if ($bahanBakuId) {
            $master = (clone $query)->find($bahanBakuId);

            if (! $master || ($master->sparepart_untuk && $master->sparepart_untuk !== $context)) {
                throw ValidationException::withMessages([
                    'items' => 'Master sparepart tidak valid untuk sumber permintaan ini.',
                ]);
            }
        } else {
            $master = (clone $query)
                ->where('sparepart_untuk', $context)
                ->whereRaw('LOWER(nama) = ?', [mb_strtolower($nama)])
                ->first()
                ?? (clone $query)
                    ->whereNull('sparepart_untuk')
                    ->whereRaw('LOWER(nama) = ?', [mb_strtolower($nama)])
                    ->first();
        }

        $resolved = [
            'jumlah' => $item['jumlah'] ?? 1,
            'nominal' => $item['nominal'] ?? 0,
            'tanggal' => $item['tanggal'] ?? null,
            'catatan' => $item['catatan'] ?? null,
            'foto_nota' => $item['foto_nota'] ?? null,
        ];

        if (! $master) {
            return $resolved + [
                'bahan_baku_id' => null,
                'nama_item' => $nama,
                'satuan' => $item['satuan'] ?? null,
            ];
        }

        return $resolved + [
            'bahan_baku_id' => $master->id,
            'nama_item' => $master->nama,
            'satuan' => $master->satuan ?: ($item['satuan'] ?? null),
        ];
    }
}
