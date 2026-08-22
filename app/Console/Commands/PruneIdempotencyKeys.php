<?php

namespace App\Console\Commands;

use App\Models\IdempotencyKey;
use Illuminate\Console\Command;

class PruneIdempotencyKeys extends Command
{
    protected $signature = 'idempotency:prune {--hours=24 : Usia maksimum entri dalam jam}';

    protected $description = 'Hapus entri idempotency_keys yang sudah melewati TTL (default 24 jam)';

    public function handle(): int
    {
        $hours = max(1, (int) $this->option('hours'));

        $deleted = IdempotencyKey::where('created_at', '<', now()->subHours($hours))->delete();

        $this->info("{$deleted} entri idempotency kedaluwarsa dihapus.");

        return self::SUCCESS;
    }
}
