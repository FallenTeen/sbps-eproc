<?php

namespace Database\Seeders;

use App\Domain\Fleet\Models\Armada;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class ArmadaFotoPreviewSeeder extends Seeder
{
    use StagingOnly;

    private const FOTO_URLS = [
        'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80&fm=png',
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80&fm=png',
        'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=1200&q=80&fm=png',
    ];

    public function run(): void
    {
        $this->assertNotProduction();

        foreach (Armada::query()->orderBy('kode_unit')->limit(6)->get() as $index => $armada) {
            if ($armada->hasMedia('foto_unit')) {
                continue;
            }

            $url = self::FOTO_URLS[$index % count(self::FOTO_URLS)];
            $path = 'armada/foto-preview/armada-preview-'.(($index % 3) + 1).'.png';

            if (! Storage::disk('public')->exists($path)) {
                try {
                    $response = Http::timeout(15)->get($url);
                } catch (ConnectionException $exception) {
                    $this->command?->warn("[ArmadaFotoPreviewSeeder] Gagal mengunduh {$url}: {$exception->getMessage()}");
                    continue;
                }

                $contentType = $response->header('Content-Type') ?? '';

                if (! $response->successful() || ! str_starts_with($contentType, 'image/png') || strlen($response->body()) > 5_000_000) {
                    $this->command?->warn("[ArmadaFotoPreviewSeeder] Gagal mengunduh {$url}, dilewati.");
                    continue;
                }

                Storage::disk('public')->put($path, $response->body());
            }

            $armada->addMediaFromDisk($path, 'public')->toMediaCollection('foto_unit');
        }
    }
}
