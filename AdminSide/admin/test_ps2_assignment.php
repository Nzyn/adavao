<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing PS2 Assignment ===\n\n";

// Get a sample unassigned report
$sampleReport = DB::table('reports')
    ->join('locations', 'reports.location_id', '=', 'locations.location_id')
    ->whereNull('reports.assigned_station_id')
    ->whereNotNull('locations.latitude')
    ->whereNotNull('locations.longitude')
    ->select('reports.report_id', 'locations.latitude', 'locations.longitude', 'locations.location_id')
    ->first();

if ($sampleReport) {
    echo "Testing with report {$sampleReport->report_id}\n";
    echo "Location: {$sampleReport->latitude}, {$sampleReport->longitude}\n\n";
    
    // Try to assign it
    $stationId = \App\Models\Report::autoAssignPoliceStation(
        $sampleReport->latitude,
        $sampleReport->longitude
    );
    
    if ($stationId) {
        $station = DB::table('police_stations')->where('station_id', $stationId)->first();
        echo "✓ Would be assigned to: {$station->station_name} (ID: {$stationId})\n";
        
        if ($stationId == 2) {
            echo "✓ This IS a PS2 report!\n";
        }
    } else {
        echo "✗ No station match found\n";
    }
}

echo "\n=== Re-running Assignment for ALL Reports ===\n";
echo "This will assign ALL unassigned reports...\n";

$unassigned = DB::table('reports')
    ->whereNull('assigned_station_id')
    ->count();

echo "Found {$unassigned} unassigned reports\n";
echo "Run assign_existing_reports.php to assign them all.\n";
