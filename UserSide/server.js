// Node.js API server for direct MySQL connection to alertdavao database
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '1234', // Update with your MySQL password
  database: 'alertdavao'
};

// Create MySQL connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    
    console.log('✓ MySQL connection to alertdavao database successful');
    res.json({ 
      success: true, 
      message: 'Connected to alertdavao database successfully',
      database: 'alertdavao',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('✗ MySQL connection failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Get user by ID from users table
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Fetching user ${userId} from alertdavao.users table...`);
    
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = rows[0];
    console.log(`✓ User found in alertdavao.users:`, user);
    console.log(`✓ Location/Address from database: "${user.address || user.location || ''}"`);
    
    res.json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user',
      error: error.message 
    });
  }
});

// Insert or update user in users table (upsert)
app.post('/api/users/upsert', async (req, res) => {
  try {
    const { id, firstname, lastname, email, contact, location, is_verified, profile_image } = req.body;
    
    console.log(`Upserting user ${id} to alertdavao.users table...`);
    console.log(`Address/Location to save: "${location}"`);
    
    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    let result;
    if (existingUser.length > 0) {
      // Update existing user
      console.log('Updating existing user...');
      [result] = await pool.execute(
        `UPDATE users SET 
         firstname = ?, lastname = ?, email = ?, contact = ?, 
         address = ?, is_verified = ?, profile_image = ?, 
         updated_at = NOW()
         WHERE id = ?`,
        [firstname, lastname, email, contact, location, is_verified, profile_image, id]
      );
    } else {
      // Insert new user
      console.log('Inserting new user...');
      [result] = await pool.execute(
        `INSERT INTO users 
         (id, firstname, lastname, email, contact, address, is_verified, profile_image, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, firstname, lastname, email, contact, location, is_verified, profile_image]
      );
    }
    
    console.log(`✓ User saved to alertdavao.users successfully`);
    console.log(`✓ Address "${location}" saved to 'address' column`);
    
    res.json({ 
      success: true, 
      message: 'User saved successfully',
      action: existingUser.length > 0 ? 'updated' : 'created',
      location_saved: location
    });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving user',
      error: error.message 
    });
  }
});

// Update only location field
app.patch('/api/users/:id/location', async (req, res) => {
  try {
    const userId = req.params.id;
    const { location } = req.body;
    
    console.log(`Updating address for user ${userId} in alertdavao.users...`);
    console.log(`New address: "${location}"`);
    
    const [result] = await pool.execute(
      'UPDATE users SET address = ?, updated_at = NOW() WHERE id = ?',
      [location, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log(`✓ Address updated in alertdavao.users successfully`);
    console.log(`✓ Address "${location}" saved to 'address' column`);
    
    res.json({ 
      success: true, 
      message: 'Location updated successfully',
      location_saved: location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating location',
      error: error.message 
    });
  }
});

// Execute raw SQL query
app.post('/api/query', async (req, res) => {
  try {
    const { query, params = [] } = req.body;
    
    console.log(`Executing query on alertdavao database:`, query, params);
    
    const [rows] = await pool.execute(query, params);
    
    console.log(`✓ Query executed successfully`);
    
    res.json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error executing query',
      error: error.message 
    });
  }
});

// Get database status and table info
app.get('/api/db-status', async (req, res) => {
  try {
    // Get table structure
    const [tableInfo] = await pool.execute('DESCRIBE users');
    
    // Get user count
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const userCount = countResult[0].count;
    
    console.log(`✓ Database status check completed`);
    console.log(`✓ Users table has ${userCount} records`);
    
    res.json({ 
      success: true,
      database: 'alertdavao',
      table: 'users',
      user_count: userCount,
      table_structure: tableInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting database status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting database status',
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 AlertDavao Database API Server Started');
  console.log('='.repeat(60));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🗄️  Database: ${dbConfig.database}`);
  console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`👤 User: ${dbConfig.user}`);
  console.log('='.repeat(60));
  console.log('Available endpoints:');
  console.log('  GET  /api/test-connection     - Test MySQL connection');
  console.log('  GET  /api/users/:id          - Get user by ID');
  console.log('  POST /api/users/upsert       - Insert/Update user');
  console.log('  PATCH/api/users/:id/location - Update user location');
  console.log('  POST /api/query              - Execute raw SQL');
  console.log('  GET  /api/db-status          - Database status');
  console.log('='.repeat(60));
});