<?php
namespace App\Domain\Production\Actions;
class StartProductionSessionAction
{
    public function execute(array $data): ProductionSession
    {
        return ProductionSession::create([
            'mesin_id' => $data['mesin_id'],
            'titik_id' => $data['titik_id'],
            'produk_id' => $data['produk_id'],
            'operator_karyawan_id' => $data['operator_karyawan_id'],
            'mulai' => now(),
            'status' => 'berjalan',
        ]);
    }
}
