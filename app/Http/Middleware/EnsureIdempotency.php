<?php

namespace App\Http\Middleware;

use App\Models\IdempotencyKey;
use Closure;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class EnsureIdempotency
{
    /**
     * TTL entri idempotency (jam).
     */
    private const TTL_HOURS = 24;

    /**
     * Batas tunggu request kembar yang datang bersamaan (detik).
     */
    private const RACE_WAIT_SECONDS = 10;

    /**
     * Generic Idempotency-Key untuk endpoint tulis mobile yang punya guard
     * "maks 1x per hari" (check-in, check-out, formulir):
     *  1. Header Idempotency-Key (uuid) wajib ada → 422 jika tidak.
     *  2. Retry dengan key + user + endpoint yang sama → response asli
     *     dibalas ulang persis sama TANPA memproses controller lagi.
     *  3. Hanya response sukses (2xx) yang disimpan; error tidak disimpan
     *     agar client bisa memperbaiki payload lalu retry dengan key sama.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $key = (string) $request->header('Idempotency-Key', '');

        if ($key === '' || ! Str::isUuid($key)) {
            throw ValidationException::withMessages([
                'Idempotency-Key' => ['Header Idempotency-Key (format uuid) wajib dikirim.'],
            ]);
        }

        $endpoint = $this->endpoint($request);
        $cutoff = now()->subHours(self::TTL_HOURS);

        // Entri kedaluwarsa untuk key ini dibuang supaya key bisa dipakai
        // kembali setelah TTL dan tidak menabrak unique constraint.
        IdempotencyKey::where('key', $key)->where('created_at', '<', $cutoff)->delete();

        if ($stored = $this->findStored($user->id, $endpoint, $key, $cutoff)) {
            return $this->replay($stored);
        }

        // Kunci singkat: dua request identik yang menembak bersamaan
        // diserialisasi supaya controller tidak diproses dobel.
        // Cache store tanpa dukungan atomic lock → lanjut tanpa kunci.
        try {
            $lock = Cache::lock("idempotency:{$user->id}:{$endpoint}:{$key}", self::RACE_WAIT_SECONDS + 5);
            $acquired = $lock->get();
        } catch (\Throwable) {
            $lock = null;
            $acquired = true;
        }

        try {
            if (! $acquired) {
                $stored = $this->waitForStored($user->id, $endpoint, $key, $cutoff);

                if ($stored) {
                    return $this->replay($stored);
                }
                // Pemenang tampaknya gagal menyimpan (error) → proses normal.
            }

            $response = $next($request);

            if ($response->isSuccessful()) {
                try {
                    IdempotencyKey::create([
                        'key' => $key,
                        'user_id' => $user->id,
                        'endpoint' => $endpoint,
                        'response_status' => $response->getStatusCode(),
                        'response_body' => $response->getContent(),
                        'created_at' => now(),
                    ]);
                } catch (UniqueConstraintViolationException) {
                    // Kalah race di tingkat DB: pemenang sudah menyimpan → balas itu.
                    $winner = IdempotencyKey::query()
                        ->where('key', $key)
                        ->where('user_id', $user->id)
                        ->where('endpoint', $endpoint)
                        ->firstOrFail();

                    return $this->replay($winner);
                }
            }

            return $response;
        } finally {
            $lock?->release();
        }
    }

    private function endpoint(Request $request): string
    {
        return $request->route()?->getName() ?: $request->getPathInfo();
    }

    private function findStored(int|string $userId, string $endpoint, string $key, $cutoff): ?IdempotencyKey
    {
        return IdempotencyKey::query()
            ->where('key', $key)
            ->where('user_id', $userId)
            ->where('endpoint', $endpoint)
            ->where('created_at', '>=', $cutoff)
            ->first();
    }

    private function waitForStored(int|string $userId, string $endpoint, string $key, $cutoff): ?IdempotencyKey
    {
        $deadline = microtime(true) + self::RACE_WAIT_SECONDS;

        do {
            usleep(200_000);

            if ($stored = $this->findStored($userId, $endpoint, $key, $cutoff)) {
                return $stored;
            }
        } while (microtime(true) < $deadline);

        return null;
    }

    private function replay(IdempotencyKey $stored): Response
    {
        return response($stored->response_body ?? 'null', (int) $stored->response_status)
            ->header('Content-Type', 'application/json')
            ->header('X-Idempotent-Replay', 'true');
    }
}
