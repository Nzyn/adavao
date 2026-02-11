<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Verifying Auto-Assignment Fallback Removal ===\n\n";

// 1. Pick a coordinate known to be OUTSIDE all polygons (e.g., coordinates in the ocean or far away)
// Using coordinates roughly in the middle of Davao Gulf (approx 6.9, 125.8)
$lat_outside = 6.9000;
$lng_outside = 125.8000;

echo "Testing Coordinate OUTSIDE polygons: {$lat_outside}, {$lng_outside}\n";

$stationId = \App\Models\Report::autoAssignPoliceStation($lat_outside, $lng_outside);

if ($stationId === null) {
    echo "✓ SUCCESS: Report remained unassigned (station_id is null).\n";
} else {
    echo "✗ FAILURE: Report was assigned to station ID: {$stationId}.\n";
}

// 2. Pick a coordinate known to be INSIDE a polygon (e.g., PS3 Talomo area)
// Using coordinates from one of the successful tests earlier if available, or just a known PS3 point.
// Talomo (ID 856) polygon center approx.
$lat_inside = 7.0532; 
$lng_inside = 125.5496;

echo "\nTesting Coordinate INSIDE polygon (Talomo): {$lat_inside}, {$lng_inside}\n";

$stationIdInside = \App\Models\Report::autoAssignPoliceStation($lat_inside, $lng_inside);

if ($stationIdInside) {
     $station = DB::table('police_stations')->where('station_id', $stationIdInside)->first();
    echo "✓ SUCCESS: Report assigned to {$station->station_name} (ID: {$stationIdInside}).\n";
} else {
    echo "✗ FAILURE: Report was NOT assigned (unexpected).\n";
}
