<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('armada_checklist_harians', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('checkable'); // armada atau mesin_produksi
            $table->date('tanggal');
            $table->boolean('kondisi_baik')->default(true);
            $table->text('item_bermasalah')->nullable();
            $table->uuid('dicatat_oleh_karyawan_id');
            $table->timestamps();

            $table->foreign('dicatat_oleh_karyawan_id')->references('id')->on('karyawans');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('armada_checklist_harians');
    }
};
