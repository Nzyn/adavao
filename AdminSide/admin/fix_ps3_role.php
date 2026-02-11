<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Fixing PS3 User Role ===\n\n";

// Get PS3 user ID
$userId = 35; // ps3@mailsac.com

// Get police role ID
$policeRole = DB::table('roles')->where('role_name', 'police')->first();
if (!$policeRole) {
    echo "✗ Police role not found\n";
    exit(1);
}

echo "Police role ID: {$policeRole->role_id}\n\n";

// Check current roles
$currentRoles = DB::table('user_admin_roles')
    ->where('user_admin_id', $userId)
    ->get();

echo "Current roles for user {$userId}:\n";
foreach ($currentRoles as $r) {
    $roleName = DB::table('roles')->where('role_id', $r->role_id)->value('role_name');
    echo "  - {$roleName} (ID: {$r->role_id})\n";
}

// Remove all roles first
DB::table('user_admin_roles')->where('user_admin_id', $userId)->delete();
echo "\n✓ Removed all existing roles\n";

// Add only police role
DB::table('user_admin_roles')->insert([
    'user_admin_id' => $userId,
    'role_id' => $policeRole->role_id
]);
echo "✓ Assigned 'police' role\n";

// Verify
echo "\nNew roles:\n";
$newRoles = DB::table('user_admin_roles')
    ->where('user_admin_id', $userId)
    ->get();
foreach ($newRoles as $r) {
    $roleName = DB::table('roles')->where('role_id', $r->role_id)->value('role_name');
    echo "  - {$roleName} (ID: {$r->role_id})\n";
}
