<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Report;

class RecalculateUrgencyScores extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:recalculate-urgency';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculates urgency scores for all reports based on new crime type logic';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting urgency score recalculation...');

        $reports = DB::table('reports')->get();
        $count = 0;
        $updated = 0;

        // Crime Categories (Exact Match from UserSide)
        $CRITICAL_CRIMES = ['Murder', 'Homicide', 'Rape', 'Sexual Assault'];
        $HIGH_PRIORITY = ['Robbery', 'Physical Injury', 'Domestic Violence', 'Missing Person', 'Harassment'];
        $MEDIUM_PRIORITY = ['Theft', 'Burglary', 'Break-in', 'Carnapping', 'Motornapping', 'Threats', 'Fraud', 'Cybercrime'];

        foreach ($reports as $report) {
            $count++;
            
            // Parse crime types
            $crimeTypes = [];
            $rawType = $report->report_type; // DB column is 'report_type' or 'crime_type'? Let's check schema used report_type
            
            if (empty($rawType)) continue;

            // Handle JSON or String
            if ($this->isJson($rawType)) {
                $crimeTypes = json_decode($rawType, true);
                if (!is_array($crimeTypes)) $crimeTypes = [$crimeTypes];
            } else {
                $crimeTypes = [$rawType];
            }

            // Calculate Score
            $score = 30; // Base LOW
            
            $hasCritical = false;
            $hasHigh = false;
            $hasMedium = false;

            foreach ($crimeTypes as $crime) {
                // Case-insensitive exact match check if possible, or strict includes
                // Logic used in handleReport.js:
                if (in_array($crime, $CRITICAL_CRIMES)) $hasCritical = true;
                elseif (in_array($crime, $HIGH_PRIORITY)) $hasHigh = true;
                elseif (in_array($crime, $MEDIUM_PRIORITY)) $hasMedium = true;
                
                // Also check partials for legacy data compatibility
                 else {
                    foreach($CRITICAL_CRIMES as $c) if(stripos($crime, $c) !== false) $hasCritical = true;
                    if(!$hasCritical) foreach($HIGH_PRIORITY as $c) if(stripos($crime, $c) !== false) $hasHigh = true;
                    if(!$hasCritical && !$hasHigh) foreach($MEDIUM_PRIORITY as $c) if(stripos($crime, $c) !== false) $hasMedium = true;
                }
            }

            if ($hasCritical) $score = 100;
            elseif ($hasHigh) $score = 75;
            elseif ($hasMedium) $score = 50;

            // Update record
            DB::table('reports')->where('report_id', $report->report_id)->update(['urgency_score' => $score]);
            $updated++;
            
            if ($count % 50 == 0) $this->info("Processed $count reports...");
        }

        $this->info("✅ Completed! Updated $updated reports.");
    }

    private function isJson($string) {
        json_decode($string);
        return (json_last_error() == JSON_ERROR_NONE);
    }
}
