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
        // Rute Tarif
        Schema::create('rute_tarifs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_bisnis_id');
            $table->string('lokasi_asal');
            $table->string('lokasi_tujuan');
            $table->decimal('jarak_km', 8, 2);
            $table->decimal('tarif_per_rit', 15, 2);
            $table->decimal('indeks_liter_solar_per_km', 6, 3)->nullable();
            $table->date('berlaku_dari');
            $table->date('berlaku_sampai')->nullable();
            $table->timestamps();

            $table->foreign('unit_bisnis_id')
                ->references('id')
                ->on('unit_bisnis');
        });

        // Ritase
        Schema::create('ritases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('armada_id');
            $table->uuid('driver_karyawan_id');
            $table->date('tanggal');
            $table->uuid('rute_tarif_id')->nullable();
            $table->string('kategori')->nullable();
            $table->string('material')->nullable();
            $table->integer('jumlah_rit');

            $table->decimal('tarif_per_rit_snapshot', 15, 2);

            $table->decimal('total_upah_rit', 15, 2)
                ->storedAs('jumlah_rit * tarif_per_rit_snapshot');

            $table->uuid('proyek_id')->nullable();
            $table->uuid('titik_id')->nullable();
            $table->string('customer')->nullable();

            $table->enum('status', [
                'draft',
                'disetujui',
                'ditagih',
            ])->default('draft');

            $table->text('catatan')->nullable();
            $table->uuid('invoice_id')->nullable();

            $table->timestamps();

            $table->foreign('armada_id')
                ->references('id')
                ->on('armadas');

            $table->foreign('driver_karyawan_id')
                ->references('id')
                ->on('karyawans');

            $table->foreign('rute_tarif_id')
                ->references('id')
                ->on('rute_tarifs');

            $table->foreign('proyek_id')
                ->references('id')
                ->on('proyeks');

            $table->foreign('invoice_id')
                ->references('id')
                ->on('invoices');

            $table->foreign('titik_id')
                ->references('id')
                ->on('titiks');
        });

        // Biaya lain per ritase
        Schema::create('ritase_biaya_lains', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ritase_id');

            $table->enum('jenis', [
                'bbm',
                'upah_kenek',
                'uang_makan',
                'insentif',
                'standby',
                'lainnya',
            ]);

            $table->decimal('jumlah', 15, 2);
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('ritase_id')
                ->references('id')
                ->on('ritases')
                ->onDelete('cascade');
        });

        // Sewa Alat per Jam
        Schema::create('sewa_alat_jams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('armada_id');
            $table->uuid('proyek_id')->nullable();
            $table->string('penyewa_eksternal')->nullable();
            $table->string('lokasi_pekerjaan')->nullable();

            $table->decimal('harga_per_jam_snapshot', 15, 2);

            $table->date('tanggal');

            $table->decimal('hm_awal', 10, 2)->nullable();
            $table->decimal('hm_akhir', 10, 2)->nullable();
            $table->decimal('jumlah_jam', 8, 2);

            $table->enum('status', [
                'draft',
                'disetujui',
                'ditagih',
            ])->default('draft');

            $table->text('catatan')->nullable();
            $table->uuid('invoice_id')->nullable();

            $table->timestamps();

            $table->foreign('armada_id')
                ->references('id')
                ->on('armadas');

            $table->foreign('proyek_id')
                ->references('id')
                ->on('proyeks');

            $table->foreign('invoice_id')
                ->references('id')
                ->on('invoices');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ritase_biaya_lains');
        Schema::dropIfExists('ritases');
        Schema::dropIfExists('sewa_alat_jams');
        Schema::dropIfExists('rute_tarifs');
    }
};
