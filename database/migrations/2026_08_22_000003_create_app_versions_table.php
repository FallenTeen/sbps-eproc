<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('app', 20);
            $table->string('platform', 10);
            $table->string('min_version', 20);
            $table->string('latest_version', 20);
            $table->boolean('force_update')->default(false);
            $table->string('update_url');
            $table->text('changelog')->nullable();
            $table->timestamps();

            $table->unique(['app', 'platform']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_versions');
    }
};
