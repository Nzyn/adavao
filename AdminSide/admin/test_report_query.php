<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

// Simulate being logged in as a police user
$user = \App\Models\UserAdmin::where('email', 'ps2@mailsac.com')->first();
auth()->login($user);

echo "Logged in as: {$user->email}\n";
echo "Station ID: {$user->station_id}\n\n";

try {
    echo "Testing report query...\n";
    
    $query = \App\Models\Report::with(['user.verification', 'location', 'media', 'policeStation'])
        ->join('locations', 'reports.location_id', '=', 'locations.location_id');
    
    // Exclude reports without valid coordinates
    $query->whereNotNull('locations.latitude')
          ->whereNotNull('locations.longitude')
          ->where('locations.latitude', '!=', 0)
          ->where('locations.longitude', '!=', 0);
    
    // Apply filtering logic
    $isAdmin = false;
    $isPolice = false;
    
    if (method_exists($user, 'hasRole')) {
        $isAdmin = $user->hasRole('admin') || $user->hasRole('super_admin');
        $isPolice = $user->hasRole('police');
    }
    
    echo "isAdmin: " . ($isAdmin ? 'true' : 'false') . "\n";
    echo "isPolice: " . ($isPolice ? 'true' : 'false') . "\n\n";
    
    if ($isPolice) {
        $userStationId = $user->station_id;
        echo "Filtering by station: {$userStationId}\n";
        $query->where('reports.assigned_station_id', $userStationId);
    }
    
    $reports = $query->select('reports.*')
                     ->orderBy('reports.created_at', 'desc')
                     ->limit(5)
                     ->get();
    
    echo "✓ Query successful!\n";
    echo "Found {$reports->count()} reports\n";
    
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}
