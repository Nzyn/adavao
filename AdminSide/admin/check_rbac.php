<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$tables = ['routes', 'role_route', 'roles', 'admin_roles', 'user_admin_roles'];

foreach ($tables as $table) {
    if (Schema::hasTable($table)) {
        echo "Table '$table' EXISTS.\n";
        $columns = Schema::getColumnListing($table);
        echo "  Columns: " . implode(', ', $columns) . "\n";
        
        $count = DB::table($table)->count();
        echo "  Count: $count\n";
        
        if ($count > 0) {
            $first = DB::table($table)->first();
            echo "  Sample: " . json_encode($first) . "\n";
        }
    } else {
        echo "Table '$table' MISSING.\n";
    }
    echo "--------------------------------------------------\n";
}
