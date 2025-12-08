<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Update PS3 contact number
DB::table('user_admin')
    ->where('id', 35)
    ->update(['contact' => '+639054057984']);

echo "✓ Updated PS3 contact to: +639054057984\n";

// Verify
$user = DB::table('user_admin')->where('id', 35)->first();
echo "Verified: {$user->contact}\n";
