// db.js
const mysql = require("mysql2");

// Create a promise-based connection pool
const db = mysql.createPool({
  host: "127.0.0.1",   // or localhost
  user: "root",        // your MySQL username
  password: "1234",    // ✅ MySQL Server 80 password
  database: "alertdavao", // ✅ correct DB name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise(); // ✅ this makes db.query() return a promise

module.exports = db;

//add connections
