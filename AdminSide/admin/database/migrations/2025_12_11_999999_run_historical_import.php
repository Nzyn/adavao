<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Trigger the import command during migration
        // This allows running it on Render Free Tier without Shell access
        \Log::info('Starting automated historical data import...');
        Artisan::call('import:historical-reports');
        \Log::info('Historical data import completed: ' . Artisan::output());
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optional: Delete imported reports if needed?
        // For now, do nothing as it's data seeding.
    }
};
