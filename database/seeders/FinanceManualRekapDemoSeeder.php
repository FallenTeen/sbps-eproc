<?php

namespace Database\Seeders;

use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\RekapManual;
use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class FinanceManualRekapDemoSeeder extends Seeder
{
    use StagingOnly;

    private const CATATAN = 'DATA DEMO REKAP MANUAL - pengeluaran operasional.';

    public function run(): void
    {
        $this->assertNotProduction();

        if (MutasiKasBank::where('catatan', self::CATATAN)->exists()) {
            return;
        }

        $owner = User::where('email', 'owner@real.com')->first();
        $akun = AkunKasBank::where('nama', 'Kas Kecil GCS')->first();

        if (! $owner || ! $akun) {
            $this->command?->warn('[FinanceManualRekapDemoSeeder] Owner atau akun kas belum tersedia; rekap manual demo dilewati.');

            return;
        }

        $rekap = RekapManual::create(['created_by' => $owner->id]);
        MutasiKasBank::create([
            'akun_kas_bank_id' => $akun->id,
            'kategori' => 'Operasional',
            'tipe' => 'keluar',
            'jumlah' => 1_250_000,
            'referensi_type' => RekapManual::class,
            'referensi_id' => $rekap->id,
            'tanggal' => now()->subDays(2)->toDateString(),
            'catatan' => self::CATATAN,
            'created_by' => $owner->id,
        ]);

        $this->command?->info('[FinanceManualRekapDemoSeeder] Contoh pengeluaran manual disiapkan.');
    }
}
