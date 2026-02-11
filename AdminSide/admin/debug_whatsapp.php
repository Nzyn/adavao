<?php
// Simple environment parser
function parseEnv($path) {
    if (!file_exists($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim($value);
        }
    }
    return $env;
}
$env = parseEnv(__DIR__ . '/.env');
$sid = $env['TWILIO_SID'] ?? '';
$token = $env['TWILIO_TOKEN'] ?? '';
$to = 'whatsapp:+639054057984';
$from = 'whatsapp:+14155238886';
$message = "Debug WhatsApp Test";

echo "SID: $sid\n";
echo "Token: $token\n";
echo "Sending to: $to\n";

$url = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
$data = ['To' => $to, 'From' => $from, 'Body' => $message];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
curl_setopt($ch, CURLOPT_USERPWD, "$sid:$token");
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
