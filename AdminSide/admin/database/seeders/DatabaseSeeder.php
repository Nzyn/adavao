<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles first
        $this->call(RolesTableSeeder::class);
        
        // Seed police stations
        $this->call(PoliceStationsSeeder::class);
        
        // Optionally seed sample data
        // $this->call(SampleDataSeeder::class);
    }
}
