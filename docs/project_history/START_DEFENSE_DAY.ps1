# AlertDavao - Quick Start Script for Defense Day
# Run this on your PC at home before going to school

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AlertDavao Defense Day Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location D:\Codes\alertdavao\alertdavao

# Start Docker containers
Write-Host "🚀 Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check container status
Write-Host "`n📦 Container Status:" -ForegroundColor Cyan
docker-compose ps

# Get ngrok URL
Write-Host "`n🌐 Getting your public URLs..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $tunnels = (Invoke-WebRequest -Uri http://localhost:4040/api/tunnels -UseBasicParsing | ConvertFrom-Json).tunnels
    $ngrokUrl = $tunnels[0].public_url
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ✅ READY FOR DEFENSE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    Write-Host "`n💻 LAPTOP (AdminSide Web):" -ForegroundColor Yellow
    Write-Host "   $ngrokUrl" -ForegroundColor Cyan
    Write-Host "   Login: alertdavao.ph@gmail.com" -ForegroundColor White
    
    Write-Host "`n📱 PHONE (Mobile App Backend):" -ForegroundColor Yellow
    Write-Host "   $ngrokUrl/api/mobile" -ForegroundColor Cyan
    
    Write-Host "`n🔍 Test Mobile API:" -ForegroundColor Yellow
    Write-Host "   $ngrokUrl/api/mobile/health" -ForegroundColor Cyan
    
    Write-Host "`n📊 Ngrok Dashboard (this PC only):" -ForegroundColor Yellow
    Write-Host "   http://localhost:4040" -ForegroundColor Cyan
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  KEEP THIS PC RUNNING DURING DEFENSE" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Green
    
    # Test the proxy
    Write-Host "`n🧪 Testing mobile API proxy..." -ForegroundColor Yellow
    try {
        $healthCheck = Invoke-WebRequest -Uri "http://localhost:8000/api/mobile/health" -UseBasicParsing
        Write-Host "   ✅ Mobile API proxy is working!" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Warning: Mobile API proxy test failed" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
    }
    
} catch {
    Write-Host "`n❌ Error getting ngrok URL" -ForegroundColor Red
    Write-Host "   Make sure ngrok container is running" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host "`n"
Read-Host "Press Enter to exit"
