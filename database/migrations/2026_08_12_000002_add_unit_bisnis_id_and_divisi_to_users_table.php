<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('unit_bisnis_id')->nullable()->after('password');
            $table->string('divisi')->nullable()->after('unit_bisnis_id');

            $table->foreign('unit_bisnis_id')->references('id')->on('unit_bisnis')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['unit_bisnis_id']);
            $table->dropColumn(['unit_bisnis_id', 'divisi']);
        });
    }
};
