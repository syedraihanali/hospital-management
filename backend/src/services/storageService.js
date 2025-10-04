const { minioClient } = require('../config/storage');
const { uploadBuffer } = require('../utils/storage');

async function storeFile(file, folder) {
  if (!file) {
    return null;
  }
  const url = await uploadBuffer(minioClient, file.buffer, {
    folder,
    originalName: file.originalname,
    mimetype: file.mimetype,
  });
  return url;
}

async function storeFiles(files = [], folder) {
  const uploads = await Promise.all(files.map((file) => storeFile(file, folder)));
  return uploads.filter(Boolean);
}

module.exports = {
  storeFile,
  storeFiles,
};
