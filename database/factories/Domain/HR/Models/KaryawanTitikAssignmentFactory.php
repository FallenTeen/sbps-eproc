<?php

namespace Database\Factories\Domain\HR\Models;

use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Models\KaryawanTitikAssignment;
// use App\Domain\Core\Models\Titik; // If Titik has factory, otherwise manual creation in test
use Illuminate\Database\Eloquent\Factories\Factory;

class KaryawanTitikAssignmentFactory extends Factory
{
    protected $model = KaryawanTitikAssignment::class;

    public function definition()
    {
        return [
            'karyawan_id' => Karyawan::factory(),
            'titik_id' => $this->faker->uuid(), // Should be overridden in tests with actual Titik
            'status' => 'aktif',
            'assigned_at' => now(),
            'unassigned_at' => null,
            'catatan' => null,
        ];
    }
}
