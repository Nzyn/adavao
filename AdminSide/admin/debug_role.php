<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$email = 'ps2@mailsac.com';

echo "Checking Role for: $email\n";

$user = \App\Models\UserAdmin::where('email', $email)->first();
if (!$user) {
    echo "User not found in UserAdmin.\n";
    exit;
}

echo "User ID: " . $user->id . "\n";
echo "Station ID: " . ($user->station_id ?? 'NULL') . "\n";

// Check raw roles table
$roles = \Illuminate\Support\Facades\DB::table('user_admin_roles')
    ->join('roles', 'user_admin_roles.role_id', '=', 'roles.role_id')
    ->where('user_admin_roles.user_admin_id', $user->id)
    ->get();

echo "Roles in DB:\n";
foreach ($roles as $role) {
    echo "- " . $role->role_name . "\n";
}

// Check hasRole method
echo "hasRole('police'): " . ($user->hasRole('police') ? 'YES' : 'NO') . "\n";
echo "hasRole('admin'): " . ($user->hasRole('admin') ? 'YES' : 'NO') . "\n";
