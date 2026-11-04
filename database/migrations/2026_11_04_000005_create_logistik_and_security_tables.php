<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Update Tabel ritases (TD-E6, TD-E7, TD-E8) ──────────────────────
        Schema::table('ritases', function (Blueprint $table) {
            if (! Schema::hasColumn('ritases', 'sumber_angka_resmi')) {
                $table->enum('sumber_angka_resmi', ['driver', 'logistik'])->default('driver')->after('satuan_volume');
            }
            if (! Schema::hasColumn('ritases', 'wajib_jembatan_timbang')) {
                $table->boolean('wajib_jembatan_timbang')->default(false)->after('sumber_angka_resmi');
            }
            if (! Schema::hasColumn('ritases', 'ada_selisih')) {
                $table->boolean('ada_selisih')->default(false)->after('wajib_jembatan_timbang');
            }
        });

        // ── 2. Tabel ritase_muatans (TD-E3) ────────────────────────────────────
        if (! Schema::hasTable('ritase_muatans')) {
            Schema::create('ritase_muatans', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('ritase_id')->constrained('ritases')->cascadeOnDelete();
                $table->string('jenis_muatan');
                $table->uuid('material_id')->nullable();
                $table->decimal('jumlah_driver', 12, 3)->default(0);
                $table->string('satuan')->default('ton');
                $table->foreignUuid('dicatat_oleh')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('ritase_id');
            });
        }

        // ── 3. Tabel ritase_verifikasis (TD-E4, TD-E10) ───────────────────────
        if (! Schema::hasTable('ritase_verifikasis')) {
            Schema::create('ritase_verifikasis', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('ritase_id')->constrained('ritases')->cascadeOnDelete();
                $table->enum('tahap', ['logistik', 'security']);
                $table->enum('status', ['menunggu', 'terverifikasi', 'ditolak'])->default('menunggu');
                $table->decimal('jumlah_verifikasi', 12, 3)->nullable();
                $table->json('checklist')->nullable();
                $table->text('catatan')->nullable();
                $table->string('foto')->nullable();
                $table->foreignUuid('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('diverifikasi_pada')->nullable();
                $table->timestamps();

                $table->index(['ritase_id', 'tahap']);
            });
        }

        // ── 4. Tabel ritase_timbangs (TD-E5) ──────────────────────────────────
        if (! Schema::hasTable('ritase_timbangs')) {
            Schema::create('ritase_timbangs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('ritase_id')->constrained('ritases')->cascadeOnDelete();
                $table->decimal('berat_kosong_kg', 12, 2)->default(0);
                $table->decimal('berat_isi_kg', 12, 2)->default(0);
                $table->decimal('berat_netto_kg', 12, 2)->default(0);
                $table->enum('tara_sumber', ['master', 'timbang_ulang'])->default('master');
                $table->string('nomor_tiket')->nullable();
                $table->string('foto_tiket')->nullable();
                $table->foreignUuid('ditimbang_oleh')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('ditimbang_pada')->nullable();
                $table->timestamps();

                $table->index('ritase_id');
            });
        }

        // ── 5. Tabel buku_tamus (TD-F2) ───────────────────────────────────────
        if (! Schema::hasTable('buku_tamus')) {
            Schema::create('buku_tamus', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('nama');
                $table->integer('jumlah_orang')->default(1);
                $table->string('asal');
                $table->string('nomor_telepon')->nullable();
                $table->enum('kendaraan', ['tanpa_kendaraan', 'motor', 'mobil', 'truk', 'lainnya'])->default('tanpa_kendaraan');
                $table->string('plat_nomor')->nullable();
                $table->string('foto')->nullable();
                $table->timestamp('waktu_masuk')->nullable();
                $table->timestamp('waktu_keluar')->nullable();
                $table->text('catatan')->nullable();
                $table->foreignUuid('dicatat_oleh')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('waktu_masuk');
            });
        }

        // ── 6. Tabel security_checklist_runs (TD-F3) ──────────────────────────
        if (! Schema::hasTable('security_checklist_runs')) {
            Schema::create('security_checklist_runs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('periode')->default('harian_siang');
                $table->string('jam_pantau')->nullable();
                $table->date('tanggal');
                $table->json('items')->nullable();
                $table->text('catatan')->nullable();
                $table->foreignUuid('security_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('tanggal');
            });
        }

        // ── 7. Tabel security_laporan_darurats (TD-F4) ────────────────────────
        if (! Schema::hasTable('security_laporan_darurats')) {
            Schema::create('security_laporan_darurats', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('kategori');
                $table->string('judul');
                $table->text('deskripsi');
                $table->string('lokasi_ruangan');
                $table->enum('tingkat', ['rendah', 'sedang', 'tinggi', 'siaga', 'darurat', 'kritis'])->default('sedang');
                $table->enum('status', ['baru', 'ditangani', 'selesai'])->default('baru');
                $table->foreignUuid('ditangani_oleh')->nullable()->constrained('users')->nullOnDelete();
                $table->text('catatan_penanganan')->nullable();
                $table->foreignUuid('pelapor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('security_laporan_darurats');
        Schema::dropIfExists('security_checklist_runs');
        Schema::dropIfExists('buku_tamus');
        Schema::dropIfExists('ritase_timbangs');
        Schema::dropIfExists('ritase_verifikasis');
        Schema::dropIfExists('ritase_muatans');

        Schema::table('ritases', function (Blueprint $table) {
            $table->dropColumn(['sumber_angka_resmi', 'wajib_jembatan_timbang', 'ada_selisih']);
        });
    }
};
