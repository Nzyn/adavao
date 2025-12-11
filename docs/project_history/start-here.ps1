# AlertDavao - Start Here Script
# This script guides you through the entire deployment process

$Host.UI.RawUI.WindowTitle = "AlertDavao Deployment"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║          🚀 AlertDavao - Live Deployment Setup 🚀          ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Welcome! This wizard will help you deploy AlertDavao to production." -ForegroundColor White
Write-Host ""
Write-Host "What you'll get:" -ForegroundColor Yellow
Write-Host "  ✅ All services running in Docker containers" -ForegroundColor Green
Write-Host "  ✅ Live URLs accessible from anywhere (via Ngrok)" -ForegroundColor Green
Write-Host "  ✅ Production-ready mobile APK for distribution" -ForegroundColor Green
Write-Host ""

# Ask if user wants to continue
$start = Read-Host "Ready to get started? (y/n)"
if ($start -ne 'y') {
    Write-Host "Okay, run this script again when you're ready!" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STEP 1: Pre-Deployment Check" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

.\check-deployment.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Please fix the issues above before continuing." -ForegroundColor Red
    exit 1
}

$continue = Read-Host "Continue to deployment? (y/n)"
if ($continue -ne 'y') {
    exit 0
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STEP 2: Deploy Services" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

.\deploy.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STEP 3: Get Your Ngrok URLs" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening Ngrok dashboard in your browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Try to open ngrok dashboard
try {
    Start-Process "http://localhost:4040"
} catch {
    Write-Host "⚠️  Couldn't open browser automatically" -ForegroundColor Yellow
    Write-Host "   Please open: http://localhost:4040" -ForegroundColor White
}

Write-Host ""
Write-Host "In the Ngrok dashboard, you'll see your live URLs:" -ForegroundColor White
Write-Host ""
Write-Host "  📱 userside-backend  → Your main API (IMPORTANT!)" -ForegroundColor Cyan
Write-Host "  🖥️  adminside        → Admin panel" -ForegroundColor Cyan
Write-Host "  📊 sarima-api        → Forecasting API" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the HTTPS URLs - you'll need them in the next step!" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Have you copied your ngrok URLs? (y/n)"
if ($continue -ne 'y') {
    Write-Host "No problem! You can continue later with: .\update-production-urls.ps1" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STEP 4: Update Production Configuration" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

.\update-production-urls.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  Configuration update failed. You can try again later." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STEP 5: Build Mobile APK" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$buildNow = Read-Host "Build the mobile APK now? (y/n)"
if ($buildNow -eq 'y') {
    Write-Host ""
    Write-Host "Launching APK build..." -ForegroundColor Yellow
    Write-Host ""
    
    Set-Location UserSide
    .\build-apk.ps1
    Set-Location ..
} else {
    Write-Host ""
    Write-Host "No problem! You can build later with:" -ForegroundColor Yellow
    Write-Host "  cd UserSide" -ForegroundColor Cyan
    Write-Host "  .\build-apk.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║            🎉 DEPLOYMENT COMPLETE! 🎉                      ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Your AlertDavao application is now LIVE! 🚀" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📋 QUICK REFERENCE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Access your services:" -ForegroundColor Yellow
Write-Host "   Ngrok Dashboard:  http://localhost:4040" -ForegroundColor White
Write-Host "   Your live URLs:   Check the dashboard above" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Yellow
Write-Host "   View logs:        docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop all:         docker-compose down" -ForegroundColor White
Write-Host "   Restart all:      docker-compose restart" -ForegroundColor White
Write-Host ""
Write-Host "📱 To rebuild APK:" -ForegroundColor Yellow
Write-Host "   cd UserSide" -ForegroundColor White
Write-Host "   .\build-apk.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   Quick Start:      QUICK_START.md" -ForegroundColor White
Write-Host "   Full Guide:       README_DEPLOYMENT.md" -ForegroundColor White
Write-Host "   Setup Summary:    SETUP_COMPLETE.md" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎊 Congratulations! You're all set!" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Share your APK with users and start receiving reports!" -ForegroundColor Yellow
Write-Host ""
