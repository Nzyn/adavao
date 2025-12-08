<?php
/**
 * Process GeoJSON file to extract barangay boundaries and centroids
 * Run with: php -f process_geojson_boundaries.php
 */

require __DIR__ . '/../AdminSide/admin/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../AdminSide/admin/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Load GeoJSON file
$geojsonPath = 'd:/Downloads/export (3).geojson';
if (!file_exists($geojsonPath)) {
    die("❌ GeoJSON file not found at: $geojsonPath\n");
}

$geojsonContent = file_get_contents($geojsonPath);
$geojson = json_decode($geojsonContent, true);

if (!$geojson || !isset($geojson['features'])) {
    die("❌ Invalid GeoJSON format\n");
}

echo "📍 Processing " . count($geojson['features']) . " features from GeoJSON...\n\n";

$processedBarangays = [];

foreach ($geojson['features'] as $feature) {
    if ($feature['type'] !== 'Feature') {
        continue;
    }

    // Extract barangay name from properties
    $properties = $feature['properties'] ?? [];
    $name = $properties['name'] ?? null;
    $shortName = $properties['short_name'] ?? null;
    
    if (!$name) {
        continue;
    }

    // Get geometry
    $geometry = $feature['geometry'] ?? null;
    if (!$geometry || $geometry['type'] !== 'Polygon') {
        echo "⚠️  Skipping $name - not a polygon\n";
        continue;
    }

    // Calculate centroid from polygon coordinates
    $coordinates = $geometry['coordinates'][0]; // Get outer ring
    $centroid = calculateCentroid($coordinates);
    
    // Store the processed data
    $processedBarangays[] = [
        'name' => $name,
        'short_name' => $shortName,
        'latitude' => $centroid['lat'],
        'longitude' => $centroid['lng'],
        'boundary_polygon' => json_encode($geometry),
        'osm_id' => $properties['@id'] ?? null,
        'population' => $properties['population'] ?? null,
        'ref' => $properties['ref'] ?? null
    ];

    echo "✅ Processed: $name (Lat: {$centroid['lat']}, Lng: {$centroid['lng']})\n";
}

echo "\n" . str_repeat("=", 80) . "\n";
echo "📊 Summary: Processed " . count($processedBarangays) . " barangays\n";
echo str_repeat("=", 80) . "\n\n";

// Save to JSON file for reference
$outputPath = __DIR__ . '/../processed_barangay_boundaries.json';
file_put_contents($outputPath, json_encode($processedBarangays, JSON_PRETTY_PRINT));
echo "💾 Saved processed data to: $outputPath\n\n";

// Display the data for verification
echo "📋 Processed Barangays:\n";
foreach ($processedBarangays as $brgy) {
    echo sprintf(
        "  - %-30s | Lat: %10.6f | Lng: %10.6f\n",
        $brgy['name'],
        $brgy['latitude'],
        $brgy['longitude']
    );
}

/**
 * Calculate centroid of a polygon
 * @param array $coordinates Array of [lng, lat] pairs
 * @return array ['lat' => float, 'lng' => float]
 */
function calculateCentroid(array $coordinates): array
{
    $numPoints = count($coordinates);
    if ($numPoints === 0) {
        return ['lat' => 0, 'lng' => 0];
    }

    $totalLat = 0;
    $totalLng = 0;

    foreach ($coordinates as $coord) {
        $totalLng += $coord[0];
        $totalLat += $coord[1];
    }

    return [
        'lat' => round($totalLat / $numPoints, 8),
        'lng' => round($totalLng / $numPoints, 8)
    ];
}
