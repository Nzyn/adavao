/**
 * Server-side Response Caching Middleware
 * Reduces database load for frequently accessed endpoints
 */

// Simple in-memory cache
const cache = new Map();

// Cache configuration per endpoint pattern
const cacheConfig = {
  // Static/semi-static data - longer cache
  '/api/police-stations': { ttl: 300000 },         // 5 minutes
  '/api/barangays': { ttl: 300000 },               // 5 minutes
  '/api/announcements': { ttl: 30000 },            // 30 seconds
  
  // Dynamic data - shorter cache
  '/api/messages/conversations': { ttl: 2000 },    // 2 seconds
  '/api/messages/': { ttl: 2000 },                 // 2 seconds
  '/api/reports/user': { ttl: 5000 },              // 5 seconds
  '/api/notifications': { ttl: 2000 },             // 2 seconds
  '/api/dispatch': { ttl: 2000 },                  // 2 seconds
  '/api/patrol/locations': { ttl: 1000 },          // 1 second (real-time)
};

// Get cache key from request
function getCacheKey(req) {
  return `${req.method}:${req.originalUrl}`;
}

// Get TTL for endpoint
function getTTL(path) {
  for (const [pattern, config] of Object.entries(cacheConfig)) {
    if (path.startsWith(pattern)) {
      return config.ttl;
    }
  }
  return 0; // No caching by default
}

// Cache middleware for GET requests
function cacheMiddleware(req, res, next) {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const ttl = getTTL(req.path);
  if (ttl === 0) {
    return next();
  }

  const key = getCacheKey(req);
  const cached = cache.get(key);

  if (cached && Date.now() < cached.expiresAt) {
    // Return cached response
    res.set('X-Cache', 'HIT');
    return res.json(cached.data);
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json to cache response
  res.json = (data) => {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(key, {
        data,
        expiresAt: Date.now() + ttl,
      });
      
      // Prevent cache from growing too large
      if (cache.size > 1000) {
        evictOldestEntries(100);
      }
    }
    
    res.set('X-Cache', 'MISS');
    return originalJson(data);
  };

  next();
}

// Evict oldest entries when cache is full
function evictOldestEntries(count) {
  const entries = Array.from(cache.entries())
    .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  
  for (let i = 0; i < count && i < entries.length; i++) {
    cache.delete(entries[i][0]);
  }
}

// Invalidate cache entries matching pattern
function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Clear all cache
function clearCache() {
  cache.clear();
}

// Get cache stats
function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      expiresIn: Math.max(0, value.expiresAt - Date.now()),
    })),
  };
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCache,
  getCacheStats,
};
