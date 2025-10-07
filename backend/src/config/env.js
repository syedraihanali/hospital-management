const dotenv = require('dotenv');

dotenv.config();

const requiredVariables = ['JWT_SECRET'];

requiredVariables.forEach((variable) => {
  if (!process.env[variable]) {
    throw new Error(`Environment variable ${variable} is required but was not provided.`);
  }
});

const config = {
  port: Number.parseInt(process.env.PORT, 10) || 5001,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'clinic',
    connectionLimit: Number.parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    connectTimeout: Number.parseInt(process.env.DB_CONNECT_TIMEOUT_MS, 10) || 10000,
    retryAttempts: Number.parseInt(process.env.DB_RETRY_ATTEMPTS, 10) || 5,
    retryDelayMs: Number.parseInt(process.env.DB_RETRY_DELAY_MS, 10) || 2000,
  },
  storage: {
    endpoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: Number.parseInt(process.env.MINIO_PORT, 10) || 9000,
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    bucket: process.env.MINIO_BUCKET || 'hospital-data',
    useSSL: String(process.env.MINIO_USE_SSL || 'false').toLowerCase() === 'true',
    publicUrl: process.env.MINIO_PUBLIC_URL || '127.0.0.1',
  },
};

module.exports = config;
