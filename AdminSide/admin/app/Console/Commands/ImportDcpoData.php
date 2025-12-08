<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ImportDcpoData extends Command
{
    protected $signature = 'dcpo:import {--truncate : Truncate reports table before import}';
    protected $description = 'Import DCPO_5years_monthly.csv into reports table';

    public function handle()
    {
        $csvPath = storage_path('app/DCPO_5years_monthly.csv');
        
        if (!file_exists($csvPath)) {
            $this->error('DCPO_5years_monthly.csv not found at: ' . $csvPath);
            return 1;
        }

        if ($this->option('truncate')) {
            if ($this->confirm('This will DELETE all existing reports and locations. Are you sure?')) {
                // Disable foreign key checks, truncate, then re-enable
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                DB::table('reports')->truncate();
                DB::table('locations')->truncate();
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                $this->info('Reports and locations tables truncated.');
            } else {
                $this->info('Import cancelled.');
                return 0;
            }
        }

        // Get admin user ID
        $adminUser = DB::table('users_public')->first();
        if (!$adminUser) {
            $this->error('No users found. Please create at least one user first.');
            return 1;
        }
        $userId = $adminUser->id;
        $this->info("Using user ID: {$userId}");

        $this->info('Reading DCPO_5years_monthly.csv...');
        
        $file = fopen($csvPath, 'r');
        $header = fgetcsv($file); // gu,Date,offense,Count
        
        $imported = 0;
        $skipped = 0;
        
        // Load barangay coordinates from JSON
        $barangayCoordinates = $this->loadBarangayCoordinates();
        $this->info("Loaded " . count($barangayCoordinates) . " barangay coordinates");
        
        $this->info('Processing records...');
        $bar = $this->output->createProgressBar(4940);
        
        DB::beginTransaction();
        
        try {
            while (($row = fgetcsv($file)) !== false) {
                try {
                    $record = array_combine($header, $row);
                    
                    $barangayName = trim($record['gu'] ?? '');
                    $date = $record['Date'] ?? null;
                    $offense = trim($record['offense'] ?? '');
                    $count = intval($record['Count'] ?? 1);
                    
                    if (empty($barangayName) || empty($date) || empty($offense)) {
                        $skipped++;
                        $bar->advance();
                        continue;
                    }
                    
                    // Clean barangay name - remove PS annotations
                    $cleanBarangay = preg_replace('/\s*\(BRGY.*?\)/i', '', $barangayName);
                    $cleanBarangay = preg_replace('/\s*\(.*?PS\s+\d+.*?\)/i', '', $cleanBarangay);
                    $cleanBarangay = trim($cleanBarangay);
                    
                    // Get coordinates
                    $coordinates = $this->getCoordinatesForBarangay($cleanBarangay, $barangayCoordinates);
                    if (!$coordinates) {
                        $coordinates = $this->getCoordinatesForBarangay($barangayName, $barangayCoordinates);
                    }
                    if (!$coordinates) {
                        $coordinates = ['lat' => 7.1907, 'lng' => 125.4553];
                    }
                    
                    $reportDate = Carbon::parse($date);
                    
                    // Insert each record (count might be > 1, meaning multiple incidents)
                    for ($i = 0; $i < $count; $i++) {
                        // Insert location first
                        $locationId = DB::table('locations')->insertGetId([
                            'latitude' => $coordinates['lat'],
                            'longitude' => $coordinates['lng'],
                            'barangay' => $cleanBarangay,
                            'created_at' => $reportDate,
                            'updated_at' => $reportDate,
                        ]);
                        
                        // Insert report
                        DB::table('reports')->insert([
                            'user_id' => $userId,
                            'location_id' => $locationId,
                            'report_type' => json_encode([$offense]),
                            'description' => "Historical DCPO Data - $offense in $cleanBarangay",
                            'date_reported' => $reportDate,
                            'status' => 'verified',
                            'created_at' => $reportDate,
                            'updated_at' => $reportDate,
                        ]);
                        
                        $imported++;
                        
                        if ($imported % 100 == 0) {
                            DB::commit();
                            DB::beginTransaction();
                        }
                    }
                    
                } catch (\Exception $e) {
                    $this->warn("\nError importing row: {$e->getMessage()}");
                    $skipped++;
                }
                
                $bar->advance();
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("\nImport failed: {$e->getMessage()}");
            fclose($file);
            return 1;
        }
        
        fclose($file);
        $bar->finish();
        
        $this->newLine(2);
        $this->info("✅ Import Complete!");
        $this->info("   Imported: {$imported} reports");
        $this->info("   Skipped: {$skipped} records");
        
        return 0;
    }
    
    private function loadBarangayCoordinates(): array
    {
        $jsonPaths = [
            base_path('../../../davao_barangay_coordinates.json'),
            base_path('../../davao_barangay_coordinates.json'),
            'D:\Codes\alertdavao\davao_barangay_coordinates.json',
        ];
        
        foreach ($jsonPaths as $path) {
            if (file_exists($path)) {
                $json = file_get_contents($path);
                return json_decode($json, true) ?? [];
            }
        }
        
        return [];
    }
    
    private function getCoordinatesForBarangay(string $barangayName, array $coordinates): ?array
    {
        // Try exact match
        if (isset($coordinates[$barangayName])) {
            return [
                'lat' => $coordinates[$barangayName]['lat'],
                'lng' => $coordinates[$barangayName]['lng']
            ];
        }
        
        // Try uppercase
        $upper = strtoupper($barangayName);
        if (isset($coordinates[$upper])) {
            return [
                'lat' => $coordinates[$upper]['lat'],
                'lng' => $coordinates[$upper]['lng']
            ];
        }
        
        // Try case-insensitive search
        foreach ($coordinates as $name => $coord) {
            if (strcasecmp($name, $barangayName) === 0) {
                return [
                    'lat' => $coord['lat'],
                    'lng' => $coord['lng']
                ];
            }
        }
        
        return null;
    }
}
