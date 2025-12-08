# Test Auto-Start Functionality
Write-Host "`n=========================================="
Write-Host "  TESTING AUTO-START FUNCTIONALITY"
Write-Host "==========================================`n"

# Step 1: Kill existing processes
Write-Host "[Step 1] Cleaning up existing processes..."
Get-Process php -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "  ✓ Done`n"

# Step 2: Start Laravel (should auto-start SARIMA)
Write-Host "[Step 2] Starting Laravel server..."
Write-Host "  Laravel will auto-start SARIMA API via AppServiceProvider"
Set-Location "AdminSide\admin"

$laravelJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    php artisan serve 2>&1
}

Write-Host "  Waiting for servers to initialize..."
Start-Sleep -Seconds 8

# Step 3: Check SARIMA API
Write-Host "`n[Step 3] Checking SARIMA API on port 8001..."
try {
    $sarimaResponse = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method Get -TimeoutSec 3
    Write-Host "  ✓ SARIMA API is RUNNING!" -ForegroundColor Green
    Write-Host "  Status: $($sarimaResponse.status)"
    Write-Host "  Version: $($sarimaResponse.version)"
    if ($sarimaResponse.model_trained) {
        Write-Host "  Model trained: YES (on $($sarimaResponse.observations) observations)"
    }
} catch {
    Write-Host "  ✗ SARIMA API is NOT running" -ForegroundColor Red
    Write-Host "  Auto-start may have failed. Check logs."
    Write-Host "`n  Manual start command:"
    Write-Host "    cd AdminSide\sarima_api"
    Write-Host "    python -m uvicorn main:app --host 0.0.0.0 --port 8001"
}

# Step 4: Check Laravel
Write-Host "`n[Step 4] Checking Laravel on port 8000..."
try {
    $laravelResponse = Invoke-WebRequest -Uri "http://localhost:8000" -Method Get -TimeoutSec 3 -UseBasicParsing
    if ($laravelResponse.StatusCode -eq 200) {
        Write-Host "  ✓ Laravel is RUNNING!" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Laravel is NOT responding" -ForegroundColor Red
}

# Show running processes
Write-Host "`n[Step 5] Running processes..."
$phpProcesses = Get-Process php -ErrorAction SilentlyContinue
$pythonProcesses = Get-Process python -ErrorAction SilentlyContinue

if ($phpProcesses) {
    Write-Host "  PHP processes: $($phpProcesses.Count)"
}
if ($pythonProcesses) {
    Write-Host "  Python processes: $($pythonProcesses.Count)"
}

Write-Host "`n=========================================="
Write-Host "  TEST COMPLETE"
Write-Host "==========================================`n"

Write-Host "Servers are still running. To stop them:"
Write-Host "  Press Ctrl+C or close this window"
Write-Host "  Then run: Get-Process php,python | Stop-Process -Force"
Write-Host "`nPress Enter to stop servers and exit..."
Read-Host

# Cleanup
Write-Host "Stopping servers..."
Stop-Job $laravelJob -ErrorAction SilentlyContinue
Remove-Job $laravelJob -ErrorAction SilentlyContinue
Get-Process php -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Done.`n"
