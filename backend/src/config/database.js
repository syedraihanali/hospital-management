const mysql = require('mysql2/promise');
const config = require('./env');

// Shared MySQL connection pool used across the application.
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: config.database.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  connectTimeout: config.database.connectTimeout,
});

async function waitForAvailability(
  attempts = config.database.retryAttempts,
  delay = config.database.retryDelayMs
) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return;
    } catch (error) {
      lastError = error;
      if (connection) {
        connection.release();
      }
      if (attempt < attempts) {
        // eslint-disable-next-line no-console
        console.warn(
          `Database connection failed (attempt ${attempt}/${attempts}). Retrying in ${delay}ms...`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

pool.waitForAvailability = waitForAvailability;

module.exports = pool;
