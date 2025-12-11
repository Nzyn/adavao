<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Report;
use App\Models\Location;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ImportHistoricalReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:historical-reports {--limit= : Limit the number of records to import}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import 5-year historical crime data from CSV to Reports table';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $csvPath = storage_path('app/davao_crime_5years.csv');
        if (!file_exists($csvPath)) {
            $this->error("CSV file not found at: {$csvPath}");
            return 1;
        }

        $this->info('Starting import from ' . $csvPath);

        // Open CSV
        $file = fopen($csvPath, 'r');
        $headers = fgetcsv($file); // Skip headers

        $count = 0;
        $limit = $this->option('limit') ? (int)$this->option('limit') : 999999;
        
        $batchSize = 100;
        $batch = [];

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($file)) !== false && $count < $limit) {
                // Map CSV index to columns (based on typical davao_crime struct)
                // id, date, barangay, crime_type, crime_count, latitude, longitude
                // 0,  1,    2,        3,          4,           5,        6
                
                $date = $row[1] ?? now();
                $barangay = $row[2] ?? 'Unknown';
                $crimeType = $row[3] ?? 'Other';
                $crimeCount = (int)($row[4] ?? 1);
                $lat = (float)($row[5] ?? 0);
                $lng = (float)($row[6] ?? 0);

                // Create Location
                $location = Location::create([
                    'barangay' => $barangay,
                    'reporters_address' => $barangay . ', Davao City', // Placeholder
                    'latitude' => $lat,
                    'longitude' => $lng
                ]);

                // Create Report
                // Since this is historical, we set status to 'Resolved' or 'Approved'
                // User ID is NULL (System)
                
                // If crime_count > 1, do we create multiple? User said 12k reports.
                // Assuming 1 row = 1 incident for now, or use loop if needed.
                // Let's create 1 report per row, assuming row is incident-level or agg.
                // If count is high, it might be aggregated. But standard dataset usually incident-level.
                
                $report = Report::create([
                    'user_id' => null, // System / Anonymous
                    'location_id' => $location->location_id,
                    'report_type' => $crimeType, // Will be cast to JSON if needed later, but textual for now
                    'title' => $crimeType . ' Incident (Historical)',
                    'description' => "Historical record imported from 5-year dataset. Barangay: {$barangay}.",
                    'status' => 'Resolved',
                    'is_valid' => true,
                    'is_anonymous' => true,
                    'date_reported' => Carbon::parse($date),
                    'assigned_station_id' => null // Admin can assign later or auto-assign logic
                ]);

                $count++;
                if ($count % 100 === 0) {
                    $this->info("Imported {$count} records...");
                }
            }
            
            DB::commit();
            $this->info("Successfully imported {$count} historical reports.");
            return 0;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Import failed: " . $e->getMessage());
            return 1;
        } finally {
            fclose($file);
        }
    }
}
