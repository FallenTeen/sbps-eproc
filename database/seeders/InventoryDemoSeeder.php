<?php

namespace Database\Seeders;

use App\Domain\Inventory\Actions\CreateStokOpnameAction;
use App\Domain\Procurement\Models\StokMutasi;
use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InventoryDemoSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $user = User::where('email', 'test.inventory@dummy.com')->first()
            ?? User::where('email', 'owner@real.com')->first()
            ?? User::query()->first();
        $mutasi = StokMutasi::query()->where('tipe', 'masuk')->orderBy('tanggal')->first();

        if (! $user || ! $mutasi) {
            $this->command?->warn('[InventoryDemoSeeder] User atau mutasi stok belum tersedia; stok opname demo dilewati.');

            return;
        }

        $items = DB::table('stok_mutasis')
            ->where('titik_id', $mutasi->titik_id)
            ->select('bahan_baku_id')
            ->distinct()
            ->limit(3)
            ->get()
            ->values()
            ->map(fn ($row, $index) => [
                'bahan_baku_id' => $row->bahan_baku_id,
                'saldo_fisik' => max(0, (float) DB::table('stok_mutasis')
                    ->where('titik_id', $mutasi->titik_id)
                    ->where('bahan_baku_id', $row->bahan_baku_id)
                    ->whereDate('tanggal', '<=', now()->subDay()->toDateString())
                    ->selectRaw("COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE -jumlah END), 0) as saldo")
                    ->value('saldo') + ($index === 0 ? 2 : -1)),
                'catatan' => 'DATA DEMO STOK OPNAME - saldo fisik simulasi.',
            ])
            ->all();

        if ($items === []) {
            $this->command?->warn('[InventoryDemoSeeder] Tidak ada bahan baku dengan mutasi; stok opname demo dilewati.');

            return;
        }

        app(CreateStokOpnameAction::class)->execute(
            $user,
            $mutasi->titik_id,
            now()->subDay()->toDateString(),
            $items
        );

        $this->command?->info('[InventoryDemoSeeder] Stok opname demo disiapkan.');
    }
}
