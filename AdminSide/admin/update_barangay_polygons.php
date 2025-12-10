<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Barangay;

// Path to the converted GeoJSON file
$geoJsonPath = 'd:\Codes\alertdavao\alertdavao\UserSide\backends\converted_polygons.geojson';

if (!file_exists($geoJsonPath)) {
    die("Error: GeoJSON file not found at $geoJsonPath\n");
}

echo "Loading GeoJSON from $geoJsonPath...\n";
$jsonContent = file_get_contents($geoJsonPath);
$data = json_decode($jsonContent, true);

if (!$data || !isset($data['features'])) {
    die("Error: Invalid GeoJSON format.\n");
}

echo "Found " . count($data['features']) . " features.\n";

$updatedCount = 0;
$notFoundCount = 0;

foreach ($data['features'] as $feature) {
    if (!isset($feature['properties']['name'])) {
        continue;
    }

    $name = $feature['properties']['name'];
    
    // Normalize name for matching (e.g., "Barangay 38-D" -> "38-D" might be needed depending on DB)
    // Checking how names are stored in DB first.
    // Based on previous debug output, DB has names like "Barangay 38-D (Pob.)" or similar.
    // The GeoJSON has "Barangay 38-D".
    // We'll try exact match first, then partial match.

    echo "Processing: $name... ";

    $barangay = Barangay::where('barangay_name', $name)->first();

    if (!$barangay) {
        // Try fuzzy match
        $barangay = Barangay::where('barangay_name', 'LIKE', "%$name%")->first();
    }

    if ($barangay) {
        // Update geometry
        $geometry = json_encode($feature['geometry']);
        
        // Also update osm_id if available (GeoJSON ID usually looks like "relation/123")
        if (isset($feature['id'])) {
            $barangay->osm_id = $feature['id'];
        }

        $barangay->boundary_polygon = $geometry;
        $barangay->save();
        
        echo "UPDATED (ID: {$barangay->barangay_id})\n";
        $updatedCount++;
    } else {
        echo "NOT FOUND in DB\n";
        $notFoundCount++;
    }
}

echo "\nSummary:\n";
echo "Updated: $updatedCount\n";
echo "Not Found: $notFoundCount\n";
