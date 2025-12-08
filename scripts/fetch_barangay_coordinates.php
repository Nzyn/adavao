<?php
/**
 * Davao City Barangay Coordinates Fetcher
 * 
 * This script fetches accurate coordinates from Google Maps Geocoding API
 * for all Davao City barangays and generates a PHP array for MapController.
 * 
 * Prerequisites:
 * - Google Maps Geocoding API enabled
 * - API key in environment or config
 * 
 * Usage: php fetch_barangay_coordinates.php YOUR_GOOGLE_API_KEY
 */

$apiKey = $argv[1] ?? getenv('GOOGLE_MAPS_API_KEY');

if (!$apiKey) {
    die("Error: Google Maps API key required. Usage: php fetch_barangay_coordinates.php YOUR_API_KEY\n");
}

// Barangay names from CSV
$barangays = [
    'BAGO APLAYA',
    'PAMPANGA',
    'BARANGAY 37-D',
    'BUNAWAN',
    '40-D BOLTON ISLA',
    'BARANGAY 19-B',
    'BARANGAY 14-B',
    'TOMAS MONTEVERDE SR',
    'AGDAO PROPER',
    'BARANGAY 18-B',
    'SALAPAWAN',
    'BARANGAY 28-C',
    'WANGAN',
    'INDANGAN',
    'BALIOK',
    'TUNGKALAN',
    'BUDA',
    'SUBASTA',
    'MAGTUOD',
    '76-A BUCANA',
    '74-A MATINA CROSSING',
    'LACSON',
    'TIBULOY',
    'TACUNAN',
    'SALOY',
    'BARANGAY 2-A',
    'BINUGAO',
    'DUMOY',
    'PACIANO BANGOY',
    'BARANGAY 5-A',
    'BARANGAY 3-A',
    'BARANGAY 10-A',
    'BARANGAY 13-B',
    'LAPU-LAPU',
    'SAN ISIDRO',
    'MAHAYAG',
    'BARANGAY 11-A',
    'BARANGAY 39-D',
    'CARMEN',
    'DALIAO',
    'BARANGAY 8-A',
    'BAO JOAQUIN',
    'BAGANIHAN',
    'BARANGAY 20-B',
    'TAMUGAN',
    'SAN ANTONIO',
    'MALAGOS',
    'RIVERSIDE',
    'TAMAYONG',
    'MALABOG',
    'TALOMO RIVER',
    'WINES',
    'GUMALANG',
    'ALAMBRE',
    'BAYABAS',
    'ULAS',
    'MATINA PANGI',
    'CAWAYAN',
    'BANGKAS HEIGHTS',
    'BARANGAY 9-A',
    'EDEN',
    'MULIG',
    'SALAYSAY',
    'BARANGAY 17-B',
    'MAGSAYSAY',
    'LOS AMIGOS',
    'TAGURANO',
    'MATINA APLAYA',
    'MAA',
    'TUGBOK',
    'TALOMO',
    'MAPI-ILA',
    'CATALUNAN GRANDE',
    'CATALUNAN PEQUENO',
    'GUMITAN',
    'BALENGAENG',
    'TAMBOBONG',
    'SALUMAY',
    'MARILOG',
    'VICENTE HIZON SR',
    'MARAPANGI',
    'PANALUM',
    'LASANG',
    'BARANGAY 38-D',
    'BARANGAY 22-C',
    'CENTRO',
    'CALINAN',
    'BARANGAY 23-C',
    'BANTOL',
    'CABANTIAN',
    'TAPAK',
    'AQUINO',
    'ALFONSO ANGLIONGTO SR',
    'BARANGAY 32-D',
    'CATIGAN',
    'DUTERTE',
    'SASA',
    'LUBOGAN',
    'BAO ESCUELA',
    'ACACIA',
    'MANDUG',
    'NEW VALENCIA',
    'LIZADA',
    'TORIL',
    'LAMANAN',
    'FATIMA',
    'SUAWAN',
    'WAAN',
    'TALANDANG',
    'ANGALAN',
    'BUHANGIN',
    'COMMUNAL',
    'TIGATTO',
    'SIRIB',
    'PAQUIBATO',
    'PANACAN',
    'MINTAL',
    'BAGO GALLERA',
    'BAGO OSHIRO',
    'MANUEL GUIANGA',
    'SANTO NINO',
    'MABUHAY',
    'BARANGAY 26-C',
    'BARANGAY 27-C',
    'ILANG',
    'BAGUIO PROPER',
    'TIBUNGCO'
];

