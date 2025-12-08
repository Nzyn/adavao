<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

if (class_exists(\App\Models\UserAdmin::class)) {
    $reflection = new ReflectionClass(\App\Models\UserAdmin::class);
    if ($reflection->hasMethod('policeStation')) {
        echo "UserAdmin has policeStation method.\n";
    } else {
        echo "UserAdmin MISSING policeStation method.\n";
    }
} else {
    echo "UserAdmin class not found.\n";
}
