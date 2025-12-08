<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Roles Directly ===\n\n";

$email = 'alertdavao.ph@gmail.com';
$user = DB::table('user_admin')->where('email', $email)->first();

if ($user) {
    echo "User ID: {$user->id}\n";
    echo "Legacy Role Column: {$user->role}\n";
    
    $roles = DB::table('user_admin_roles')
        ->join('roles', 'user_admin_roles.role_id', '=', 'roles.role_id')
        ->where('user_admin_roles.user_admin_id', $user->id)
        ->select('roles.role_name', 'roles.role_id')
        ->get();
        
    echo "Assigned Roles:\n";
    foreach ($roles as $r) {
        echo "- {$r->role_name} (ID: {$r->role_id})\n";
    }
} else {
    echo "User not found.\n";
}
