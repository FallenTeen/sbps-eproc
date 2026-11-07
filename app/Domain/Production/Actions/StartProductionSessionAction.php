<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StartProductionSessionAction
{
    public function execute(array $data): ProductionSession
    {
        return DB::transaction(function () use ($data) {
            // Kunci baris mesin agar dua request paralel tidak sama-sama lolos
            // pemeriksaan sesi aktif (satu mesin hanya boleh satu sesi berjalan).
            MesinProduksi::whereKey($data['mesin_id'])->lockForUpdate()->first();

            $sudahBerjalan = ProductionSession::query()
                ->where('mesin_id', $data['mesin_id'])
                ->where('status', 'berjalan')
                ->exists();

            if ($sudahBerjalan) {
                throw ValidationException::withMessages([
                    'mesin_id' => 'Mesin ini masih memiliki sesi produksi yang berjalan.',
                ]);
            }

            $session = ProductionSession::create([
                'mesin_id' => $data['mesin_id'],
                'titik_id' => $data['titik_id'],
                'produk_id' => $data['produk_id'],
                'operator_karyawan_id' => $data['operator_karyawan_id'],
                'client_uuid' => $data['client_uuid'] ?? null,
                'mulai' => now(),
                'status' => 'berjalan',
                'catatan' => $data['catatan'] ?? null,
            ]);

            $session->load(['mesin', 'produk', 'operator', 'titik']);

            return $session;
        });
    }
}
