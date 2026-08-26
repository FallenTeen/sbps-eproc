<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Penyimpanan response untuk middleware Idempotency-Key
     * (presensi check-in / check-out, formulir/store).
     *
     * Unique dibuat komposit (key, user_id, endpoint) agar:
     * - dua request paralel dengan key sama tidak bisa menyimpan dobel (race-safe);
     * - kebetulan key sama antar user / endpoint tetap dipisah.
     */
    public function up(): void
    {
        Schema::create('idempotency_keys', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('key');
            $table->uuid('user_id');
            $table->string('endpoint', 100);
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->json('response_body')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->unique(['key', 'user_id', 'endpoint']);
            $table->index('created_at');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');
    }
};
