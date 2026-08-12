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
        // akun_kas_bank (sudah ada di eprocurement, tapi kita tambahkan jika belum)
// migrasi sudah dibuat sebelumnya, jadi kita skip.

        // transfer_antar_kas
        Schema::create('transfer_antar_kas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('dari_akun_kas_bank_id');
            $table->uuid('ke_akun_kas_bank_id');
            $table->decimal('jumlah', 15, 2);
            $table->date('tanggal');
            $table->text('catatan')->nullable();
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('dari_akun_kas_bank_id')->references('id')->on('akun_kas_banks');
            $table->foreign('ke_akun_kas_bank_id')->references('id')->on('akun_kas_banks');
            $table->foreign('created_by')->references('id')->on('users');
        });

        // invoice
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_bisnis_id');
            $table->uuid('proyek_id')->nullable();
            $table->string('kode_invoice')->unique();
            $table->integer('termin_pembayaran_hari')->default(30);
            $table->date('tanggal_terbit');
            $table->date('tanggal_jatuh_tempo');
            $table->enum('status', ['draft', 'terkirim', 'lunas_sebagian', 'lunas', 'jatuh_tempo'])->default('draft');
            $table->text('catatan')->nullable();
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('unit_bisnis_id')->references('id')->on('unit_bisnis');
            $table->foreign('proyek_id')->references('id')->on('proyeks');
            $table->foreign('created_by')->references('id')->on('users');
        });

        // invoice_items (polymorphic)
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('invoice_id');
            $table->string('deskripsi');
            $table->morphs('referensi'); // production_sessions, ritase, sewa_alat_jam
            $table->decimal('jumlah', 15, 2);
            $table->decimal('harga_satuan', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
        });

        // pembayaran_klien
        Schema::create('pembayaran_kliens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('invoice_id');
            $table->date('tanggal');
            $table->decimal('jumlah', 15, 2);
            $table->string('metode')->nullable();
            $table->uuid('akun_kas_bank_id');
            $table->uuid('dicatat_oleh');
            $table->string('dokumen_bukti')->nullable(); // path
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices');
            $table->foreign('akun_kas_bank_id')->references('id')->on('akun_kas_banks');
            $table->foreign('dicatat_oleh')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfer_antar_kas');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('pembayaran_kliens');
    }
};
