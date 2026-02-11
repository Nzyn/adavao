<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Fixing Super Admin Role ===\n\n";

$email = 'alertdavao.ph@gmail.com';
$user = \App\Models\UserAdmin::where('email', $email)->first();

if (!$user) {
    echo "User not found!\n";
    exit;
}

echo "User found: {$user->email}\n";

// Get super_admin role
$superAdminRole = DB::table('roles')->where('role_name', 'super_admin')->first();
$adminRole = DB::table('roles')->where('role_name', 'admin')->first();

if (!$superAdminRole) {
    echo "Error: 'super_admin' role not found in DB!\n";
    // Check available roles
    $roles = DB::table('roles')->get();
    echo "Available roles:\n";
    foreach ($roles as $r) {
        echo "- {$r->role_name} (ID: {$r->role_id})\n";
    }
    exit;
}

echo "Assigning 'super_admin' (ID: {$superAdminRole->role_id})...\n";

// Remove existing roles
DB::table('user_admin_roles')->where('user_admin_id', $user->id)->delete();

// Assign super_admin
DB::table('user_admin_roles')->insert([
    'user_admin_id' => $user->id,
    'role_id' => $superAdminRole->role_id
]);

// Also assign 'admin' role just in case logic checks for that too
if ($adminRole) {
    DB::table('user_admin_roles')->insert([
        'user_admin_id' => $user->id,
        'role_id' => $adminRole->role_id
    ]);
}

// Update the 'role' column on the user table itself (legacy support)
$user->role = 'super_admin';
$user->save();

echo "✓ Role updated to super_admin.\n";
echo "✓ Legacy 'role' column set to 'super_admin'.\n";

// Verify
$user = \App\Models\UserAdmin::where('email', $email)->first();
echo "\nVerification:\n";
echo "Legacy Role: {$user->role}\n";
echo "RBAC Roles:\n";
foreach ($user->adminRoles as $role) {
    echo "- {$role->role_name}\n";
}
