<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Fixing Super Admin Permissions ===\n\n";

$email = 'alertdavao.ph@gmail.com';
$user = DB::table('user_admin')->where('email', $email)->first();

if (!$user) {
    echo "User not found!\n";
    exit(1);
}

echo "Found User ID: {$user->id}\n";
echo "Current Role Column: {$user->role}\n";

// Get Role IDs
$superAdminId = DB::table('roles')->where('role_name', 'super_admin')->value('role_id');
$adminId = DB::table('roles')->where('role_name', 'admin')->value('role_id');

if (!$superAdminId) {
    echo "Error: super_admin role missing.\n";
    exit(1);
}

// 1. Clear existing roles
DB::table('user_admin_roles')->where('user_admin_id', $user->id)->delete();
echo "✓ Cleared old roles\n";

// 2. Assign super_admin
DB::table('user_admin_roles')->insert([
    'user_admin_id' => $user->id,
    'role_id' => $superAdminId
]);
echo "✓ Assigned super_admin role (ID: $superAdminId)\n";

// 3. Update legacy column
DB::table('user_admin')
    ->where('id', $user->id)
    ->update(['role' => 'super_admin']);
echo "✓ Updated 'role' column to 'super_admin'\n";

echo "\nDone! Please refresh the admin dashboard report page.\n";
