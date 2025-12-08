# Pre-Deployment Check Script
# Validates that everything is ready for deployment

Write-Host "🔍 AlertDavao Pre-Deployment Check" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    Write-Host "   → Start Docker Desktop and try again" -ForegroundColor White
    $allGood = $false
}
Write-Host ""

# Check ngrok.yml
Write-Host "Checking ngrok configuration..." -ForegroundColor Yellow
if (Test-Path "ngrok.yml") {
    $ngrokConfig = Get-Content "ngrok.yml" -Raw
    if ($ngrokConfig -match "YOUR_NGROK_AUTHTOKEN_HERE") {
        Write-Host "❌ Ngrok authtoken not configured" -ForegroundColor Red
        Write-Host "   → Update ngrok.yml with your authtoken from:" -ForegroundColor White
        Write-Host "   → https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Cyan
        $allGood = $false
    } else {
        Write-Host "✅ Ngrok authtoken configured" -ForegroundColor Green
    }
} else {
    Write-Host "❌ ngrok.yml not found" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check if Docker Compose file exists
Write-Host "Checking docker-compose.yml..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "✅ docker-compose.yml exists" -ForegroundColor Green
} else {
    Write-Host "❌ docker-compose.yml not found" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check Dockerfiles
Write-Host "Checking Dockerfiles..." -ForegroundColor Yellow
$dockerfiles = @(
    "AdminSide/admin/Dockerfile",
    "UserSide/backends/Dockerfile",
    "AdminSide/sarima_api/Dockerfile"
)
foreach ($dockerfile in $dockerfiles) {
    if (Test-Path $dockerfile) {
        Write-Host "✅ $dockerfile exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dockerfile not found" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# Check production configs
Write-Host "Checking production configuration files..." -ForegroundColor Yellow
$prodConfigs = @(
    "AdminSide/admin/.env.production",
    "UserSide/backends/.env.production",
    "UserSide/.env.production",
    "UserSide/app.production.json"
)
foreach ($config in $prodConfigs) {
    if (Test-Path $config) {
        Write-Host "✅ $config exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $config not found" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# Check EAS CLI
Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
try {
    $easVersion = eas --version 2>&1
    Write-Host "✅ EAS CLI installed ($easVersion)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  EAS CLI not found" -ForegroundColor Yellow
    Write-Host "   → Install with: npm install -g eas-cli" -ForegroundColor White
    Write-Host "   → Required for building mobile APK" -ForegroundColor White
}
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host "   → Download from: https://nodejs.org" -ForegroundColor White
    $allGood = $false
}
Write-Host ""

# Check npm packages
Write-Host "Checking npm packages..." -ForegroundColor Yellow
if (Test-Path "UserSide/backends/package.json") {
    if (Test-Path "UserSide/backends/node_modules") {
        Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend dependencies not installed" -ForegroundColor Yellow
        Write-Host "   → Run: cd UserSide/backends && npm install" -ForegroundColor White
    }
}
if (Test-Path "UserSide/package.json") {
    if (Test-Path "UserSide/node_modules") {
        Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend dependencies not installed" -ForegroundColor Yellow
        Write-Host "   → Run: cd UserSide && npm install" -ForegroundColor White
    }
}
Write-Host ""

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
try {
    git status | Out-Null
    $branch = git branch --show-current
    Write-Host "✅ Git repository (branch: $branch)" -ForegroundColor Green
    
    $uncommitted = git status --porcelain
    if ($uncommitted) {
        Write-Host "⚠️  You have uncommitted changes" -ForegroundColor Yellow
        Write-Host "   → Consider committing before deployment" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Not a git repository" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 You're ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Run: .\deploy.ps1" -ForegroundColor Cyan
    Write-Host "   2. Run: .\update-production-urls.ps1" -ForegroundColor Cyan
    Write-Host "   3. Run: cd UserSide && .\build-apk.ps1" -ForegroundColor Cyan
} else {
    Write-Host "❌ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Please fix the issues above before deploying" -ForegroundColor Yellow
}
Write-Host ""
