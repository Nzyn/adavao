# 🚀 AlertDavao - Live Deployment with Docker & Ngrok

Complete setup for deploying AlertDavao to production using Docker containers and Ngrok tunnels.

## 📦 What's Included

This deployment setup includes:

- **MySQL Database** - Shared database for all services
- **AdminSide** - Laravel/PHP admin panel
- **UserSide Backend** - Node.js/Express API server
- **SARIMA API** - Python/FastAPI crime forecasting service
- **Ngrok** - Secure tunnels to expose services to the internet
- **Mobile App APK** - Android app for end users

## 🎯 Quick Start (3 Steps)

```powershell
# Step 1: Deploy all services
.\deploy.ps1

# Step 2: Configure your live URLs
.\update-production-urls.ps1

# Step 3: Build mobile app
cd UserSide
.\build-apk.ps1
```

**That's it!** Your app is live and ready to distribute.

## 📋 Detailed Setup Instructions

### Prerequisites

Before you begin, ensure you have:

1. **Docker Desktop** installed and running
   - Download from: https://www.docker.com/products/docker-desktop

2. **Ngrok Account** (free tier is fine)
   - Sign up at: https://ngrok.com
   - Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

3. **EAS CLI** for building mobile apps
   ```powershell
   npm install -g eas-cli
   ```

4. **Expo Account** (for EAS builds)
   - Sign up at: https://expo.dev
   - Login with: `eas login`

### Step-by-Step Deployment

#### 1. Configure Ngrok

Open `ngrok.yml` and replace `YOUR_NGROK_AUTHTOKEN_HERE` with your actual authtoken:

```yaml
authtoken: your_actual_authtoken_here
```

#### 2. Run Deployment Script

```powershell
.\deploy.ps1
```

This will:
- Build all Docker images
- Start MySQL database
- Start AdminSide (Laravel)
- Start UserSide Backend (Node.js)
- Start SARIMA API (Python)
- Start Ngrok tunnels
- Initialize database (if first time)

#### 3. Get Your Live URLs

Open http://localhost:4040 in your browser. You'll see:

```
Tunnel                    Status    URL
------------------------  --------  ----------------------------------
userside-backend          online    https://abc123.ngrok-free.app
adminside                 online    https://def456.ngrok-free.app
sarima-api                online    https://ghi789.ngrok-free.app
```

Copy these URLs - you'll need them in the next step.

#### 4. Update Production Configuration

```powershell
.\update-production-urls.ps1
```

When prompted, enter your ngrok URLs from step 3.

This script will:
- Update all backend configuration files
- Update mobile app configuration
- Restart services with new configuration

#### 5. Build Mobile APK

```powershell
cd UserSide
.\build-apk.ps1
```

Choose build type:
- **Option 1**: Cloud build (recommended, no SDK required)
- **Option 2**: Local build (faster, requires Android SDK)

The script will:
- Apply production configuration
- Build APK using EAS
- Provide download link

#### 6. Download and Distribute APK

1. Download APK from EAS link provided
2. Upload to Google Drive, Dropbox, or file hosting
3. Share link with users

## 📱 Installation for End Users

1. Download APK on Android device
2. Go to Settings → Security
3. Enable "Install from Unknown Sources"
4. Open downloaded APK file
5. Tap "Install"
6. Open AlertDavao app

## 🔧 Service Management

### View Running Services

```powershell
docker-compose ps
```

### View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f userside-backend
docker-compose logs -f adminside
docker-compose logs -f sarima-api
docker-compose logs -f mysql
```

### Restart Services

```powershell
# All services
docker-compose restart

# Specific service
docker-compose restart userside-backend
```

### Stop All Services

```powershell
docker-compose down
```

### Start Services Again

```powershell
docker-compose up -d
```

## 🌐 Accessing Your Services

| Service | URL | Purpose |
|---------|-----|---------|
| **Ngrok Dashboard** | http://localhost:4040 | View all tunnel URLs and traffic |
| **Backend API** | Your ngrok URL | Mobile app connects here |
| **Admin Panel** | Your ngrok URL | Web-based admin interface |
| **SARIMA API** | Your ngrok URL/docs | Crime forecasting API docs |
| **MySQL** | localhost:3306 | Database (from host machine) |

## 📊 Database Management

### Backup Database

```powershell
docker-compose exec mysql mysqldump -u root -p alertdavao > backup_$(Get-Date -Format 'yyyy-MM-dd').sql
```

### Restore Database

```powershell
Get-Content backup.sql | docker-compose exec -T mysql mysql -u root -p alertdavao
```

### Run Migrations

```powershell
docker-compose exec adminside php artisan migrate --force
```

### Access MySQL Console

```powershell
docker-compose exec mysql mysql -u root -p
```

## 🔄 Updating Your App

### Update Code

```powershell
# Pull latest changes
git pull

# Rebuild containers
docker-compose build

