# Build AlertDavao APK
# This script builds the production APK for distribution

Write-Host "📱 AlertDavao APK Build Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-Not (Test-Path "app.json")) {
    Write-Host "❌ Error: Must run this script from the UserSide directory" -ForegroundColor Red
    Write-Host "   Run: cd UserSide" -ForegroundColor Yellow
    exit 1
}

# Check if production files exist
if (-Not (Test-Path "app.production.json")) {
    Write-Host "❌ Error: app.production.json not found" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production not found" -ForegroundColor Red
    exit 1
}

# Check if URLs are configured
$appJson = Get-Content "app.production.json" -Raw
if ($appJson -match "YOUR_NGROK_BACKEND_URL_HERE") {
    Write-Host "❌ Error: app.production.json still has placeholder URLs" -ForegroundColor Red
    Write-Host "   Run: ..\update-production-urls.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Build Options:" -ForegroundColor Yellow
Write-Host "   1. Cloud Build (EAS - recommended, slower)" -ForegroundColor White
Write-Host "   2. Local Build (faster, requires Android SDK)" -ForegroundColor White
Write-Host ""
$buildType = Read-Host "Select build type (1 or 2)"

Write-Host ""
Write-Host "📝 Preparing production configuration..." -ForegroundColor Yellow

# Backup current files
if (Test-Path "app.json") {
    Copy-Item "app.json" "app.json.backup" -Force
    Write-Host "   Backed up app.json" -ForegroundColor Gray
}
if (Test-Path ".env") {
    Copy-Item ".env" ".env.backup" -Force
    Write-Host "   Backed up .env" -ForegroundColor Gray
}

# Copy production files
Copy-Item "app.production.json" "app.json" -Force
Copy-Item ".env.production" ".env" -Force
Write-Host "✅ Production configuration applied" -ForegroundColor Green

Write-Host ""
Write-Host "🏗️  Starting build..." -ForegroundColor Yellow
Write-Host ""

if ($buildType -eq "2") {
    # Local build
    Write-Host "Building locally..." -ForegroundColor Cyan
    eas build --platform android --profile production --local
} else {
    # Cloud build
    Write-Host "Building on EAS cloud..." -ForegroundColor Cyan
    eas build --platform android --profile production
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed" -ForegroundColor Red
    
    # Restore backups
    if (Test-Path "app.json.backup") {
        Copy-Item "app.json.backup" "app.json" -Force
        Remove-Item "app.json.backup"
    }
    if (Test-Path ".env.backup") {
        Copy-Item ".env.backup" ".env" -Force
        Remove-Item ".env.backup"
    }
    
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Your APK is ready!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Download the APK from the link provided by EAS" -ForegroundColor White
Write-Host "   2. Upload to Google Drive, Dropbox, or your preferred platform" -ForegroundColor White
Write-Host "   3. Share the link with users" -ForegroundColor White
Write-Host ""
Write-Host "📱 Installation Instructions for Users:" -ForegroundColor Yellow
Write-Host "   1. Download the APK on Android device" -ForegroundColor White
Write-Host "   2. Enable 'Install from Unknown Sources' in Settings" -ForegroundColor White
Write-Host "   3. Open the downloaded APK file" -ForegroundColor White
Write-Host "   4. Follow installation prompts" -ForegroundColor White
Write-Host ""

# Clean up backups
if (Test-Path "app.json.backup") {
    Remove-Item "app.json.backup"
}
if (Test-Path ".env.backup") {
    Remove-Item ".env.backup"
}

Write-Host "🎉 Done! Your app is ready for distribution." -ForegroundColor Green
Write-Host ""
