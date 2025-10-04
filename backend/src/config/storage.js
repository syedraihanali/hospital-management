const { Client } = require('minio');
const config = require('./env');
const { ensureBucketExists } = require('../utils/storage');

const minioClient = new Client({
  endPoint: config.storage.endpoint,
  port: config.storage.port,
  accessKey: config.storage.accessKey,
  secretKey: config.storage.secretKey,
  useSSL: config.storage.useSSL,
});

ensureBucketExists(minioClient, config.storage.bucket).catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Unable to verify MinIO bucket:', error.message);
});

module.exports = { minioClient };
