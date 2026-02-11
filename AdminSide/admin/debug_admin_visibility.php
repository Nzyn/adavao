<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Investigating Admin Report Visibility ===\n\n";

// 1. Check Total Reports
$totalReports = \App\Models\Report::count();
echo "Total Reports: {$totalReports}\n";

// 2. Check Unassigned Reports (assigned_station_id IS NULL)
$unassignedReports = \App\Models\Report::whereNull('assigned_station_id')->count();
echo "Unassigned Reports (should be visible to Admin): {$unassignedReports}\n";

// 3. Check Assigned Reports
$assignedReports = \App\Models\Report::whereNotNull('assigned_station_id')->count();
echo "Assigned Reports (visible to Police): {$assignedReports}\n";

echo "\n--- Breakdown by Station ---\n";
$breakdown = \App\Models\Report::select('assigned_station_id', \DB::raw('count(*) as total'))
    ->groupBy('assigned_station_id')
    ->get();

foreach ($breakdown as $row) {
    $station = $row->assigned_station_id ? "Station ID {$row->assigned_station_id}" : "Unassigned";
    echo "{$station}: {$row->total}\n";
}

// 4. Check a sample user (admin)
echo "\n--- Admin User Check ---\n";
// Assuming the logged-in user is alertdavao.ph@gmail.com (Super Admin) or an admin
$adminUser = \App\Models\UserAdmin::where('email', 'alertdavao.ph@gmail.com')->first();
if ($adminUser) {
    echo "User: {$adminUser->email}\n";
    echo "Role: {$adminUser->role}\n";
    $roles = $adminUser->adminRoles->pluck('role_name')->toArray();
    echo "RBAC Roles: " . implode(', ', $roles) . "\n";
} else {
    echo "Default admin user not found.\n";
}
