<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Location;
use App\Models\Report;
use Carbon\Carbon;

class SampleDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample users
        $users = [
            ['firstname' => 'John', 'lastname' => 'Doe', 'contact' => '09123456789', 'email' => 'john@example.com', 'password' => bcrypt('password')],
            ['firstname' => 'Jane', 'lastname' => 'Smith', 'contact' => '09123456790', 'email' => 'jane@example.com', 'password' => bcrypt('password')],
            ['firstname' => 'Admin', 'lastname' => 'User', 'contact' => '09123456791', 'email' => 'admin@example.com', 'password' => bcrypt('password')],
        ];
        
        foreach ($users as $userData) {
            User::create($userData);
        }
        
        // Create sample locations (Davao City barangays)
        $locations = [
            ['barangay' => 'Poblacion District', 'latitude' => 7.1907, 'longitude' => 125.4553],
            ['barangay' => 'Buhangin', 'latitude' => 7.2010, 'longitude' => 125.4450],
            ['barangay' => 'Matina', 'latitude' => 7.1850, 'longitude' => 125.4600],
            ['barangay' => 'Agdao', 'latitude' => 7.1950, 'longitude' => 125.4500],
            ['barangay' => 'Lanang', 'latitude' => 7.1800, 'longitude' => 125.4650],
            ['barangay' => 'Talomo', 'latitude' => 7.2050, 'longitude' => 125.4400],
            ['barangay' => 'Toril', 'latitude' => 7.1920, 'longitude' => 125.4580],
            ['barangay' => 'Paquibato', 'latitude' => 7.1880, 'longitude' => 125.4520],
            ['barangay' => 'Tugbok', 'latitude' => 7.2100, 'longitude' => 125.4300],
            ['barangay' => 'Baguio', 'latitude' => 7.2200, 'longitude' => 125.4200],
        ];
        
        foreach ($locations as $locationData) {
            Location::create($locationData);
        }
        
        // Create sample reports with various dates
        $reportTypes = ['emergency', 'theft', 'violence', 'fire', 'accident', 'suspicious', 'vandalism', 'noise complaint'];
        $statuses = ['pending', 'investigating', 'resolved'];
        
        $reports = [
            [
                'user_id' => 1,
                'location_id' => 1,
                'report_type' => 'emergency',
                'description' => 'Emergency situation reported in Poblacion District - immediate attention required',
                'date_reported' => Carbon::now()->subDays(1),
                'status' => 'pending'
            ],
            [
                'user_id' => 2,
                'location_id' => 2,
                'report_type' => 'violence',
                'description' => 'Violence incident reported in Buhangin area',
                'date_reported' => Carbon::now()->subDays(2),
                'status' => 'investigating'
            ],
            [
                'user_id' => 1,
                'location_id' => 3,
                'report_type' => 'theft',
                'description' => 'Theft reported in Matina - suspect seen fleeing',
                'date_reported' => Carbon::now()->subDays(3),
                'status' => 'resolved'
            ],
            [
                'user_id' => 3,
                'location_id' => 4,
                'report_type' => 'suspicious',
                'description' => 'Suspicious activity in Agdao - monitoring required',
                'date_reported' => Carbon::now()->subWeek(),
                'status' => 'pending'
            ],
            [
                'user_id' => 2,
                'location_id' => 5,
                'report_type' => 'noise complaint',
                'description' => 'Noise complaint in Lanang - resolved by local officials',
                'date_reported' => Carbon::now()->subWeeks(2),
                'status' => 'resolved'
            ],
            [
                'user_id' => 1,
                'location_id' => 6,
                'report_type' => 'fire',
                'description' => 'Small fire reported in Talomo - fire department responded',
                'date_reported' => Carbon::now()->subMonth(),
                'status' => 'resolved'
            ],
            [
                'user_id' => 2,
                'location_id' => 7,
                'report_type' => 'accident',
                'description' => 'Traffic accident in Toril - emergency services dispatched',
                'date_reported' => Carbon::now()->subDays(5),
                'status' => 'investigating'
            ],
            [
                'user_id' => 3,
                'location_id' => 8,
                'report_type' => 'vandalism',
                'description' => 'Vandalism reported in Paquibato - property damage assessment ongoing',
                'date_reported' => Carbon::now()->subDays(7),
                'status' => 'pending'
            ],
            [
                'user_id' => 1,
                'location_id' => 9,
                'report_type' => 'emergency',
                'description' => 'Medical emergency in Tugbok - ambulance dispatched',
                'date_reported' => Carbon::create(2024, 12, 15),
                'status' => 'resolved'
            ],
            [
                'user_id' => 2,
                'location_id' => 10,
                'report_type' => 'theft',
                'description' => 'Break-in reported in Baguio - investigation underway',
                'date_reported' => Carbon::create(2024, 11, 20),
                'status' => 'investigating'
            ]
        ];
        
        foreach ($reports as $reportData) {
            Report::create($reportData);
        }
    }
}
