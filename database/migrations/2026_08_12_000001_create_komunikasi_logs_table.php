<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('komunikasi_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('proyek_id');
            $table->uuid('user_id');
            $table->string('pengirim_role')->default('kontraktor'); // kantor / kontraktor
            $table->text('pesan');
            $table->timestamps();

            $table->foreign('proyek_id')->references('id')->on('proyeks')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('komunikasi_logs');
    }
};
