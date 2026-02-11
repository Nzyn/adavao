<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$userId = 34;
$roleName = 'police';

echo "Assigning '$roleName' role to user ID $userId...\n";

// Get Role ID
$role = \Illuminate\Support\Facades\DB::table('roles')->where('role_name', $roleName)->first();
if (!$role) {
    echo "Role '$roleName' not found!\n";
    exit;
}

// Check if already assigned
$exists = \Illuminate\Support\Facades\DB::table('user_admin_roles')
    ->where('user_admin_id', $userId)
    ->where('role_id', $role->role_id)
    ->exists();

if ($exists) {
    echo "User already has this role.\n";
} else {
    \Illuminate\Support\Facades\DB::table('user_admin_roles')->insert([
        'user_admin_id' => $userId,
        'role_id' => $role->role_id,
        'assigned_at' => now(), // Assuming timestamp column or irrelevant
    ]);
    echo "Role assigned successfully.\n";
}
