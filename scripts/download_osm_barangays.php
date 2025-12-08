<?php
/**
 * Download all Davao City barangay boundaries from OpenStreetMap
 * Run with: php -f download_osm_barangays.php
 */

echo "🌍 Downloading Davao City Barangay Boundaries from OpenStreetMap\n";
echo str_repeat("=", 80) . "\n\n";

// Overpass API query to get all barangays in Davao City
$query = <<<EOQ
[out:json][timeout:180];
area["name"="Davao City"]["admin_level"="5"]->.davao;
(
  relation["boundary"="administrative"]["admin_level"="10"]["admin_type:PH"="barangay"](area.davao);
);
out geom;
EOQ;

$url = 'https://overpass-api.de/api/interpreter';
$data = http_build_query(['data' => $query]);

echo "📡 Sending request to Overpass API...\n";
echo "⏳ This may take 1-2 minutes, please wait...\n\n";

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => $data,
        'timeout' => 300, // 5 minutes timeout
        'user_agent' => 'AlertDavao-BarangayBoundaryDownloader/1.0',
    ]
]);

$startTime = time();
$result = @file_get_contents($url, false, $context);
$duration = time() - $startTime;

if ($result === false) {
    echo "❌ Download failed!\n";
    echo "Possible reasons:\n";
    echo "  - No internet connection\n";
    echo "  - Overpass API is down or rate-limited\n";
    echo "  - Query timeout\n\n";
    echo "Try again in a few minutes or use Overpass Turbo manually:\n";
    echo "https://overpass-turbo.eu/\n";
    exit(1);
}

echo "✅ Download completed in {$duration} seconds\n\n";

// Parse the result to check validity
$data = json_decode($result, true);

if (!$data || !isset($data['elements'])) {
    echo "❌ Invalid response from Overpass API\n";
    echo "Response: " . substr($result, 0, 200) . "...\n";
    exit(1);
}

$elementCount = count($data['elements']);
echo "📊 Downloaded {$elementCount} barangay boundaries\n\n";

// Convert to GeoJSON format
$geojson = [
    'type' => 'FeatureCollection',
    'generator' => 'overpass-api',
    'copyright' => 'The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.',
    'timestamp' => date('c'),
    'features' => [],
];

echo "🔄 Converting to GeoJSON format...\n";

foreach ($data['elements'] as $element) {
    if ($element['type'] !== 'relation') {
        continue;
    }

    $tags = $element['tags'] ?? [];
    
    // Build geometry from members
    $coordinates = [];
    if (isset($element['members'])) {
        foreach ($element['members'] as $member) {
            if ($member['role'] === 'outer' && isset($member['geometry'])) {
                $coords = [];
                foreach ($member['geometry'] as $node) {
                    $coords[] = [$node['lon'], $node['lat']];
                }
                if (!empty($coords)) {
                    $coordinates[] = $coords;
                }
            }
        }
    }

    if (empty($coordinates)) {
        echo "  ⚠️  No geometry for: " . ($tags['name'] ?? 'Unknown') . "\n";
        continue;
    }

    $feature = [
        'type' => 'Feature',
        'properties' => [
            '@id' => $element['id'] ?? null,
            'name' => $tags['name'] ?? null,
            'short_name' => $tags['short_name'] ?? null,
            'admin_level' => $tags['admin_level'] ?? null,
            'admin_type:PH' => $tags['admin_type:PH'] ?? null,
            'boundary' => $tags['boundary'] ?? null,
            'population' => $tags['population'] ?? null,
            'population:date' => $tags['population:date'] ?? null,
            'postal_code' => $tags['postal_code'] ?? null,
            'ref' => $tags['ref'] ?? null,
            'is_in:city' => $tags['is_in:city'] ?? null,
            'is_in:district' => $tags['is_in:district'] ?? null,
        ],
        'geometry' => [
            'type' => 'Polygon',
            'coordinates' => $coordinates,
        ],
    ];

    $geojson['features'][] = $feature;
}

echo "✅ Converted " . count($geojson['features']) . " features\n\n";

// Save to file
$outputFile = __DIR__ . '/../davao_all_barangays_' . date('Y-m-d') . '.geojson';
$jsonOutput = json_encode($geojson, JSON_PRETTY_PRINT);
file_put_contents($outputFile, $jsonOutput);

echo "💾 Saved to: $outputFile\n";
echo "📦 File size: " . number_format(strlen($jsonOutput) / 1024, 2) . " KB\n\n";

echo str_repeat("=", 80) . "\n";
echo "✅ Download complete!\n\n";
echo "Next steps:\n";
echo "  1. Update the path in process_geojson_boundaries.php to:\n";
echo "     $outputFile\n";
echo "  2. Run: php -f process_geojson_boundaries.php\n";
echo "  3. Run: php -f update_barangay_boundaries.php\n";
echo "  4. Test: php -f test_polygon_assignment.php\n\n";

// Show summary of what was downloaded
echo "📋 Downloaded barangays by district:\n";
$byDistrict = [];
foreach ($geojson['features'] as $feature) {
    $district = $feature['properties']['is_in:district'] ?? 'Unknown';
    if (!isset($byDistrict[$district])) {
        $byDistrict[$district] = 0;
    }
    $byDistrict[$district]++;
}

ksort($byDistrict);
foreach ($byDistrict as $district => $count) {
    echo sprintf("  %-20s: %3d barangays\n", $district, $count);
}

echo "\n";
