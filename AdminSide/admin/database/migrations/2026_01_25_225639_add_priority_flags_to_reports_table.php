<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->boolean('is_focus_crime')->default(false)->index()->after('urgency_score');
            $table->boolean('has_sufficient_info')->default(true)->index()->after('is_focus_crime');
        });

        // Update existing reports to set is_focus_crime based on report_type
        // 8 Focus Crimes: Murder, Homicide, Physical Injury, Rape, Robbery, Theft, Carnapping, Motorcycle Theft
        DB::statement("
            UPDATE reports 
            SET is_focus_crime = CASE 
                WHEN report_type::text ILIKE '%Murder%' THEN true
                WHEN report_type::text ILIKE '%Homicide%' THEN true
                WHEN report_type::text ILIKE '%Physical Injury%' THEN true
                WHEN report_type::text ILIKE '%Rape%' THEN true
                WHEN report_type::text ILIKE '%Robbery%' THEN true
                WHEN report_type::text ILIKE '%Theft%' THEN true
                WHEN report_type::text ILIKE '%Carnapping%' THEN true
                WHEN report_type::text ILIKE '%Motorcycle Theft%' THEN true
                WHEN report_type::text ILIKE '%Motornapping%' THEN true
                ELSE false 
            END
        ");

        // Set has_sufficient_info based on description length and location
        DB::statement("
            UPDATE reports 
            SET has_sufficient_info = CASE 
                WHEN description IS NOT NULL 
                    AND LENGTH(description) >= 20 
                    AND location_id IS NOT NULL 
                THEN true
                ELSE false 
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['is_focus_crime', 'has_sufficient_info']);
        });
    }
};
