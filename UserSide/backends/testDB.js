const db = require('./db');

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL successfully!');
    connection.release();
  }
});
