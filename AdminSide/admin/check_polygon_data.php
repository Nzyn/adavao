<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Police Station Polygon Data ===\n\n";

// Check PS2
$ps2 = DB::table('police_stations')->where('station_id', 2)->first();
if ($ps2) {
    echo "PS2 (Station ID: 2):\n";
    echo "  Name: {$ps2->station_name}\n";
    
    // Check for polygon columns
    $columns = DB::select("DESCRIBE police_stations");
    $polygonColumns = [];
    foreach ($columns as $col) {
        if (stripos($col->Field, 'polygon') !== false || 
            stripos($col->Field, 'boundary') !== false ||
            stripos($col->Field, 'geofence') !== false ||
            stripos($col->Field, 'coordinates') !== false) {
            $polygonColumns[] = $col->Field;
        }
    }
    
    echo "  Polygon-related columns found: " . implode(', ', $polygonColumns) . "\n";
    
    foreach ($polygonColumns as $col) {
        $value = $ps2->$col ?? 'NULL';
        if ($value && $value !== 'NULL') {
            echo "  {$col}: " . (strlen($value) > 100 ? substr($value, 0, 100) . '...' : $value) . "\n";
        }
    }
} else {
    echo "PS2 NOT FOUND\n";
}

echo "\n";

// Check PS3
$ps3 = DB::table('police_stations')->where('station_id', 3)->first();
if ($ps3) {
    echo "PS3 (Station ID: 3):\n";
    echo "  Name: {$ps3->station_name}\n";
    
    foreach ($polygonColumns as $col) {
        $value = $ps3->$col ?? 'NULL';
        if ($value && $value !== 'NULL') {
            echo "  {$col}: " . (strlen($value) > 100 ? substr($value, 0, 100) . '...' : $value) . "\n";
        }
    }
} else {
    echo "PS3 NOT FOUND\n";
}
