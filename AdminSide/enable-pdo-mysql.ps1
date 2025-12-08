$phpIniOutput = php --ini
$phpIniLine = $phpIniOutput | Select-String "Loaded Configuration File:"
$phpIniPath = $phpIniLine.ToString().Split(':',2)[1].Trim()

Write-Host "PHP Configuration: $phpIniPath" -ForegroundColor Cyan
Write-Host "Creating backup..." -ForegroundColor Yellow

$backupPath = "$phpIniPath.backup"
Copy-Item $phpIniPath $backupPath -Force

Write-Host "Enabling pdo_mysql extension..." -ForegroundColor Green

$content = Get-Content $phpIniPath
$content = $content -replace ';extension=pdo_mysql', 'extension=pdo_mysql'
$content | Set-Content $phpIniPath

Write-Host "Done! Verifying..." -ForegroundColor Green

$modules = php -m
if ($modules -match 'pdo_mysql') {
    Write-Host "SUCCESS: pdo_mysql is now enabled!" -ForegroundColor Green
} else {
    Write-Host "Extension was enabled in php.ini but may require a restart" -ForegroundColor Yellow
}
