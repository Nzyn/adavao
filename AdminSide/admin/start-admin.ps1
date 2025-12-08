# Start AlertDavao Admin Services
Write-Host "Starting AlertDavao Admin Services..." -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting SARIMAX API on port 8001..." -ForegroundColor Yellow
$sarimaxPath = "$PSScriptRoot\..\..\sarima_api"
$sarimaxJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    python main.py
} -ArgumentList $sarimaxPath

Start-Sleep -Seconds 3
Write-Host "    [OK] SARIMAX API started (Job ID: $($sarimaxJob.Id))" -ForegroundColor Green
Write-Host ""

Write-Host "[2/2] Starting Laravel Server on port 8000..." -ForegroundColor Yellow
Write-Host "    Access admin panel at: http://localhost:8000" -ForegroundColor Green
Write-Host ""

# This will block and show Laravel output
php artisan serve

# Cleanup on exit
Write-Host ""
Write-Host "Stopping SARIMAX API..." -ForegroundColor Yellow
Stop-Job -Id $sarimaxJob.Id
Remove-Job -Id $sarimaxJob.Id
Write-Host "All services stopped." -ForegroundColor Green
