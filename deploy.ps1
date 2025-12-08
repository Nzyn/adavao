# AlertDavao - Docker Deployment
# This script helps you set up and deploy AlertDavao using Docker and Ngrok

Write-Host "🚀 AlertDavao Docker Deployment Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.docker" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please update .env file with your Ngrok authtoken" -ForegroundColor Yellow
    Write-Host "   Get it from: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Press Enter when you've updated the .env file, or 'q' to quit"
    if ($continue -eq 'q') {
        exit 0
    }
}

# Check if ngrok.yml has authtoken
$ngrokConfig = Get-Content "ngrok.yml" -Raw
if ($ngrokConfig -match "YOUR_NGROK_AUTHTOKEN_HERE") {
    Write-Host "⚠️  IMPORTANT: Please update ngrok.yml with your authtoken" -ForegroundColor Yellow
    Write-Host "   Get it from: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Press Enter when you've updated ngrok.yml, or 'q' to quit"
    if ($continue -eq 'q') {
        exit 0
    }
}

Write-Host ""
Write-Host "🏗️  Building and starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "✅ Containers started successfully!" -ForegroundColor Green
Write-Host ""

# Show running containers
Write-Host "📦 Running Containers:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🌐 Getting Ngrok URLs..." -ForegroundColor Yellow
Write-Host "   Open http://localhost:4040 in your browser to see all URLs" -ForegroundColor White
Write-Host ""

# Check if first time setup
$dbInitialized = Read-Host "Is this the first time running? (y/n)"
if ($dbInitialized -eq 'y') {
    Write-Host ""
    Write-Host "📊 Initializing database..." -ForegroundColor Yellow
    
    Write-Host "Running migrations..." -ForegroundColor White
    docker-compose exec -T adminside php artisan migrate --force
    
    Write-Host "✅ Database initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Ngrok Dashboard:" -ForegroundColor White
Write-Host "   http://localhost:4040" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Copy your ngrok URLs from the dashboard" -ForegroundColor White
Write-Host ""
Write-Host "3. Update production configs with your URLs:" -ForegroundColor White
Write-Host "   • UserSide/backends/.env.production" -ForegroundColor Cyan
Write-Host "   • AdminSide/admin/.env.production" -ForegroundColor Cyan
Write-Host "   • UserSide/.env.production" -ForegroundColor Cyan
Write-Host "   • UserSide/app.production.json" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Apply production environment:" -ForegroundColor White
Write-Host "   .\update-production-urls.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Build mobile APK:" -ForegroundColor White
Write-Host "   cd UserSide" -ForegroundColor Cyan
Write-Host "   eas build --platform android --profile production" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Yellow
Write-Host "   View logs:    docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop all:     docker-compose down" -ForegroundColor White
Write-Host "   Restart all:  docker-compose restart" -ForegroundColor White
Write-Host ""
