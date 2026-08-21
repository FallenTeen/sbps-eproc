<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('produks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_bisnis_id');
            $table->string('nama');
            $table->string('kategori')->nullable(); // SPLIT/HOTMIX/BETON_COR/dst
            $table->enum('satuan_output', ['ton', 'm3'])->default('ton');
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->foreign('unit_bisnis_id')->references('id')->on('unit_bisnis');
        });
        // mesin_produksi
        Schema::create('mesin_produksis', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_bisnis_id');
            $table->string('nama');
            $table->enum('jenis', ['crusher', 'mixer_aspal', 'mixer_beton']);
            $table->string('kapasitas')->nullable();
            $table->enum('status', ['aktif', 'servis', 'nonaktif'])->default('aktif');
            $table->uuid('titik_id')->nullable();
            $table->uuid('produk_id')->nullable(); // default output
            $table->decimal('biaya_per_jam', 15, 2)->nullable(); // estimasi operasional
            $table->timestamps();

            $table->foreign('unit_bisnis_id')->references('id')->on('unit_bisnis');
            $table->foreign('titik_id')->references('id')->on('titiks');
            $table->foreign('produk_id')->references('id')->on('produks');
        });

        // harga_jual (histori)
        Schema::create('harga_juals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('produk_id');
            $table->decimal('harga', 15, 2);
            $table->date('berlaku_dari');
            $table->date('berlaku_sampai')->nullable();
            $table->timestamps();
            $table->foreign('produk_id')->references('id')->on('produks');
        });

        // resep_produksi (BOM)
        Schema::create('resep_produksis', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('produk_id');
            $table->uuid('bahan_baku_id');
            $table->decimal('jumlah_per_unit_output', 15, 4); // misal kg per m³
            $table->timestamps();
            $table->foreign('produk_id')->references('id')->on('produks');
            $table->foreign('bahan_baku_id')->references('id')->on('bahan_bakus');
        });

        // mix_design_template
        Schema::create('mix_design_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('mutu_beton'); // FC10, FC15, ...
            $table->string('nama')->nullable();
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });

        Schema::create('mix_design_template_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('mix_design_template_id');
            $table->uuid('bahan_baku_id');
            $table->decimal('jumlah_per_m3', 15, 4);
            $table->timestamps();
            $table->foreign('mix_design_template_id')->references('id')->on('mix_design_templates');
            $table->foreign('bahan_baku_id')->references('id')->on('bahan_bakus');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produks');
        Schema::dropIfExists('mesin_produksis');
        Schema::dropIfExists('harga_juals');
        Schema::dropIfExists('resep_produksis');
        Schema::dropIfExists('mix_design_templates');
        Schema::dropIfExists('mix_design_template_items');
    }
};
