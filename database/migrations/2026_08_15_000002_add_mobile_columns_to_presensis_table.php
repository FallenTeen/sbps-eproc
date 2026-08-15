<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presensis', function (Blueprint $table) {
            $table->string('check_in_photo')->nullable()->after('check_in_lng');
            $table->json('check_in_photo_metadata')->nullable()->after('check_in_photo');
            $table->string('check_out_photo')->nullable()->after('check_out_lng');
            $table->json('check_out_photo_metadata')->nullable()->after('check_out_photo');
            $table->string('device_id')->nullable()->after('catatan_override');
        });
    }

    public function down(): void
    {
        Schema::table('presensis', function (Blueprint $table) {
            $table->dropColumn([
                'check_in_photo',
                'check_in_photo_metadata',
                'check_out_photo',
                'check_out_photo_metadata',
                'device_id',
            ]);
        });
    }
};
