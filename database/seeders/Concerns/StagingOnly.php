<?php

namespace Database\Seeders\Concerns;

use Database\Seeders\ProductionSeeder;
use RuntimeException;

/**
 * Menandai seeder yang hanya boleh dijalankan di environment non-production
 * (staging/dev/test).
 *
 * Jika seeder pemakai trait ini dijalankan saat APP_ENV=production, eksekusi
 * dibatalkan dengan exception. Ini sekaligus mengamankan pemanggilan langsung
 * `php artisan db:seed --class=...` yang melewati DatabaseSeeder.
 */
trait StagingOnly
{
    protected function assertNotProduction(): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException(sprintf(
                'Seeder [%s] hanya boleh dijalankan di staging/dev. Untuk menyiapkan data production, gunakan: php artisan db:seed --class=%s',
                static::class,
                ProductionSeeder::class
            ));
        }
    }
}
