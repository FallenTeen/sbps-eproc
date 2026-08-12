<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\ProductionSession;
use Illuminate\Support\Facades\DB;

class StartProductionSessionAction
{
    public function execute(array $data): ProductionSession
    {
        return DB::transaction(function () use ($data) {
            $session = ProductionSession::create([
                'mesin_id' => $data['mesin_id'],
                'titik_id' => $data['titik_id'],
                'produk_id' => $data['produk_id'],
                'operator_karyawan_id' => $data['operator_karyawan_id'],
                'mulai' => now(),
                'status' => 'berjalan',
                'catatan' => $data['catatan'] ?? null,
            ]);

            $session->load(['mesin', 'produk', 'operator', 'titik']);

            return $session;
        });
    }
}