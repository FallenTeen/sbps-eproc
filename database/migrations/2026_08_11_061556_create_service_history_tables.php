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
        Schema::create('service_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('serviceable');
            $table->date('tanggal');
            $table->string('jenis_servis')->nullable();
            $table->decimal('biaya', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->uuid('purchase_order_id')->nullable(); // PO terkait jika beli sparepart resmi
            $table->timestamps();

            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servive_history');
    }
};
