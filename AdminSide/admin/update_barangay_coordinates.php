<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Barangay Coordinates Update Tool ===\n\n";

// Get all barangays from database
$barangays = DB::table('barangays')
    ->select('barangay_name', 'latitude', 'longitude')
    ->get();

echo "Found " . count($barangays) . " barangays to update\n\n";

$updatedCount = 0;
$failedCount = 0;
$skippedCount = 0;
$failed = [];

foreach ($barangays as $index => $barangay) {
    $barangayName = $barangay->barangay_name;
    $progress = ($index + 1) . "/" . count($barangays);
    
    echo "[$progress] Processing: $barangayName";
    
    // Check if coordinates already exist and are valid
    if ($barangay->latitude && $barangay->longitude && 
        $barangay->latitude != 0 && $barangay->longitude != 0) {
        echo " - Skipped (already has coordinates)\n";
        $skippedCount++;
        continue;
    }
    
    // Search query for Nominatim
    $searchQuery = urlencode("$barangayName, Davao City, Philippines");
    
    // Using OpenStreetMap Nominatim API
    $url = "https://nominatim.openstreetmap.org/search?q=$searchQuery&format=json&limit=1";
    
    // Set user agent as required by Nominatim
    $options = [
        'http' => [
            'header' => "User-Agent: DavaoBarangayUpdater/1.0\r\n"
        ]
    ];
    $context = stream_context_create($options);
    
    // Fetch coordinates
    $response = @file_get_contents($url, false, $context);
    
    if ($response) {
        $data = json_decode($response, true);
        
        if (!empty($data) && isset($data[0]['lat']) && isset($data[0]['lon'])) {
            $lat = floatval($data[0]['lat']);
            $lon = floatval($data[0]['lon']);
            
            // Validate that coordinates are in Davao City area (rough bounds)
            // Davao City is approximately between 6.8° to 7.4° N and 125.2° to 125.8° E
            if ($lat >= 6.5 && $lat <= 7.5 && $lon >= 125.0 && $lon <= 126.0) {
                // Update database
                DB::table('barangays')
                    ->where('barangay_name', $barangayName)
                    ->update([
                        'latitude' => $lat,
                        'longitude' => $lon
                    ]);
                
                echo " - Updated ($lat, $lon)\n";
                $updatedCount++;
            } else {
                echo " - Failed (coordinates outside Davao City bounds)\n";
                $failedCount++;
                $failed[] = $barangayName;
            }
        } else {
            echo " - Failed (no results found)\n";
            $failedCount++;
            $failed[] = $barangayName;
        }
    } else {
        echo " - Failed (API error)\n";
        $failedCount++;
        $failed[] = $barangayName;
    }
    
    // Be nice to Nominatim - wait 1 second between requests
    sleep(1);
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "Summary:\n";
echo "  Updated: $updatedCount\n";
echo "  Skipped (already has coords): $skippedCount\n";
echo "  Failed: $failedCount\n";

if (!empty($failed)) {
    echo "\nFailed barangays:\n";
    foreach ($failed as $i => $name) {
        echo "  " . ($i + 1) . ". $name\n";
    }
}

echo "\n✓ Coordinate update complete!\n";
