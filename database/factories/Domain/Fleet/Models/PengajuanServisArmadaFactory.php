<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PengajuanServisArmadaFactory extends Factory
{
    protected $model = PengajuanServisArmada::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'kode_pengajuan' => 'SVC-'.now()->format('Ymd').'-'.Str::upper(Str::random(5)),
            'tanggal_ajuan' => now()->toDateString(),
            'armada_id' => Armada::factory(),
            'diajukan_oleh' => User::factory(),
            'foto_armada' => null,
            'catatan_ajuan' => $this->faker->sentence,
            'catatan_acc' => null,
            'status' => 'diajukan',
            'disetujui_oleh' => null,
            'tanggal_acc' => null,
            'tanggal_mulai_kerja' => null,
            'tanggal_selesai_kerja' => null,
            'catatan_pengerjaan' => null,
            'butuh_sparepart' => false,
            'status_pengadaan_sparepart' => null,
            'total_biaya' => 0,
            'tanggal_selesai' => null,
        ];
    }
}
