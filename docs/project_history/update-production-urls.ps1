# Update Production URLs Script
# Run this after you have your ngrok URLs

Write-Host "🔧 AlertDavao Production URL Update" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Get ngrok URLs from user
Write-Host "Please enter your ngrok URLs from http://localhost:4040" -ForegroundColor Yellow
Write-Host ""

$backendUrl = Read-Host "Backend URL (userside-backend)"
$adminUrl = Read-Host "Admin URL (adminside)"
$sarimaUrl = Read-Host "SARIMA API URL (sarima-api) [Optional, press Enter to skip]"

if ([string]::IsNullOrWhiteSpace($backendUrl)) {
    Write-Host "❌ Backend URL is required!" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($adminUrl)) {
    Write-Host "❌ Admin URL is required!" -ForegroundColor Red
    exit 1
}

# Remove trailing slashes
$backendUrl = $backendUrl.TrimEnd('/')
$adminUrl = $adminUrl.TrimEnd('/')
if (-Not [string]::IsNullOrWhiteSpace($sarimaUrl)) {
    $sarimaUrl = $sarimaUrl.TrimEnd('/')
}

Write-Host ""
Write-Host "📝 Updating configuration files..." -ForegroundColor Yellow

# Update UserSide Backend .env.production
$backendEnv = Get-Content "UserSide/backends/.env.production" -Raw
$backendEnv = $backendEnv -replace 'BACKEND_URL=.*', "BACKEND_URL=$backendUrl"
Set-Content "UserSide/backends/.env.production" $backendEnv
Write-Host "✅ Updated UserSide/backends/.env.production" -ForegroundColor Green

# Update AdminSide .env.production
$adminEnv = Get-Content "AdminSide/admin/.env.production" -Raw
$adminEnv = $adminEnv -replace 'APP_URL=.*', "APP_URL=$adminUrl"
$adminEnv = $adminEnv -replace 'NODE_BACKEND_URL=.*', "NODE_BACKEND_URL=$backendUrl"
Set-Content "AdminSide/admin/.env.production" $adminEnv
Write-Host "✅ Updated AdminSide/admin/.env.production" -ForegroundColor Green

# Update UserSide Frontend .env.production
$frontendEnv = Get-Content "UserSide/.env.production" -Raw
$frontendEnv = $frontendEnv -replace 'RECAPTCHA_BASE_URL=.*', "RECAPTCHA_BASE_URL=$backendUrl"
$frontendEnv = $frontendEnv -replace 'API_BASE_URL=.*', "API_BASE_URL=$backendUrl"
Set-Content "UserSide/.env.production" $frontendEnv
Write-Host "✅ Updated UserSide/.env.production" -ForegroundColor Green

# Update app.production.json
$appJson = Get-Content "UserSide/app.production.json" -Raw | ConvertFrom-Json
$appJson.expo.extra.recaptchaBaseUrl = $backendUrl
$appJson.expo.extra.apiBaseUrl = $backendUrl
$appJson | ConvertTo-Json -Depth 10 | Set-Content "UserSide/app.production.json"
Write-Host "✅ Updated UserSide/app.production.json" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Applying production environment to containers..." -ForegroundColor Yellow

# Copy production env files to active env files
Copy-Item "UserSide/backends/.env.production" "UserSide/backends/.env" -Force
Copy-Item "AdminSide/admin/.env.production" "AdminSide/admin/.env" -Force

# Restart containers
docker-compose restart userside-backend adminside

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ CONFIGURATION UPDATED!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Your URLs:" -ForegroundColor Yellow
Write-Host "   Backend:  $backendUrl" -ForegroundColor Cyan
Write-Host "   Admin:    $adminUrl" -ForegroundColor Cyan
if (-Not [string]::IsNullOrWhiteSpace($sarimaUrl)) {
    Write-Host "   SARIMA:   $sarimaUrl" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "🏗️  Ready to build mobile app!" -ForegroundColor Green
Write-Host ""
Write-Host "Run these commands:" -ForegroundColor Yellow
Write-Host "   cd UserSide" -ForegroundColor White
Write-Host "   Copy-Item .env.production .env -Force" -ForegroundColor White
Write-Host "   Copy-Item app.production.json app.json -Force" -ForegroundColor White
Write-Host "   eas build --platform android --profile production" -ForegroundColor White
Write-Host ""
