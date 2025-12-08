<?php
$logFile = 'storage/logs/laravel.log';
if (!file_exists($logFile)) exit("No log file");

$lines = file($logFile);
foreach ($lines as $line) {
    if (strpos($line, 'Twilio') !== false) {
        echo $line;
    }
}
