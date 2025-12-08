# AlertDavao - Defense Day Setup Guide

## 🎯 Your Setup Configuration

**Your Scenario:**
- **PC at home** - Running Docker containers
- **Laptop at school** - Accessing admin dashboard via browser
- **Phone at school** - Running mobile APK

**Solution:** Ngrok proxy with single URL serving both AdminSide and UserSide

---

## 📋 Before Defense Day (Setup on PC at home)

### 1. Start Docker Containers
```powershell
cd D:\Codes\alertdavao\alertdavao
docker-compose up -d
```

### 2. Verify All Services Running
```powershell
docker-compose ps
```
You should see all 5 containers running:
- alertdavao_mysql
- alertdavao_adminside
- alertdavao_userside_backend
- alertdavao_sarima_api
- alertdavao_ngrok

### 3. Get Your Ngrok URL
```powershell
$tunnels = (Invoke-WebRequest -Uri http://localhost:4040/api/tunnels -UseBasicParsing | ConvertFrom-Json).tunnels
$tunnels[0].public_url
```

Current URL: **https://tubbable-erwin-adequately.ngrok-free.dev**

---

## 📱 Mobile App Configuration

### Configure APK with Proxy URL:
```
Backend URL: https://tubbable-erwin-adequately.ngrok-free.dev/api/mobile
```

**Important:** Add `/api/mobile` at the end!

### Mobile App API Endpoints:
- Login: `https://tubbable-erwin-adequately.ngrok-free.dev/api/mobile/login`
- Register: `https://tubbable-erwin-adequately.ngrok-free.dev/api/mobile/register`
- Reports: `https://tubbable-erwin-adequately.ngrok-free.dev/api/mobile/reports`
- Health Check: `https://tubbable-erwin-adequately.ngrok-free.dev/api/mobile/health`

---

## 💻 Defense Day (At School)

### On Your Laptop:

1. **Open browser**
2. **Navigate to:** https://tubbable-erwin-adequately.ngrok-free.dev
3. **Login with:** alertdavao.ph@gmail.com
4. **Show features:**
   - Dashboard with 8,000 crime reports on map
   - Crime statistics
   - User management
   - Report verification

### On Your Phone:

1. **Install APK** (pre-built with ngrok URL)
2. **Connect to school WiFi** (any WiFi works, doesn't need to match PC)
3. **Open app** - it connects automatically
4. **Demonstrate:**
   - User registration/login
   - Crime reporting with photos
   - Live map updates
   - Push notifications

---

## 🔍 Testing Before Defense

### Test AdminSide Web (on any device):
```
https://tubbable-erwin-adequately.ngrok-free.dev
```

### Test Mobile API (using browser or Postman):
```
https://tubbable-erwin-adequately.ngrok-free.dev/api/mobile/health
```
Should return: `{"status":"healthy","timestamp":"..."}`

---

## ⚠️ Important Notes

1. **Keep PC running at home** during your defense
2. **Ensure stable internet** on your home PC
3. **Don't close Docker Desktop** on PC
4. **Ngrok URL might change** if you restart ngrok container
5. **If URL changes:**
   - Rebuild mobile APK with new URL
   - Update laptop bookmark

---

## 🚨 Troubleshooting

### If laptop can't access admin panel:
1. Check PC is running and connected to internet
2. Verify Docker containers are up: `docker-compose ps`
3. Check ngrok tunnel: Visit http://localhost:4040 on PC

### If phone app can't connect:
1. Verify APK has correct URL with `/api/mobile` suffix
2. Test proxy: Open `https://YOUR_NGROK_URL/api/mobile/health` in phone browser
3. Check UserSide backend: `docker-compose logs userside-backend`

### Emergency fallback:
If ngrok fails, bring laptop with Docker installed and use local network setup.

---

## 📊 What's Currently Loaded

- **Database:** 18,530 crime reports (imported from alertdavao.sql)
- **Map Display:** 8,000 random reports with scattered coordinates
- **Users:** 4 admin users ready for demo
- **Features:** Full CRUD, analytics, SARIMA forecasting, hotspot mapping

---

## ✅ Defense Day Checklist

**Night Before:**
- [ ] PC running with Docker containers up
- [ ] Ngrok tunnel active and verified
- [ ] Mobile APK built and installed on phone
- [ ] Test laptop browser access
- [ ] Test phone app connection
- [ ] Prepare backup laptop with Docker (optional)

**At Venue:**
- [ ] Laptop charged and ready
- [ ] Phone charged with APK installed
- [ ] Verify PC at home is still running
- [ ] Test URLs before presentation starts
- [ ] Have ngrok dashboard open (http://localhost:4040) for monitoring

---

## 🎓 Presentation Flow

1. **Show mobile app** (phone)
   - User registration/login
   - Submit crime report with photo
   - View crime map on mobile

2. **Show admin dashboard** (laptop)
   - Login to admin panel
   - View newly submitted report
   - Show analytics and statistics
   - Display 8k crime markers on map
   - Demonstrate SARIMA forecasting

3. **Show real-time sync**
   - Submit report on phone
   - Show it appearing in admin panel
   - Verify location on map

---

**Good luck with your defense! 🚀**
