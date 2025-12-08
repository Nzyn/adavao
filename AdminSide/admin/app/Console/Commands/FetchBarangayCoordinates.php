<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class FetchBarangayCoordinates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'barangay:fetch-coordinates {--key= : Google Maps API Key (optional if in .env)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch accurate barangay coordinates from Google Maps API for Davao City';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Get API key from option or config
        $apiKey = $this->option('key') ?? config('services.google.maps_api_key');

        if (!$apiKey) {
            $this->error('❌ Google Maps API key not found!');
            $this->line('');
            $this->line('Provide it in one of two ways:');
            $this->line('  1. php artisan barangay:fetch-coordinates --key=YOUR_API_KEY');
            $this->line('  2. Set GOOGLE_MAPS_API_KEY in .env file');
            $this->line('');
            $this->line('Get your API key at: https://console.cloud.google.com/');
            return 1;
        }

        // List of Davao City barangays from CSV
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

        $this->info('🔄 Fetching coordinates for ' . count($barangays) . ' barangays...');
        $this->line(str_repeat('=', 70));

        $coordinates = [];
        $failedBarangays = [];
        $successCount = 0;

        foreach ($barangays as $index => $barangay) {
            $address = urlencode("$barangay, Davao City, Philippines");
            $url = "https://maps.googleapis.com/maps/api/geocode/json?address=$address&key=$apiKey";

            $this->line("[" . ($index + 1) . "/" . count($barangays) . "] " . str_pad($barangay, 30) . " ", false);

            try {
                $response = @file_get_contents($url);

                if ($response === false) {
                    $this->line('<fg=red>✗ FAILED (no response)</>');
                    $failedBarangays[] = $barangay;
                    continue;
                }

                $data = json_decode($response, true);

                if ($data['status'] !== 'OK' || empty($data['results'])) {
                    $this->line('<fg=yellow>⊘ NOT FOUND</>');
                    $failedBarangays[] = $barangay;
                    continue;
                }

                $location = $data['results'][0]['geometry']['location'];
                $lat = round($location['lat'], 4);
                $lng = round($location['lng'], 4);

                $coordinates[$barangay] = [$lat, $lng];
                $this->line("<fg=green>✓</> ({$lat}, {$lng})");
                $successCount++;

                // Rate limiting
                usleep(150000); // 150ms delay

            } catch (\Exception $e) {
                $this->line('<fg=red>✗ ERROR: ' . $e->getMessage() . '</>');
                $failedBarangays[] = $barangay;
            }
        }

        $this->line(str_repeat('=', 70));
        $this->line('');

        // Summary
        $this->info("✓ Successfully fetched: $successCount barangays");
        if (!empty($failedBarangays)) {
            $this->warn("✗ Failed: " . count($failedBarangays) . " barangays");
        }

        // Save to JSON
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
                'last_updated' => now()->toIso8601String(),
                'successful_fetch' => $successCount,
                'failed_fetch' => count($failedBarangays)
            ]
        ];

        $storagePath = storage_path('app/barangay_coordinates.json');
        file_put_contents($storagePath, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $this->line('');
        $this->info("✓ Coordinates saved to: " . $storagePath);
        $this->line('');

        if (!empty($failedBarangays)) {
            $this->warn('Failed barangays (may need manual entry):');
            foreach ($failedBarangays as $brgy) {
                $this->line("  • $brgy");
            }
            $this->line('');
        }

        $this->info('✅ Complete! Hotspot map will now use accurate coordinates.');
        $this->line('');
        $this->comment('Next steps:');
        $this->comment('1. Visit admin dashboard');
        $this->comment('2. Go to Hotspot Map page');
        $this->comment('3. Verify barangay locations are correct');

        return 0;
    }
}
