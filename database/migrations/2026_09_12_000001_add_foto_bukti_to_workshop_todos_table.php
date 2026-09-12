<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Foto bukti untuk to-do Workshop dari mobile (workshop/job/{id}/todo/{todo}/photo).
 *
 * `foto_bukti` menyimpan path relatif di disk 'public'; akses via
 * `asset('storage/'.foto_bukti)` (kontrak Flutter `WorkshopTodoItem.photoPath`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workshop_todos', function (Blueprint $table) {
            $table->string('foto_bukti')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('workshop_todos', function (Blueprint $table) {
            $table->dropColumn('foto_bukti');
        });
    }
};