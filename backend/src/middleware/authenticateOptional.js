const jwt = require('jsonwebtoken');
const config = require('../config/env');
function authenticateOptional(req, _res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authorizationHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
  } catch (error) {
    req.user = null;
  }

  return next();
}

module.exports = authenticateOptional;
