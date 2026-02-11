<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Role;
use App\Models\Route as RouteModel;

class RoleRouteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Roles Exist
        $roles = ['super_admin', 'admin', 'police', 'user'];
        foreach ($roles as $roleName) {
            DB::table('roles')->updateOrInsert(
                ['role_name' => $roleName],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
        
        $adminRole = DB::table('roles')->where('role_name', 'admin')->first();
        $policeRole = DB::table('roles')->where('role_name', 'police')->first();
        $superAdminRole = DB::table('roles')->where('role_name', 'super_admin')->first();

        // 2. Fetch Routes
        $routes = DB::table('routes')->get();

        $adminRoutes = [];
        $policeRoutes = [];

        foreach ($routes as $route) {
            $name = $route->route_name;
            $id = $route->route_id;

            // Super Admin gets everything
            $this->assignRouteToRole($superAdminRole->role_id, $id);

            // Admin Logic
            if (
                str_contains($name, 'reports.') || 
                str_contains($name, 'users.') || 
                str_contains($name, 'statistics.') ||
                str_contains($name, 'notifications.') ||
                str_contains($name, 'reassignment') ||
                $name === 'dashboard' ||
                $name === 'view-map'
            ) {
                $this->assignRouteToRole($adminRole->role_id, $id);
            }

            // Police Logic
            if (
                $name === 'reports.requestReassignment' ||
                str_contains($name, 'users.flag') || // Shared with admin
                str_contains($name, 'users.unflag') || // Shared with admin
                str_contains($name, 'messages.') ||
                str_contains($name, 'notifications.') ||
                $name === 'dashboard' ||
                $name === 'view-map'
            ) {
                 $this->assignRouteToRole($policeRole->role_id, $id);
            }
        }
        
        $this->command->info("Roles and Permissions seeded successfully.");
    }

    private function assignRouteToRole($roleId, $routeId)
    {
        DB::table('role_route')->updateOrInsert(
            ['role_id' => $roleId, 'route_id' => $routeId],
            ['created_at' => now(), 'updated_at' => now()]
        );
    }
}
