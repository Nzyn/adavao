<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Report;
use App\Models\User;
use App\Models\PoliceStation;
use Illuminate\Support\Facades\DB;

echo "--- VERIFICATION REPORT ---\n";

// 1. Total Reports
$total = Report::count();
echo "Total Reports: $total\n";

// 2. Assignment Stats
$unassigned = Report::whereNull('assigned_station_id')->count();
$assigned = Report::whereNotNull('assigned_station_id')->count();
echo "Assigned Reports: $assigned\n";
echo "Unassigned Reports: $unassigned\n";

if ($total != $assigned + $unassigned) {
    echo "WARNING: Count mismatch! Total != Assigned + Unassigned\n";
}

// 3. Simulated Visibility
// Super Admin (alertdavao.ph) - Expected: Unassigned Only
$superAdminView = DB::table('reports')->whereNull('assigned_station_id')->count();
echo "Super Admin View (Unassigned): $superAdminView\n";

// Regular Admin - Expected: Assigned Only
$adminView = DB::table('reports')->whereNotNull('assigned_station_id')->count();
echo "Regular Admin View (Assigned): $adminView\n";

// Police Station 1 (if exists)
$ps1 = PoliceStation::first();
if ($ps1) {
    $ps1Count = Report::where('assigned_station_id', $ps1->station_id)->count();
    echo "Police Station '{$ps1->station_name}' View: $ps1Count\n";
}

// 4. Sample Assignment Check
echo "\n--- SAMPLE ASSIGNMENTS ---\n";
$samples = Report::with(['location', 'policeStation'])
    ->whereNotNull('assigned_station_id')
    ->inRandomOrder()
    ->limit(5)
    ->get();

foreach ($samples as $r) {
    echo "Report #{$r->report_id}: {$r->location->barangay} -> Assigned to: " . 
         ($r->policeStation ? $r->policeStation->station_name : 'ERROR: Station not found') . "\n";
}

// 5. Sample Unassigned Check (Why unassigned?)
echo "\n--- SAMPLE UNASSIGNED ---\n";
$unassignedSamples = Report::with(['location'])
    ->whereNull('assigned_station_id')
    ->whereNotNull('location_id')
    ->inRandomOrder()
    ->limit(5)
    ->get();

foreach ($unassignedSamples as $r) {
    echo "Report #{$r->report_id}: {$r->location->barangay} (Lat: {$r->location->latitude}, Lng: {$r->location->longitude}) -> Unassigned\n";
}
