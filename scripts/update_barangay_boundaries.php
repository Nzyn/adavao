<?php
/**
 * Update barangay coordinates and boundary polygons in database
 * Run with: php -f update_barangay_boundaries.php
 */

require __DIR__ . '/../AdminSide/admin/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../AdminSide/admin/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Load processed barangay data
$processedDataPath = __DIR__ . '/../processed_barangay_boundaries.json';
if (!file_exists($processedDataPath)) {
    die("❌ Processed data file not found. Please run process_geojson_boundaries.php first.\n");
}

$processedBarangays = json_decode(file_get_contents($processedDataPath), true);
if (!$processedBarangays) {
    die("❌ Could not load processed barangay data\n");
}

echo "📍 Updating " . count($processedBarangays) . " barangays in database...\n\n";

$updated = 0;
$notFound = [];

// Create a mapping of normalized names to processed data
$nameMap = [];
foreach ($processedBarangays as $brgy) {
    $normalizedName = normalizeBarangayName($brgy['name']);
    $nameMap[$normalizedName] = $brgy;
    
    // Also map by short_name if available
    if (!empty($brgy['short_name'])) {
        $shortKey = 'BARANGAY ' . $brgy['short_name'];
        $nameMap[normalizeBarangayName($shortKey)] = $brgy;
        
        // Also try "BRGY XX-X" format
        $brgyKey = 'BRGY ' . $brgy['short_name'];
        $nameMap[normalizeBarangayName($brgyKey)] = $brgy;
    }
}

// Get all barangays from database
$dbBarangays = DB::table('barangays')->get();

foreach ($dbBarangays as $dbBrgy) {
    $normalizedDbName = normalizeBarangayName($dbBrgy->barangay_name);
    
    // Try to find a match
    $match = null;
    if (isset($nameMap[$normalizedDbName])) {
        $match = $nameMap[$normalizedDbName];
    }
    
    if ($match) {
        // Update the barangay
        DB::table('barangays')
            ->where('barangay_id', $dbBrgy->barangay_id)
            ->update([
                'latitude' => $match['latitude'],
                'longitude' => $match['longitude'],
                'boundary_polygon' => $match['boundary_polygon'],
                'osm_id' => $match['osm_id'],
                'ref' => $match['ref'],
                'updated_at' => now()
            ]);
        
        $updated++;
        echo "✅ Updated: {$dbBrgy->barangay_name} -> Lat: {$match['latitude']}, Lng: {$match['longitude']}\n";
    } else {
        $notFound[] = $dbBrgy->barangay_name;
        echo "⚠️  Not found in GeoJSON: {$dbBrgy->barangay_name}\n";
    }
}

echo "\n" . str_repeat("=", 80) . "\n";
echo "📊 Summary:\n";
echo "  ✅ Updated: $updated barangays\n";
echo "  ⚠️  Not found: " . count($notFound) . " barangays\n";
echo str_repeat("=", 80) . "\n";

if (!empty($notFound)) {
    echo "\n⚠️  Barangays not found in GeoJSON (will need manual coordinates):\n";
    foreach ($notFound as $name) {
        echo "  - $name\n";
    }
    echo "\n";
}

// Also update locations table with matching coordinates
echo "\n📍 Updating locations table...\n";
updateLocationsTable($nameMap);

/**
 * Normalize barangay name for matching
 */
function normalizeBarangayName(string $name): string
{
    // Convert to uppercase
    $normalized = strtoupper($name);
    
    // Remove common variations
    $normalized = str_replace(['BARANGAY ', 'BRGY ', 'BRGY.', '(POB)', '(POB.)', 'POB.', 'POB'], '', $normalized);
    
    // Remove extra spaces and trim
    $normalized = preg_replace('/\s+/', ' ', $normalized);
    $normalized = trim($normalized);
    
    // Remove special characters but keep dashes
    $normalized = preg_replace('/[^A-Z0-9\s\-]/', '', $normalized);
    
    return $normalized;
}

/**
 * Update locations table with barangay coordinates
 */
function updateLocationsTable(array $nameMap): void
{
    $locations = DB::table('locations')->get();
    $updated = 0;
    $notFound = [];
    
    foreach ($locations as $location) {
        $normalizedName = normalizeBarangayName($location->barangay);
        
        if (isset($nameMap[$normalizedName])) {
            $match = $nameMap[$normalizedName];
            
            DB::table('locations')
                ->where('location_id', $location->location_id)
                ->update([
                    'latitude' => $match['latitude'],
                    'longitude' => $match['longitude'],
                    'updated_at' => now()
                ]);
            
            $updated++;
            echo "  ✅ Updated location: {$location->barangay}\n";
        } else {
            if (!in_array($location->barangay, $notFound)) {
                $notFound[] = $location->barangay;
            }
        }
    }
    
    echo "\n📊 Locations table summary:\n";
    echo "  ✅ Updated: $updated locations\n";
    echo "  ⚠️  Not found: " . count($notFound) . " unique barangays\n";
    
    if (!empty($notFound)) {
        echo "\n⚠️  Location barangays not found in GeoJSON:\n";
        foreach (array_unique($notFound) as $name) {
            echo "  - $name\n";
        }
    }
}
