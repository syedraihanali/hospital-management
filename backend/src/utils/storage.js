const path = require('path');
const { v4: uuid } = require('uuid');
const config = require('../config/env');

async function ensureBucketExists(client, bucket) {
  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket, '');
  }
}

function getPublicUrl(objectName) {
  if (config.storage.publicUrl) {
    const base = config.storage.publicUrl.replace(/\/$/, '');
    return `${base}/${objectName}`;
  }
  const protocol = config.storage.useSSL ? 'https' : 'http';
  return `${protocol}://${config.storage.endpoint}:${config.storage.port}/${config.storage.bucket}/${objectName}`;
}

async function uploadBuffer(client, buffer, { folder = '', originalName, mimetype }) {
  const safeFolder = folder ? folder.replace(/\/+$/, '') + '/' : '';
  const extension = path.extname(originalName || '').toLowerCase();
  const objectName = `${safeFolder}${uuid()}${extension}`;

  await client.putObject(config.storage.bucket, objectName, buffer, undefined, {
    'Content-Type': mimetype,
  });

  return getPublicUrl(objectName);
}

module.exports = {
  ensureBucketExists,
  uploadBuffer,
  getPublicUrl,
};
