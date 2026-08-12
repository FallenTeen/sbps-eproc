<?php

namespace Database\Factories\Domain\HR\Models;

use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Factories\Factory;

class KaryawanFactory extends Factory
{
    protected $model = Karyawan::class;

    public function definition()
    {
        return [
            'user_id' => null,
            'nama' => $this->faker->name(),
            'tipe' => $this->faker->randomElement(['tetap', 'harian', 'borongan_rit']),
            'jabatan' => $this->faker->jobTitle(),
            'rate_gaji_pokok' => 5000000,
            'rate_harian' => 150000,
            'npwp' => $this->faker->numerify('##.###.###.#-###.###'),
            'no_bpjs_ketenagakerjaan' => $this->faker->numerify('###########'),
            'no_bpjs_kesehatan' => $this->faker->numerify('###########'),
            'status_ptkp' => 'TK/0',
            'status' => 'aktif',
        ];
    }
}
