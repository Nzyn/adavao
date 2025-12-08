# Redis Caching Setup Guide for AlertDavao

## Quick Setup for New Machines

### Prerequisites
- Windows 10/11
- PHP 8.1+
- Composer installed
- Git installed

### Step 1: Install Memurai (Redis for Windows)

1. **Download Memurai**:
   - Visit: https://www.memurai.com/get-memurai
   - Click "Download Memurai Developer" (free for development)
   - Run the MSI installer

2. **Verify Installation**:
   ```powershell
   # Check if Memurai service is running
   Get-Service -Name "Memurai"
   ```
   Should show: `Status: Running`

### Step 2: Clone and Setup Project

```powershell
# Clone repository
git clone <your-repo-url>
cd alertdavao/AdminSide/admin

# Install PHP dependencies (includes Predis)
composer install

# Copy environment file
cp .env.example .env

# Edit .env and set your database credentials
# CACHE_DRIVER is already set to 'redis'
```

### Step 3: Test Redis Connection

```powershell
# Clear config cache
php artisan config:clear

# Test Redis
php artisan tinker --execute="use Illuminate\Support\Facades\Cache; Cache::put('test', 'works', 60); echo Cache::get('test');"
```

Expected output: `works`

### Step 4: Start Application

```powershell
php artisan serve
```

Your application now has Redis caching enabled!

---

## Cache Configuration

### Cache Tags Used

| Tag | Purpose | TTL | Clear When |
|-----|---------|-----|------------|
| `crime_map` | Crime map data | 5 min | New crime added |
| `static_data` | Barangays, crime types | 1 hour | Data structure changes |
| `barangays` | Barangay list | 1 hour | New barangay added |
| `crime_types` | Crime type list | 1 hour | New crime type added |
| `csv_data` | CSV file data | 30 min | CSV file updated |
| `dashboard` | Dashboard stats | 5 min | New report added |

### Manual Cache Clearing

```powershell
# Clear all cache
php artisan cache:clear

# Clear specific tags (in Laravel Tinker)
php artisan tinker
>>> Cache::tags(['crime_map'])->flush();
>>> Cache::tags(['dashboard'])->flush();
```

---

## Performance Expectations

| Operation | Before (File Cache) | After (Redis) |
|-----------|-------------------|---------------|
| First map load (18k crimes) | 2-3 seconds | 0.5-1 second |
| Cached map load | 1-2 seconds | <100ms |
| Dashboard load | 500ms | <50ms |

---

## Troubleshooting

### Issue: "Class Redis not found"

**Solution**: Ensure `REDIS_CLIENT=predis` is set in `.env`

```env
REDIS_CLIENT=predis
```

Then run:
```powershell
php artisan config:clear
```

### Issue: Memurai not running

**Solution**: Start Memurai service

```powershell
Start-Service Memurai
```

### Issue: Cache not updating

**Solution**: Clear cache manually

```powershell
php artisan cache:clear
```

---

## Git Deployment Checklist

### Files to Commit
- ✅ `composer.json` (with predis/predis)
- ✅ `composer.lock`
- ✅ `.env.example` (with CACHE_DRIVER=redis)
- ✅ `config/database.php` (with REDIS_CLIENT=predis)
- ✅ `app/Http/Controllers/MapController.php`
- ✅ `app/Http/Controllers/DashboardController.php`

### Files NOT to Commit
- ❌ `.env` (contains secrets)
- ❌ `vendor/` (installed via composer)

---

## Production Deployment

For production, consider:

1. **Set Redis Password**:
   ```env
   REDIS_PASSWORD=your_secure_password
   ```

2. **Use Memurai Enterprise** (for production support)

3. **Monitor Redis Memory**:
   ```powershell
   # Check memory usage
   redis-cli INFO MEMORY
   ```

4. **Set up Redis persistence** (already enabled with Memurai)

---

**Last Updated**: December 6, 2025  
**Redis Version**: Memurai 4.0.5 (Redis 7 compatible)  
**Laravel Version**: 10.x  
**Predis Version**: 3.3
