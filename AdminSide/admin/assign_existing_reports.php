<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Assigning Existing Reports to Stations ===\n\n";

// Get all reports that are not assigned
$unassignedReports = DB::table('reports')
    ->whereNull('assigned_station_id')
    ->get();

echo "Found {$unassignedReports->count()} unassigned reports\n\n";

$assigned = 0;
$skipped = 0;
$errors = 0;

foreach ($unassignedReports as $report) {
    try {
        // Get location
        $location = DB::table('locations')->where('location_id', $report->location_id)->first();
        
        if (!$location || !$location->latitude || !$location->longitude) {
            echo "Report {$report->report_id}: No valid location - SKIPPED\n";
            $skipped++;
            continue;
        }
        
        // Use the existing auto-assignment logic
        $stationId = \App\Models\Report::autoAssignPoliceStation(
            $location->latitude,
            $location->longitude
        );
        
        if ($stationId) {
            DB::table('reports')
                ->where('report_id', $report->report_id)
                ->update([
                    'assigned_station_id' => $stationId,
                    'assigned_at' => now(),
                    'assigned_by' => null // Auto-assigned
                ]);
            
            $stationName = DB::table('police_stations')
                ->where('station_id', $stationId)
                ->value('station_name');
            
            echo "Report {$report->report_id}: Assigned to {$stationName} (ID: {$stationId})\n";
            $assigned++;
        } else {
            echo "Report {$report->report_id}: No matching station found - SKIPPED\n";
            $skipped++;
        }
    } catch (\Exception $e) {
        echo "Report {$report->report_id}: ERROR - {$e->getMessage()}\n";
        $errors++;
    }
}

echo "\n=== Summary ===\n";
echo "Total processed: {$unassignedReports->count()}\n";
echo "Assigned: {$assigned}\n";
echo "Skipped: {$skipped}\n";
echo "Errors: {$errors}\n";

// Show breakdown by station
echo "\n=== Reports by Station ===\n";
$breakdown = DB::table('reports')
    ->select('assigned_station_id', DB::raw('COUNT(*) as count'))
    ->groupBy('assigned_station_id')
    ->get();

foreach ($breakdown as $row) {
    if ($row->assigned_station_id) {
        $stationName = DB::table('police_stations')
            ->where('station_id', $row->assigned_station_id)
            ->value('station_name');
        echo "{$stationName} (ID: {$row->assigned_station_id}): {$row->count} reports\n";
    } else {
        echo "Unassigned: {$row->count} reports\n";
    }
}
