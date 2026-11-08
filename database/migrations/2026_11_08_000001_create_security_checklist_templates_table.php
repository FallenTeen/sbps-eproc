<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TD-F3 (additive): master template checklist pemantauan kantor Security.
 * - security_checklist_templates: header template (periode, jam mulai/selesai, hari aktif).
 * - security_checklist_template_items: item urut per template.
 * - security_checklist_run_items: jawaban per item saat run (diisi mobile/web nanti).
 *
 * Tabel `security_checklist_runs` yang sudah ada tetap dipakai (items JSON) -
 * migrasi ini tidak mengubahnya (nullable/additive).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_checklist_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama');
            $table->enum('periode', ['harian', 'malam', 'custom'])->default('harian');
            $table->string('jam_mulai', 5)->nullable();
            $table->string('jam_selesai', 5)->nullable();
            $table->json('hari')->nullable();
            $table->boolean('aktif')->default(true);
            $table->uuid('dibuat_oleh')->nullable();
            $table->timestamps();

            $table->foreign('dibuat_oleh')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('security_checklist_template_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->unsignedInteger('urutan')->default(1);
            $table->string('teks', 500);
            $table->timestamps();

            $table->foreign('template_id')->references('id')->on('security_checklist_templates')->cascadeOnDelete();
        });

        Schema::create('security_checklist_run_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('run_id');
            $table->uuid('template_item_id')->nullable();
            $table->boolean('done')->default(false);
            $table->string('catatan', 1000)->nullable();
            $table->string('foto')->nullable();
            $table->timestamp('waktu')->nullable();
            $table->timestamps();

            $table->foreign('run_id')->references('id')->on('security_checklist_runs')->cascadeOnDelete();
            $table->foreign('template_item_id')->references('id')->on('security_checklist_template_items')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_checklist_run_items');
        Schema::dropIfExists('security_checklist_template_items');
        Schema::dropIfExists('security_checklist_templates');
    }
};
