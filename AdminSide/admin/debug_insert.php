<?php
use Illuminate\Support\Facades\DB;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $userId = User::first()->id ?? null;
    if (!$userId) { 
        echo "No user found! Creating one...\n";
        $user = User::create([
            'firstname' => 'Test', 'lastname' => 'User', 'email' => 'test@debug.com', 'password' => 'password', 'role'=>'user'
        ]);
        $userId = $user->id;
    }
    echo "Using User ID: $userId\n";

    echo "Inserting Location...\n";
    $l = DB::table('locations')->insertGetId([
        'barangay'=>'Test',
        'latitude'=>7.0,
        'longitude'=>125.0,
        'reporters_address'=>'Test Addr',
        'created_at'=>now(),
        'updated_at'=>now()
    ]);
    echo "Location ID: $l\n";

    echo "Inserting Report...\n";
    DB::table('reports')->insert([
        'user_id'=>$userId,
        'location_id'=>$l,
        'title'=>'Test Report',
        'description'=>'Test Description',
        'report_type'=>json_encode(['Theft']),
        'date_reported'=>now(),
        'status'=>'resolved',
        'is_valid'=>'valid',
        'is_anonymous'=>0,
        'assigned_station_id'=>null,
        'created_at'=>now(),
        'updated_at'=>now()
    ]);
    echo "Report Inserted Successfully!\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
