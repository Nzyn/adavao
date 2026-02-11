<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = DB::table('user_admin')->where('id', 35)->first();
echo "PS3 User (ID: 35)\n";
echo "Email: {$user->email}\n";

// Check which phone field exists
if (isset($user->phone_number)) {
    echo "Phone: {$user->phone_number}\n";
} elseif (isset($user->phone)) {
    echo "Phone: {$user->phone}\n";
} elseif (isset($user->contact_number)) {
    echo "Phone: {$user->contact_number}\n";
} else {
    echo "Phone: No phone field found\n";
}
