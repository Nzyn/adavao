# AlertDavao Docker Deployment Guide

## 🚀 Quick Start

### Prerequisites
1. **Docker Desktop** installed and running
2. **Ngrok account** - Sign up at https://ngrok.com
3. **EAS CLI** for building the mobile app: `npm install -g eas-cli`

### Step 1: Get Your Ngrok Auth Token
1. Go to https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken
3. Update `ngrok.yml` file - replace `YOUR_NGROK_AUTHTOKEN_HERE` with your actual token

### Step 2: Configure Environment
```powershell
# Copy the docker environment file
Copy-Item .env.docker .env
```

### Step 3: Start All Services
```powershell
# Start all containers
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 4: Get Your Ngrok URLs
1. Open http://localhost:4040 in your browser (Ngrok web interface)
2. You'll see 3 tunnels:
   - **userside-backend** - Your Node.js backend API
   - **adminside** - Your Laravel admin panel
   - **sarima-api** - Your Python forecasting API

3. Copy the HTTPS URLs for each service

### Step 5: Update Production Configurations

#### Update Backend Environment
Edit `UserSide/backends/.env.production`:
```env
BACKEND_URL=https://your-ngrok-backend-url.ngrok-free.app
```

#### Update Admin Environment
Edit `AdminSide/admin/.env.production`:
```env
APP_URL=https://your-ngrok-admin-url.ngrok-free.app
NODE_BACKEND_URL=https://your-ngrok-backend-url.ngrok-free.app
```

#### Update Mobile App
Edit `UserSide/.env.production`:
```env
RECAPTCHA_BASE_URL=https://your-ngrok-backend-url.ngrok-free.app
API_BASE_URL=https://your-ngrok-backend-url.ngrok-free.app
```

Edit `UserSide/app.production.json`:
```json
"recaptchaBaseUrl": "https://your-ngrok-backend-url.ngrok-free.app",
"apiBaseUrl": "https://your-ngrok-backend-url.ngrok-free.app"
```

### Step 6: Apply Production Environment to Containers

```powershell
# Copy production env files
Copy-Item UserSide/backends/.env.production UserSide/backends/.env -Force
Copy-Item AdminSide/admin/.env.production AdminSide/admin/.env -Force

# Restart containers to apply new environment
docker-compose restart userside-backend adminside
```

### Step 7: Initialize Database
```powershell
# Run migrations (first time only)
docker-compose exec adminside php artisan migrate --force
docker-compose exec adminside php artisan db:seed --force
```

### Step 8: Build Mobile APK

```powershell
# Navigate to UserSide
cd UserSide

# Copy production app.json
Copy-Item app.production.json app.json -Force

# Copy production .env
Copy-Item .env.production .env -Force

# Login to EAS (first time only)
eas login

# Build the APK
eas build --platform android --profile production

# Or build locally (faster, but requires Android SDK)
eas build --platform android --profile production --local
```

## 📱 Distributing the APK

After the build completes:

1. **Download APK**: EAS will provide a download link
2. **Share**: Upload to Google Drive, Dropbox, or your preferred platform
3. **Install**: Users need to enable "Install from Unknown Sources" on Android

## 🔧 Managing Services

### View All Running Containers
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

### Stop and Remove All Data
```powershell
docker-compose down -v
```

## 🌐 Accessing Your Services

- **Admin Panel**: https://your-ngrok-admin-url.ngrok-free.app
- **Backend API**: https://your-ngrok-backend-url.ngrok-free.app/api
- **SARIMA API**: https://your-ngrok-sarima-url.ngrok-free.app/docs
- **Ngrok Dashboard**: http://localhost:4040
- **MySQL**: localhost:3306 (from host machine)

## 🔐 Security Notes

1. **Change default passwords** in `.env` before deploying
2. **Never commit** `.env` files to git
3. **Use strong passwords** for database
4. **Rotate your ngrok authtoken** if compromised
5. **Enable ngrok authentication** for production (paid feature)

## 🐛 Troubleshooting

### Container Won't Start
```powershell
# Check logs
docker-compose logs [service-name]

# Rebuild container
docker-compose build [service-name]
docker-compose up -d [service-name]
```

### Database Connection Issues
```powershell
# Check MySQL is healthy
docker-compose ps mysql

# Check database logs
docker-compose logs mysql
```

### Ngrok Not Working
1. Verify authtoken in `ngrok.yml`
2. Check ngrok logs: `docker-compose logs ngrok`
3. Ensure containers are running: `docker-compose ps`

### Mobile App Can't Connect
1. Verify ngrok URLs are correct in `app.json` and `.env.production`
2. Test backend URL in browser
3. Rebuild app with updated configuration

## 📊 Monitoring

### Database Backup
```powershell
# Backup database
docker-compose exec mysql mysqldump -u root -p alertdavao > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p alertdavao < backup.sql
```

### Check Service Health
```powershell
# Backend health
curl http://localhost:3000/api/health

# SARIMA health
curl http://localhost:8080/health
```

## 🔄 Updates and Maintenance

### Update Code
```powershell
# Pull latest changes
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Update Dependencies
```powershell
# Backend
docker-compose exec userside-backend npm install

# Admin
docker-compose exec adminside composer install
```

## 🌟 Production Checklist

- [ ] Ngrok authtoken configured
- [ ] All environment files updated with ngrok URLs
- [ ] Database credentials changed from defaults
- [ ] Laravel app key generated
- [ ] Database migrated and seeded
- [ ] Mobile app built with production config
- [ ] All services accessible via ngrok
- [ ] APK tested on physical device
- [ ] Backup strategy in place

## 📝 Notes

- **Ngrok Free Plan**: URLs change every time you restart. For permanent URLs, upgrade to paid plan.
- **EAS Build**: Free tier has limited builds per month. Check your quota at https://expo.dev
- **Docker Volumes**: Database data persists in Docker volumes even after `docker-compose down`
