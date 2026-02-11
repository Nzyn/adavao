/**
 * Utility function to get the client's IP address from the request
 * Handles various proxy scenarios (X-Forwarded-For, X-Real-IP, etc.)
 * 
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
function getClientIp(req) {
  // Check X-Forwarded-For header (used by proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, the first one is the client
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header (used by some proxies)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    return cfIp;
  }

  // Fallback to the remote address from the connection
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.connection?.socket?.remoteAddress ||
         'unknown';
}

/**
 * Normalize IPv6 loopback addresses to IPv4
 * @param {string} ip - IP address
 * @returns {string} - Normalized IP address
 */
function normalizeIp(ip) {
  // Convert IPv6 loopback to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  
  // Remove IPv6 prefix if present
  if (ip && ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  return ip;
}

/**
 * Get user agent string from request
 * @param {Object} req - Express request object
 * @returns {string} - User agent string
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

module.exports = {
  getClientIp,
  normalizeIp,
  getUserAgent
};
