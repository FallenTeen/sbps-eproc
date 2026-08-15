<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Dokumen (dan model lain di app ini) memakai primary key UUID.
     * Kolom media.model_id yang awalnya unsignedBigInteger tidak bisa
     * menyimpan UUID, sehingga diubah menjadi string(36).
     */
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('model_id', 36)->change();
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->unsignedBigInteger('model_id')->change();
        });
    }
};
