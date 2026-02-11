<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Assigning Reports (Batch Processing) ===\n\n";

// Process in batches to avoid timeout
$batchSize = 100;
$offset = 0;
$totalAssigned = 0;
$totalSkipped = 0;

while (true) {
    $reports = DB::table('reports')
        ->whereNull('assigned_station_id')
        ->offset($offset)
        ->limit($batchSize)
        ->get();
    
    if ($reports->count() == 0) {
        break;
    }
    
    echo "Processing batch starting at offset {$offset}...\n";
    
    foreach ($reports as $report) {
        try {
            $location = DB::table('locations')->where('location_id', $report->location_id)->first();
            
            if (!$location || !$location->latitude || !$location->longitude) {
                $totalSkipped++;
                continue;
            }
            
            $stationId = \App\Models\Report::autoAssignPoliceStation(
                $location->latitude,
                $location->longitude
            );
            
            if ($stationId) {
                DB::table('reports')
                    ->where('report_id', $report->report_id)
                    ->update([
                        'assigned_station_id' => $stationId,
                        'assigned_at' => now()
                    ]);
                $totalAssigned++;
            } else {
                $totalSkipped++;
            }
        } catch (\Exception $e) {
            $totalSkipped++;
        }
    }
    
    $offset += $batchSize;
    
    // Stop after 500 reports to avoid timeout
    if ($offset >= 500) {
        echo "\nProcessed 500 reports, stopping to avoid timeout.\n";
        echo "Run again to process more.\n";
        break;
    }
}

echo "\n=== Summary ===\n";
echo "Assigned: {$totalAssigned}\n";
echo "Skipped: {$totalSkipped}\n";

// Check PS2 now
$ps2Count = DB::table('reports')->where('assigned_station_id', 2)->count();
echo "\nPS2 now has: {$ps2Count} reports\n";
