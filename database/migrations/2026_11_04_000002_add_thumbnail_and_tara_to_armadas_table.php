<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * TD-C1: foto unit (media library)
     * TD-C2: data_diperbarui_pada & data_diperbarui_oleh
     * TD-E2: tara_master_kg & tara_diperbarui_pada
     */
    public function up(): void
    {
        Schema::table('armadas', function (Blueprint $table) {
            $table->timestamp('data_diperbarui_pada')->nullable()->after('status');
            $table->foreignUuid('data_diperbarui_oleh')->nullable()->after('data_diperbarui_pada')->constrained('users')->nullOnDelete();
            $table->decimal('tara_master_kg', 10, 2)->nullable()->after('data_diperbarui_oleh');
            $table->timestamp('tara_diperbarui_pada')->nullable()->after('tara_master_kg');
        });
    }

    public function down(): void
    {
        Schema::table('armadas', function (Blueprint $table) {
            $table->dropForeign(['data_diperbarui_oleh']);
            $table->dropColumn([
                'data_diperbarui_pada',
                'data_diperbarui_oleh',
                'tara_master_kg',
                'tara_diperbarui_pada',
            ]);
        });
    }
};
