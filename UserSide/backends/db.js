// db.js
const { Pool } = require("pg");
require("dotenv").config();

// Create a connection pool
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Render Postgres
    }
  })
  : new Pool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_DATABASE || "alertdavao",
    port: process.env.DB_PORT || 5432,
    ssl: false
  });

// Wrapper to mimic mysql2 interface: returns [rows, fields]
const db = {
  query: async (text, params) => {
    const result = await pool.query(text, params);
    return [result.rows, result.fields];
  },
  getConnection: async () => {
    // For transactions
    const client = await pool.connect();
    // Wrap client to match expected mysql2 connection interface
    const connection = {
      query: async (text, params) => {
        const result = await client.query(text, params);
        // Postgres INSERT returns rows if RETURNING clause is used, 
        // but mysql2 returns { insertId: ... }. 
        // We will need to adjust calling code, but for SELECTs:
        return [result.rows, result.fields];
      },
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
      release: () => client.release()
    };
    return connection;
  }
};

module.exports = db;
//add connections
