<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('barangays')) {
            Schema::create('barangays', function (Blueprint $table) {
                $table->id('barangay_id');
                $table->string('barangay_name', 100);
                $table->unsignedBigInteger('station_id');
                $table->double('latitude')->nullable();
                $table->double('longitude')->nullable();
                $table->timestamps();

                // Foreign key constraint
                $table->foreign('station_id')
                    ->references('station_id')
                    ->on('police_stations')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barangays');
    }
};
