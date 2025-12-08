# 🚀 AlertDavao - Quick Deployment Guide

## ONE-LINE DEPLOYMENT

```powershell
# 1. First Time Setup (run once)
.\deploy.ps1

# 2. Update your ngrok URLs (after step 1 completes)
.\update-production-urls.ps1

# 3. Build APK
cd UserSide
.\build-apk.ps1
```

## 📝 What You Need

1. **Ngrok Auth Token** → https://dashboard.ngrok.com/get-started/your-authtoken
2. **EAS Account** → Run `eas login` (first time only)

## 🌐 Your Live URLs

After running `deploy.ps1`, open http://localhost:4040 to get:
- **Backend API**: `https://xxxxxx.ngrok-free.app` ← Use this in mobile app
- **Admin Panel**: `https://yyyyyy.ngrok-free.app` ← Use this for admin access
- **SARIMA API**: `https://zzzzzz.ngrok-free.app` ← Crime forecasting

## 📱 Distribute Your APK

1. After `build-apk.ps1` completes, download APK from EAS link
2. Upload to Google Drive/Dropbox
3. Share link with users
4. Users: Enable "Unknown Sources" → Install APK

## ⚡ Quick Commands

```powershell
# View all services
docker-compose ps

# View logs
docker-compose logs -f

# Restart everything
docker-compose restart

# Stop everything
docker-compose down

# Update code and redeploy
git pull
docker-compose build
docker-compose up -d
```

## 🔧 Troubleshooting

**Containers won't start?**
```powershell
docker-compose logs [service-name]
```

**URLs changed?** (ngrok free tier)
```powershell
.\update-production-urls.ps1
cd UserSide
.\build-apk.ps1
```

**Database issues?**
```powershell
docker-compose restart mysql
docker-compose exec adminside php artisan migrate --force
```

## 📚 Full Documentation

See `DEPLOYMENT_GUIDE.md` for detailed instructions and advanced configuration.

## ✅ Deployment Checklist

- [ ] Docker Desktop running
- [ ] Ngrok token in `ngrok.yml`
- [ ] Run `.\deploy.ps1`
- [ ] Get URLs from http://localhost:4040
- [ ] Run `.\update-production-urls.ps1`
- [ ] Update database if needed
- [ ] Run `.\build-apk.ps1`
- [ ] Test APK on device
- [ ] Distribute to users

**That's it! Your app is live! 🎉**
