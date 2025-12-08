<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Assigning Police Role to PS3 User ===\n\n";

$user = \App\Models\UserAdmin::where('email', 'ps3@mailsac.com')->first();

if ($user) {
    echo "User: {$user->email}\n";
    echo "Current roles: ";
    foreach ($user->adminRoles as $role) {
        echo $role->role_name . " ";
    }
    echo "\n\n";
    
    // Get the 'police' role
    $policeRole = DB::table('roles')->where('role_name', 'police')->first();
    
    if ($policeRole) {
        // Check if already has police role
        $hasPolice = $user->adminRoles()->where('role_id', $policeRole->role_id)->exists();
        
        if (!$hasPolice) {
            // Assign police role
            $user->adminRoles()->attach($policeRole->role_id);
            echo "✓ Assigned 'police' role to PS3 user\n";
        } else {
            echo "User already has 'police' role\n";
        }
        
        // Remove admin role (optional - keep only police)
        $adminRole = DB::table('roles')->where('role_name', 'admin')->first();
        if ($adminRole) {
            $user->adminRoles()->detach($adminRole->role_id);
            echo "✓ Removed 'admin' role from PS3 user\n";
        }
        
        // Verify
        $user = \App\Models\UserAdmin::where('email', 'ps3@mailsac.com')->first();
        echo "\nNew roles: ";
        foreach ($user->adminRoles as $role) {
            echo $role->role_name . " ";
        }
        echo "\n";
    } else {
        echo "✗ 'police' role not found in database\n";
    }
}
