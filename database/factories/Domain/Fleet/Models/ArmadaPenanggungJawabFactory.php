<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ArmadaPenanggungJawabFactory extends Factory
{
    protected $model = ArmadaPenanggungJawab::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'armada_id' => Armada::factory(),
            'karyawan_id' => Karyawan::factory(),
            'peran' => 'utama',
            'mulai_dari' => now()->toDateString(),
            'sampai' => null,
            'alasan' => null,
            'created_by' => null,
        ];
    }
}
