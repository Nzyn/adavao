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
        Schema::create('crime_forecasts', function (Blueprint $table) {
            $table->id('forecast_id');
            $table->unsignedBigInteger('location_id');
            $table->date('forecast_date');
            $table->integer('predicted_count');
            $table->string('model_used');
            $table->float('confidence_score');
            $table->timestamps();
            
            $table->foreign('location_id')->references('location_id')->on('locations')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crime_forecasts');
    }
};
