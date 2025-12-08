<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class FetchBarangayCoordinatesOsm extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'barangay:fetch-osm';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch barangay coordinates from OpenStreetMap (no API key needed)';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
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

        $this->info('🔄 Fetching coordinates from OpenStreetMap Nominatim...');
        $this->line(str_repeat('=', 70));

        $coordinates = [];
        $failedBarangays = [];
        $successCount = 0;

        foreach ($barangays as $index => $barangay) {
            $address = urlencode("$barangay, Davao City, Philippines");
            $url = "https://nominatim.openstreetmap.org/search?q=$address&format=json&limit=1";

            $this->line("[" . ($index + 1) . "/" . count($barangays) . "] " . str_pad($barangay, 30) . " ", false);

            try {
                $headers = ['User-Agent: AlertDavao/1.0'];
                $context = stream_context_create([
                    'http' => [
                        'header' => implode("\r\n", $headers)
                    ]
                ]);

                $response = @file_get_contents($url, false, $context);

                if ($response === false) {
                    $this->line('<fg=red>✗ FAILED</>');
                    $failedBarangays[] = $barangay;
                    sleep(1);
                    continue;
                }

                $data = json_decode($response, true);

                if (empty($data) || !isset($data[0]['lat']) || !isset($data[0]['lon'])) {
                    $this->line('<fg=yellow>⊘ NOT FOUND</>');
                    $failedBarangays[] = $barangay;
                    sleep(1);
                    continue;
                }

                $lat = round((float)$data[0]['lat'], 4);
                $lng = round((float)$data[0]['lon'], 4);

                $coordinates[$barangay] = [$lat, $lng];
                $this->line("<fg=green>✓</> ({$lat}, {$lng})");
                $successCount++;

                sleep(1);

            } catch (\Exception $e) {
                $this->line('<fg=red>✗ ERROR</>');
                $failedBarangays[] = $barangay;
                sleep(1);
            }
        }

        $this->line(str_repeat('=', 70));
        $this->line('');

        $this->info("✓ Successfully fetched: $successCount barangays");
        if (!empty($failedBarangays)) {
            $this->warn("✗ Failed: " . count($failedBarangays) . " barangays");
        }

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
                'source' => 'OpenStreetMap Nominatim',
                'last_updated' => now()->toIso8601String()
            ]
        ];

        $storagePath = storage_path('app/barangay_coordinates.json');
        file_put_contents($storagePath, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $this->line('');
        $this->info("✓ Saved to: " . $storagePath);
        $this->line('');
        $this->info('✅ Done! Barangay coordinates updated.');

        return 0;
    }
}
