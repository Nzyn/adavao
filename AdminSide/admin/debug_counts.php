<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n====== REPORT COUNT CHECK ======\n";

$total = \App\Models\Report::count();
$unassigned = \App\Models\Report::whereNull('assigned_station_id')->count();
$assigned = \App\Models\Report::whereNotNull('assigned_station_id')->count();
$emptyString = \App\Models\Report::where('assigned_station_id', '')->count();
$zero = \App\Models\Report::where('assigned_station_id', 0)->count();

echo "Total Reports:      $total\n";
echo "IS NULL:            $unassigned\n";
echo "IS NOT NULL:        $assigned\n";
echo "Empty String ('n'): $emptyString\n";
echo "Zero (0):           $zero\n";

echo "\n====== USER ROLE CHECK ======\n";
$user = \App\Models\UserAdmin::where('email', 'alertdavao.ph@gmail.com')->first();
echo "User Email: " . $user->email . "\n";
echo "Role Column: " . $user->role . "\n";
$superAdmin = $user->hasRole('super_admin') ? 'YES' : 'NO';
echo "Has super_admin: $superAdmin\n";
$admin = $user->hasRole('admin') ? 'YES' : 'NO';
echo "Has admin:       $admin\n";

echo "\n==============================\n";
