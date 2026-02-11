<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\Route as RouteModel;

class RoutesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $routes = Route::getRoutes();
        $count = 0;

        foreach ($routes as $route) {
            $name = $route->getName();
            
            // Only store named routes, skip debug/ignition routes
            if ($name && !str_starts_with($name, 'ignition.') && !str_starts_with($name, 'sanctum.')) {
                
                // Use updateOrInsert to avoid duplicates
                // Assuming 'route_name' is the column based on migration 2025_10_15_080016
                DB::table('routes')->updateOrInsert(
                    ['route_name' => $name],
                    ['created_at' => now(), 'updated_at' => now()]
                );
                $count++;
            }
        }
        
        $this->command->info("Seeded $count routes into the database.");
    }
}