# Restart services
docker-compose up -d
```

### Rebuild Mobile App

If you made changes to the mobile app:

```powershell
cd UserSide
.\build-apk.ps1
```

## 🛡️ Security Best Practices

### Before Going Live

1. **Change default passwords** in `.env.docker`
   ```env
   DB_ROOT_PASSWORD=your_strong_password_here
   DB_PASSWORD=another_strong_password_here
   ```

2. **Protect sensitive files**
   - Never commit `.env` files to Git
   - Keep your ngrok authtoken secret
   - Rotate credentials periodically

3. **Enable HTTPS** - Ngrok provides this automatically

4. **Consider ngrok paid plan** for:
   - Fixed URLs (URLs won't change on restart)
   - Custom domains
   - IP whitelisting
   - Password protection

### Environment Variables to Protect

- `DB_PASSWORD`
- `DB_ROOT_PASSWORD`
- `NGROK_AUTHTOKEN`
- `EMAIL_PASSWORD`
- `SUPABASE_ANON_KEY`
- `RECAPTCHA_SECRET_KEY`

## ❓ Troubleshooting

### Containers Won't Start

```powershell
# Check logs for errors
docker-compose logs [service-name]

# Rebuild specific service
docker-compose build [service-name]
docker-compose up -d [service-name]
```

### Database Connection Failed

```powershell
# Check if MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Ngrok Tunnels Not Working

1. Verify authtoken in `ngrok.yml`
2. Check ngrok logs: `docker-compose logs ngrok`
3. Ensure ngrok container is running: `docker-compose ps ngrok`
4. Check your ngrok dashboard for quota limits

### Mobile App Can't Connect

1. Verify backend URL in `app.json`
2. Test URL in browser - should return data
3. Check if backend is running: `docker-compose ps userside-backend`
4. View backend logs: `docker-compose logs userside-backend`
5. Rebuild app with correct configuration

### Free Ngrok URLs Changed

Ngrok free tier URLs change every restart. To update:

```powershell
# Get new URLs from http://localhost:4040
.\update-production-urls.ps1

# Rebuild mobile app
cd UserSide
.\build-apk.ps1
```

**Solution**: Upgrade to ngrok paid plan for fixed URLs

## 📈 Monitoring

### Check Service Health

```powershell
# Backend health check
curl http://localhost:3000/api/health

# SARIMA API health check
curl http://localhost:8080/health
```

### Monitor Resource Usage

```powershell
docker stats
```

### View Network Activity

Open http://localhost:4040 to see:
- All HTTP requests
- Request/response details
- Traffic patterns
- Error logs

## 🚀 Production Checklist

Before distributing your app:

- [ ] Docker Desktop is running
- [ ] Ngrok authtoken configured in `ngrok.yml`
- [ ] All services started: `docker-compose ps` shows all healthy
- [ ] Database initialized with `php artisan migrate`
- [ ] Ngrok URLs obtained from http://localhost:4040
- [ ] Production configs updated with `update-production-urls.ps1`
- [ ] Mobile app built with `build-apk.ps1`
- [ ] APK tested on physical Android device
- [ ] Backend URL accessible from internet
- [ ] Admin panel accessible and working
- [ ] Default passwords changed in `.env`
- [ ] Backup strategy implemented

## 📚 Additional Resources

- **Full Guide**: `DEPLOYMENT_GUIDE.md` - Comprehensive deployment documentation
- **Quick Reference**: `QUICK_START.md` - One-page quick reference
- **Docker Compose**: `docker-compose.yml` - Service orchestration
- **Ngrok Config**: `ngrok.yml` - Tunnel configuration

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify all services running: `docker-compose ps`
3. Check ngrok dashboard: http://localhost:4040
4. Review error messages in terminal
5. Ensure all prerequisites are installed

## 📝 File Structure

```
alertdavao/
├── docker-compose.yml           # Main orchestration file
├── .env.docker                  # Environment template
├── ngrok.yml                    # Ngrok configuration
├── deploy.ps1                   # One-click deployment
├── update-production-urls.ps1   # Update URLs script
├── DEPLOYMENT_GUIDE.md          # This file
├── QUICK_START.md               # Quick reference
├── AdminSide/
│   ├── admin/
│   │   ├── Dockerfile          # Laravel container
│   │   ├── .env.production     # Laravel production config
│   │   └── .dockerignore
│   └── sarima_api/
│       ├── Dockerfile          # Python container
│       └── .dockerignore
└── UserSide/
    ├── backends/
    │   ├── Dockerfile          # Node.js container
    │   ├── .env.production     # Backend production config
    │   └── .dockerignore
    ├── app.production.json      # Mobile app production config
    ├── .env.production          # Frontend production config
    └── build-apk.ps1           # APK build script
```

## 🎉 Success!

Your AlertDavao application is now live and accessible from anywhere in the world!

Users can download your APK and start using the app immediately.

---

**Need help?** Review the troubleshooting section or check the detailed `DEPLOYMENT_GUIDE.md`.
