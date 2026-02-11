<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== PS2 San Pedro Check ===\n\n";

// Check PS2 station details
$ps2 = DB::table('police_stations')->where('station_id', 2)->first();
if ($ps2) {
    echo "PS2 Station: {$ps2->station_name}\n";
    echo "Station ID: {$ps2->station_id}\n\n";
} else {
    echo "PS2 NOT FOUND!\n";
    exit(1);
}

// Check how many barangays are assigned to PS2
$ps2Barangays = DB::table('barangays')->where('station_id', 2)->count();
echo "Barangays assigned to PS2: {$ps2Barangays}\n\n";

// Check reports assigned to PS2
$ps2Reports = DB::table('reports')->where('assigned_station_id', 2)->count();
echo "Reports assigned to PS2: {$ps2Reports}\n\n";

// If no reports, check if any reports fall in PS2 barangays
if ($ps2Reports == 0) {
    echo "Checking if any reports should be in PS2 area...\n";
    
    $ps2BarangayIds = DB::table('barangays')
        ->where('station_id', 2)
        ->pluck('barangay_id');
    
    echo "PS2 Barangay IDs: " . implode(', ', $ps2BarangayIds->toArray()) . "\n\n";
    
    // Check reports in those barangays
    $reportsInPs2Area = DB::table('reports')
        ->join('locations', 'reports.location_id', '=', 'locations.location_id')
        ->whereIn('locations.barangay_id', $ps2BarangayIds)
        ->count();
    
    echo "Reports with locations in PS2 barangays: {$reportsInPs2Area}\n";
}
