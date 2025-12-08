<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug OTP Viewer</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <meta http-equiv="refresh" content="5"> <!-- Auto refresh every 5s -->
</head>
<body class="bg-light p-5">
    <div class="container">
        <div class="card shadow">
            <div class="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                <h3 class="mb-0">🔌 Debug OTP Viewer</h3>
                <span class="badge bg-warning text-dark">Auto-refreshes every 5s</span>
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <strong>Note:</strong> This page allows you to view OTPs because Twilio SMS delivery is currently blocked. Use the <strong>OTP Hash</strong> (verification requires checking against hash) is not useful here, but for debugging we can't show the plain OTP if it's hashed.
                    <br><br>
                    Wait... the OTP is hashed in the database (`otp_hash`). We cannot "see" the plain OTP here if the app hashed it before storing!
                    <br>
                    <strong>CHECKING LOGS instead...</strong>
                </div>

                <div class="alert alert-warning">
                    <strong>Wait!</strong> The database stores the <em>Hash</em> of the OTP, not the actual number (for security).
                    <br>
                    To see the <strong>Real OTP</strong>, we must check the <strong>Laravel Logs</strong> where we logged it explicitly.
                </div>

                <h5>Last 20 Log Entries (Look for "OTP generated"):</h5>
                <pre class="bg-dark text-success p-3 rounded" style="max-height: 500px; overflow-y: auto;">
@php
    $logFile = storage_path('logs/laravel.log');
    if (file_exists($logFile)) {
        $lines = [];
        $fp = fopen($logFile, "r");
        $pos = -2;
        $line = '';
        fseek($fp, 0, SEEK_END);
        while (count($lines) < 50 && $pos > -filesize($logFile)) {
            $char = fgetc($fp);
            if ($char === "\n") {
                array_unshift($lines, $line);
                $line = '';
            } else {
                $line = $char . $line;
            }
            fseek($fp, $pos--, SEEK_END);
        }
        array_unshift($lines, $line);
        fclose($fp);
        echo implode("\n", $lines);
    } else {
        echo "Log file not found.";
    }
@endphp
                </pre>
            </div>
        </div>
    </div>
</body>
</html>
