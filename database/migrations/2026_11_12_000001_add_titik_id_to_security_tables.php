<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buku_tamus', function (Blueprint $table) {
            $table->uuid('titik_id')->nullable()->after('dicatat_oleh');
        });

        Schema::table('security_checklist_runs', function (Blueprint $table) {
            $table->uuid('titik_id')->nullable()->after('security_id');
        });
    }

    public function down(): void
    {
        Schema::table('buku_tamus', function (Blueprint $table) {
            $table->dropColumn('titik_id');
        });

        Schema::table('security_checklist_runs', function (Blueprint $table) {
            $table->dropColumn('titik_id');
        });
    }
};
