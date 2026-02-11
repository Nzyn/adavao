<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Finding PS3 User ===\n\n";

// Check table structure
$columns = DB::select('DESCRIBE user_admin');
$hasPhoneNumber = false;
foreach ($columns as $col) {
    if ($col->Field == 'phone_number' || $col->Field == 'phone' || $col->Field == 'contact_number') {
        echo "Phone column: {$col->Field}\n";
        $hasPhoneNumber = $col->Field;
    }
}

echo "\n";

// Find PS3 user by email
$ps3User = DB::table('user_admin')
    ->where('email', 'like', '%ps3%')
    ->orWhere('email', 'like', '%talomo%')
    ->first();

if ($ps3User) {
    echo "Found user:\n";
    echo "ID: {$ps3User->id}\n";
    echo "Email: {$ps3User->email}\n";
    echo "Station ID: {$ps3User->station_id}\n";
    
    if ($hasPhoneNumber) {
        $currentPhone = $ps3User->{$hasPhoneNumber};
        echo "Current phone ({$hasPhoneNumber}): {$currentPhone}\n\n";
        
        // Update
        DB::table('user_admin')
            ->where('id', $ps3User->id)
            ->update([$hasPhoneNumber => '+639054057984']);
        
        echo "✓ Updated to: +639054057984\n";
    }
} else {
    echo "PS3 user not found by email. Listing all users:\n\n";
    $users = DB::table('user_admin')->get(['id', 'email', 'station_id']);
    foreach ($users as $u) {
        echo "ID: {$u->id} | Email: {$u->email} | Station: {$u->station_id}\n";
    }
}
