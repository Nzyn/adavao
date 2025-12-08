<?php
/**
 * Test the point-in-polygon assignment logic
 * Run with: php -f test_polygon_assignment.php
 */

require __DIR__ . '/../AdminSide/admin/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Helpers\GeoHelper;
use App\Models\Barangay;
use App\Models\Report;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../AdminSide/admin/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🧪 Testing Point-in-Polygon Assignment Logic\n";
echo str_repeat("=", 80) . "\n\n";

// Test cases with known barangay coordinates
$testCases = [
    [
        'name' => 'Barangay 2-A Center',
        'lat' => 7.065747,
        'lng' => 125.605488,
        'expected' => 'Barangay 2-A',
    ],
    [
        'name' => 'Catalunan Grande Center',
        'lat' => 7.087228,
        'lng' => 125.526000,
        'expected' => 'Catalunan Grande',
    ],
    [
        'name' => 'Matina Pangi Center',
        'lat' => 7.077660,
        'lng' => 125.565800,
        'expected' => 'Matina Pangi',
    ],
    [
        'name' => 'Talomo Proper Center',
        'lat' => 7.053228,
        'lng' => 125.549629,
        'expected' => 'Talomo Proper',
    ],
    [
        'name' => 'Outside all boundaries',
        'lat' => 10.0,
        'lng' => 120.0,
        'expected' => null,
    ],
];

echo "📍 Running test cases:\n\n";

foreach ($testCases as $index => $test) {
    echo sprintf("Test %d: %s\n", $index + 1, $test['name']);
    echo sprintf("  Coordinates: (%.6f, %.6f)\n", $test['lat'], $test['lng']);
    
    // Find barangay using point-in-polygon
    $barangay = GeoHelper::findBarangayByCoordinates($test['lat'], $test['lng']);
    
    if ($barangay) {
        echo sprintf("  ✅ Found: %s (Station ID: %d)\n", $barangay->barangay_name, $barangay->station_id);
        
        // Verify it's the expected barangay
        if ($test['expected'] && stripos($barangay->barangay_name, $test['expected']) !== false) {
            echo "  ✅ PASS: Matches expected barangay\n";
        } else {
            echo sprintf("  ⚠️  WARNING: Expected '%s' but got '%s'\n", $test['expected'], $barangay->barangay_name);
        }
    } else {
        // Try nearest barangay
        $nearest = GeoHelper::findNearestBarangay($test['lat'], $test['lng']);
        
        if ($nearest) {
            $distance = GeoHelper::calculateDistance(
                $test['lat'],
                $test['lng'],
                $nearest->latitude,
                $nearest->longitude
            );
            
            echo sprintf("  ⚠️  Not in polygon, nearest: %s (%.2f km away)\n", 
                $nearest->barangay_name, 
                $distance
            );
        } else {
            echo "  ❌ No barangay found\n";
        }
        
        if (!$test['expected']) {
            echo "  ✅ PASS: Correctly found no barangay\n";
        }
    }
    
    // Test auto-assignment
    $stationId = Report::autoAssignPoliceStation($test['lat'], $test['lng']);
    if ($stationId) {
        $station = DB::table('police_stations')->where('station_id', $stationId)->first();
        echo sprintf("  🚔 Would assign to: %s\n", $station->station_name);
    }
    
    echo "\n";
}

echo str_repeat("=", 80) . "\n";
echo "📊 Testing Statistics:\n\n";

// Get barangays with boundaries
$withBoundaries = Barangay::whereNotNull('boundary_polygon')->count();
$total = Barangay::count();
$withCoordinates = Barangay::whereNotNull('latitude')
    ->whereNotNull('longitude')
    ->count();

echo sprintf("Total Barangays: %d\n", $total);
echo sprintf("With Coordinates: %d (%.1f%%)\n", $withCoordinates, ($withCoordinates / $total) * 100);
echo sprintf("With Boundary Polygons: %d (%.1f%%)\n", $withBoundaries, ($withBoundaries / $total) * 100);

// List barangays with boundaries
echo "\n📋 Barangays with boundary polygons:\n";
$barangaysWithBoundaries = Barangay::whereNotNull('boundary_polygon')
    ->with('policeStation')
    ->get();

foreach ($barangaysWithBoundaries as $brgy) {
    echo sprintf(
        "  - %-30s | Station: %s\n",
        $brgy->barangay_name,
        $brgy->policeStation ? $brgy->policeStation->station_name : 'Not assigned'
    );
}

echo "\n✅ Testing complete!\n";
