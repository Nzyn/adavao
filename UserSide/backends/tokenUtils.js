// Generate random token
const generateToken = (length = 64) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

// Get expiry timestamp for verification token (24 hours)
const getVerificationTokenExpiry = () => {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now;
};

// Get expiry timestamp for password reset token (1 hour)
const getResetTokenExpiry = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now;
};

// Format date for MySQL
const formatForMySQL = (date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

module.exports = {
  generateToken,
  getVerificationTokenExpiry,
  getResetTokenExpiry,
  formatForMySQL,
};
