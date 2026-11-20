<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ritases', function (Blueprint $table) {
            $table->timestamp('selesai_pada')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('ritases', function (Blueprint $table) {
            $table->dropColumn('selesai_pada');
        });
    }
};