$coordinates = [];
$failedBarangays = [];

echo "Fetching coordinates for " . count($barangays) . " barangays...\n";
echo str_repeat("=", 60) . "\n";

foreach ($barangays as $index => $barangay) {
    $address = urlencode("$barangay, Davao City, Philippines");
    $url = "https://maps.googleapis.com/maps/api/geocode/json?address=$address&key=$apiKey";
    
    echo "[" . ($index + 1) . "/" . count($barangays) . "] $barangay... ";
    
    $response = @file_get_contents($url);
    
    if ($response === false) {
        echo "FAILED (no response)\n";
        $failedBarangays[] = $barangay;
        continue;
    }
    
    $data = json_decode($response, true);
    
    if ($data['status'] !== 'OK' || empty($data['results'])) {
        echo "NOT FOUND\n";
        $failedBarangays[] = $barangay;
        continue;
    }
    
    $location = $data['results'][0]['geometry']['location'];
    $lat = round($location['lat'], 4);
    $lng = round($location['lng'], 4);
    
    $coordinates[$barangay] = [$lat, $lng];
    echo "✓ ($lat, $lng)\n";
    
    // Rate limiting - Google allows ~10 requests per second
    usleep(150000); // 150ms delay
}

echo str_repeat("=", 60) . "\n";
echo "\n✓ Successfully fetched: " . count($coordinates) . " barangays\n";
echo "✗ Failed: " . count($failedBarangays) . " barangays\n";

if (!empty($failedBarangays)) {
    echo "\nFailed barangays:\n";
    foreach ($failedBarangays as $brgy) {
        echo "  - $brgy\n";
    }
}

// Generate PHP code for MapController
$phpCode = "<?php\n\n";
$phpCode .= "// Auto-generated barangay coordinates from Google Maps Geocoding API\n";
$phpCode .= "// Generated: " . date('Y-m-d H:i:s') . "\n";
$phpCode .= "// Source: Google Maps Geocoding API\n\n";
$phpCode .= "return [\n";

foreach ($coordinates as $barangay => $coords) {
    $phpCode .= "    '$barangay' => [$coords[0], $coords[1]],\n";
}

$phpCode .= "];\n";

// Save to file
$outputFile = __DIR__ . '/../AdminSide/admin/app/Data/davao_barangay_coordinates.php';
file_put_contents($outputFile, $phpCode);

echo "\n✓ PHP array saved to: $outputFile\n";

// Also generate JSON
$jsonData = [
    'barangays' => array_map(function($barangay, $coords) {
        return [
            'name' => $barangay,
            'latitude' => $coords[0],
            'longitude' => $coords[1]
        ];
    }, array_keys($coordinates), array_values($coordinates)),
    'metadata' => [
        'city' => 'Davao City',
        'region' => 'Davao Region',
        'country' => 'Philippines',
        'total_barangays' => count($coordinates),
        'source' => 'Google Maps Geocoding API',
        'last_updated' => date('Y-m-d H:i:s')
    ]
];

$jsonFile = __DIR__ . '/../davao_barangay_coordinates_accurate.json';
file_put_contents($jsonFile, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo "✓ JSON file saved to: $jsonFile\n";

echo "\nNext steps:\n";
echo "1. Review the coordinates in: $outputFile\n";
echo "2. Update MapController.php getBarangayCoordinates() method with the new coordinates\n";
echo "3. Test the hotspot map to verify accuracy\n";
