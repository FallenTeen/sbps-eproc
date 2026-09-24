<?php

use App\Domain\Core\Models\Proyek;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot akses proyek per user (object-level scoping).
 *
 * Dipakai terutama untuk role eksternal `Kontraktor`: user hanya boleh
 * melihat proyek yang ditautkan di pivot ini. Owner/karyawan internal
 * tidak wajib diisi di sini — mereka tetap lewat permission/unit_bisnis.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proyek_user', function (Blueprint $table) {
            $table->uuid('proyek_id');
            $table->uuid('user_id');
            $table->timestamps();

            $table->primary(['proyek_id', 'user_id']);
            $table->index('user_id');

            $table->foreign('proyek_id')
                ->references('id')
                ->on($this->proyekTable())
                ->cascadeOnDelete();

            $table->foreign('user_id')
                ->references('id')
                ->on($this->userTable())
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proyek_user');
    }

    private function proyekTable(): string
    {
        return (new Proyek)->getTable();
    }

    private function userTable(): string
    {
        return (new User)->getTable();
    }
};