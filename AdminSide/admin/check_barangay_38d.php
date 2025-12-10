<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Barangay;
use App\Models\Station;

echo "\n--- DEBUG: Check Barangay 38-D Assignment ---\n";

$barangay = Barangay::where('barangay_name', 'LIKE', '%38-D%')->first();

if ($barangay) {
    echo "Found Barangay: " . $barangay->barangay_name . "\n";
    echo "Assigned Station ID: " . $barangay->station_id . "\n";
    echo "Polygon Length: " . strlen($barangay->boundary_polygon ?? '') . "\n";
    
    $station = Station::find($barangay->station_id);
    if ($station) {
        echo "Station Name: " . $station->name . "\n";
        echo "Station Address: " . $station->address . "\n";
    } else {
        echo "Station not found for ID: " . $barangay->station_id . "\n";
    }
} else {
    echo "Barangay 38-D not found in database.\n";
}

echo "\n--- End Debug ---\n";
