<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Fleet\Models\WorkshopTodo;
use Illuminate\Database\Eloquent\Factories\Factory;

class WorkshopTodoFactory extends Factory
{
    protected $model = WorkshopTodo::class;

    public function definition(): array
    {
        return [
            'judul' => $this->faker->sentence(3),
            'deskripsi' => $this->faker->sentence(8),
            'jadwal_tipe' => 'mingguan',
            'jadwal_detail' => 'senin',
            'status' => 'terjadwal',
        ];
    }
}