<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Idempotency mobile API:
     * - client_uuid pada production_sessions / qc_samples / dokumens
     *   untuk mencegah dobel insert saat retry dari client.
     * - tracking_batches: satu batch_id merepresentasikan satu kiriman
     *   locations[] utuh (bukan per baris lokasi).
     */
    public function up(): void
    {
        Schema::table('production_sessions', function (Blueprint $table) {
            $table->uuid('client_uuid')->nullable()->unique()->after('operator_karyawan_id');
        });

        Schema::table('qc_samples', function (Blueprint $table) {
            $table->uuid('client_uuid')->nullable()->unique()->after('production_session_id');
        });

        Schema::table('dokumens', function (Blueprint $table) {
            // Satu request upload bisa berisi banyak file dengan SATU client_uuid,
            // sehingga unique dibuat komposit (client_uuid, nama):
            // - file dalam satu kiriman punya nama beda → boleh;
            // - retry identik (uuid + nama sama) → ditolak constraint (race-safe).
            $table->uuid('client_uuid')->nullable()->index()->after('uploaded_by');
            $table->unique(['client_uuid', 'nama']);
        });

        // Log kecil pencatat batch_id tracking yang sudah diproses.
        Schema::create('tracking_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('karyawan_id');
            $table->string('batch_id')->unique();
            $table->unsignedInteger('received_count')->default(0);
            $table->unsignedInteger('saved_count')->default(0);
            $table->timestamps();

            $table->foreign('karyawan_id')->references('id')->on('karyawans')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_batches');

        foreach (['production_sessions', 'qc_samples'] as $tableName) {
            if (Schema::hasColumn($tableName, 'client_uuid')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropUnique(['client_uuid']);
                    $table->dropColumn('client_uuid');
                });
            }
        }

        if (Schema::hasColumn('dokumens', 'client_uuid')) {
            Schema::table('dokumens', function (Blueprint $table) {
                // Versi lama memakai unique tunggal; versi baru komposit + index biasa.
                if (Schema::hasIndex('dokumens', 'dokumens_client_uuid_nama_unique')) {
                    $table->dropUnique(['client_uuid', 'nama']);
                } elseif (Schema::hasIndex('dokumens', 'dokumens_client_uuid_unique')) {
                    $table->dropUnique(['client_uuid']);
                }

                if (Schema::hasIndex('dokumens', 'dokumens_client_uuid_index')) {
                    $table->dropIndex(['client_uuid']);
                }
            });

            Schema::table('dokumens', function (Blueprint $table) {
                $table->dropColumn('client_uuid');
            });
        }
    }
};
