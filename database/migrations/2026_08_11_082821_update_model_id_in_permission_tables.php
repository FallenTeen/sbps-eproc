<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->char('model_id', 36)->change();
        });
        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->char('model_id', 36)->change();
        });
    }

    public function down()
    {
        // Kembalikan ke tipe semula (jika perlu)
        // Tapi ini rumit, kita bisa skip
    }
};
