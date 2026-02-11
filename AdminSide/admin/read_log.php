<?php
$logFile = 'storage/logs/laravel.log';
if (!file_exists($logFile)) {
    echo "Log file not found.";
    exit;
}
$lines = [];
$fp = fopen($logFile, "r");
$pos = -2;
$line = '';

// Seek to end
fseek($fp, 0, SEEK_END);
while (count($lines) < 30 && $pos > -filesize($logFile)) {
    $char = fgetc($fp);
    if ($char === "\n") {
        array_unshift($lines, $line);
        $line = '';
    } else {
        $line = $char . $line;
    }
    fseek($fp, $pos--, SEEK_END);
}
array_unshift($lines, $line); // Add the last remaining line
fclose($fp);

echo implode("\n", $lines);
