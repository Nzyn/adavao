<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = \Illuminate\Support\Facades\DB::select("DESCRIBE police_officers");
foreach ($columns as $col) {
    echo $col->Field . " | " . $col->Type . "\n";
}

$fks = \Illuminate\Support\Facades\DB::select("
    SELECT 
        TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
        REFERENCED_TABLE_SCHEMA = 'alertdavao' AND
        TABLE_NAME = 'police_officers';
");
print_r($fks);
