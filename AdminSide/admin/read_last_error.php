<?php
// Read the last 100 lines of the log file
$logFile = 'storage/logs/laravel.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -100);
    
    // Find the last ERROR entry
    $errorLines = [];
    $capturing = false;
    
    foreach ($lastLines as $line) {
        if (strpos($line, '.ERROR:') !== false || strpos($line, '.CRITICAL:') !== false) {
            $capturing = true;
            $errorLines = [$line];
        } elseif ($capturing) {
            $errorLines[] = $line;
            // Stop capturing after stack trace ends
            if (strpos($line, '#') === 0 && strpos($line, '{main}') !== false) {
                break;
            }
        }
    }
    
    if (!empty($errorLines)) {
        echo "=== LAST ERROR ===\n";
        echo implode('', $errorLines);
    } else {
        echo "No recent errors found in log\n";
    }
} else {
    echo "Log file not found\n";
}
