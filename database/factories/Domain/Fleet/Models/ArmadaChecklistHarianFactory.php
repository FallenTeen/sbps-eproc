<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ArmadaChecklistHarianFactory extends Factory
{
    protected $model = ArmadaChecklistHarian::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'checkable_type' => \App\Domain\Fleet\Models\Armada::class,
            'checkable_id' => \App\Domain\Fleet\Models\Armada::factory(),
            'tanggal' => now()->toDateString(),
            'kondisi_baik' => true,
            'item_bermasalah' => null,
            'dicatat_oleh_karyawan_id' => Karyawan::factory(),
        ];
    }
}