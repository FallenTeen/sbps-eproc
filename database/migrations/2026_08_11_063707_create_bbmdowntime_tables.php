<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // bbm_log
        Schema::create('bbm_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('serviceable');
            $table->date('tanggal');
            $table->decimal('liter', 10, 2);
            $table->decimal('biaya', 15, 2)->nullable();
            $table->decimal('jam_operasional_saat_isi', 10, 2)->nullable();
            $table->uuid('purchase_order_id')->nullable();
            $table->uuid('dicatat_oleh');
            $table->timestamps();

            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders');
            $table->foreign('dicatat_oleh')->references('id')->on('users');
        });

        // downtime_log
        Schema::create('downtime_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('serviceable');
            $table->datetime('mulai');
            $table->datetime('selesai')->nullable();
            $table->string('penyebab')->nullable();
            $table->enum('kategori', ['kerusakan', 'menunggu_sparepart', 'lainnya'])->default('kerusakan');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bbm_logs');
        Schema::dropIfExists('downtimes');
    }
};
