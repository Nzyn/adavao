# ⚡ AlertDavao - Quick Command Reference

## 🚀 Initial Deployment

```powershell
# Option 1: Interactive Wizard (Recommended)
.\start-here.ps1

# Option 2: Manual Steps
.\check-deployment.ps1              # Validate setup
.\deploy.ps1                        # Deploy services
.\update-production-urls.ps1        # Configure URLs
cd UserSide && .\build-apk.ps1      # Build APK
```

---

## 🌐 Access Points

| Service | URL |
|---------|-----|
| Ngrok Dashboard | http://localhost:4040 |
| Backend API | Your ngrok URL from dashboard |
| Admin Panel | Your ngrok URL from dashboard |
| SARIMA API | Your ngrok URL from dashboard |

---

## 🔧 Service Management

```powershell
# View all services
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f userside-backend
docker-compose logs -f adminside
docker-compose logs -f sarima-api
docker-compose logs -f mysql

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart [service-name]

# Stop all services
docker-compose down

# Start services
docker-compose up -d

# Rebuild and restart
docker-compose build && docker-compose up -d
```

---

## 📊 Database Operations

```powershell
# Backup database
docker-compose exec mysql mysqldump -u root -p alertdavao > backup.sql

# Restore database
Get-Content backup.sql | docker-compose exec -T mysql mysql -u root -p alertdavao

# Run migrations
docker-compose exec adminside php artisan migrate --force

# Access MySQL console
docker-compose exec mysql mysql -u root -p

# Check database connection
docker-compose exec adminside php artisan db:show
```

---

## 📱 Mobile App

```powershell
# Build production APK
cd UserSide
.\build-apk.ps1

# Update configs and rebuild
cd ..
.\update-production-urls.ps1
cd UserSide
.\build-apk.ps1

# Check EAS build status
eas build:list

# Login to EAS (first time)
eas login
```

---

## 🔄 Updates & Maintenance

```powershell
# Update code and redeploy
git pull
docker-compose build
docker-compose up -d

# Update only backend
docker-compose build userside-backend
docker-compose restart userside-backend

# Update only admin
docker-compose build adminside
docker-compose restart adminside

# Update URLs (when ngrok restarts)
.\update-production-urls.ps1
```

---

## 🐛 Troubleshooting

```powershell
# Pre-deployment check
.\check-deployment.ps1

# Check Docker status
docker ps -a

# View detailed container info
docker inspect [container-name]

# Remove all containers and volumes (CAUTION!)
docker-compose down -v

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check health endpoints
curl http://localhost:3000/api/health
curl http://localhost:8080/health
```

---

## 🔐 Security

```powershell
# Change database password (in .env)
# Then rebuild:
docker-compose down
docker-compose up -d

# View environment variables
docker-compose exec userside-backend printenv

# Rotate ngrok token (in ngrok.yml)
# Then restart:
docker-compose restart ngrok
```

---

## 📈 Monitoring

```powershell
# Resource usage
docker stats

# Container health
docker-compose ps

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## 🌟 Common Workflows

### First Time Setup
```powershell
.\start-here.ps1
```

### Daily Development
```powershell
docker-compose up -d
docker-compose logs -f
```

### Update and Redeploy
```powershell
git pull
docker-compose build
docker-compose up -d
```

### Distribute New APK
```powershell
cd UserSide
.\build-apk.ps1
```

### When Ngrok URLs Change
```powershell
.\update-production-urls.ps1
cd UserSide
.\build-apk.ps1
```

---

## 📚 Documentation

- `START_HERE.md` - Start here!
- `SETUP_COMPLETE.md` - Complete overview
- `README_DEPLOYMENT.md` - Full guide
- `DEPLOYMENT_GUIDE.md` - Detailed steps
- `QUICK_START.md` - Quick reference
- `DEPLOYMENT_SUMMARY.md` - Technical summary

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| Containers won't start | `docker-compose logs` to check errors |
| Can't access ngrok URLs | Check `ngrok.yml` has correct authtoken |
| App can't connect | Run `.\update-production-urls.ps1` |
| Database errors | `docker-compose restart mysql` |
| Out of disk space | `docker system prune -a` |
| Port conflicts | Change ports in `docker-compose.yml` |
| Ngrok URLs changed | Run `.\update-production-urls.ps1` |

---

**Keep this file handy for quick reference! 📌**
