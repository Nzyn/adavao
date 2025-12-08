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
        if (!Schema::hasTable('police_stations')) {
            Schema::create('police_stations', function (Blueprint $table) {
                $table->id('station_id');
                $table->string('station_name', 100);
                $table->string('address', 255)->nullable();
                $table->double('latitude')->nullable();
                $table->double('longitude')->nullable();
                $table->string('contact_number', 50)->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('police_stations');
    }
};
