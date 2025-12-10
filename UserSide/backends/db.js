// db.js
const mysql = require("mysql2");
require("dotenv").config();

// Create a promise-based connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_DATABASE || "alertdavao",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise(); // ✅ this makes db.query() return a promise

module.exports = db;

//add connections
