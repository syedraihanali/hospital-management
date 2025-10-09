const jwt = require('jsonwebtoken');
const config = require('../config/env');

function optionalAuthenticate(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return next();
  }

  if (!authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid authorization header.' });
  }

  const token = authorizationHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    if (payload?.role) {
      req.user = payload;
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid access token.' });
  }

  return next();
}

module.exports = optionalAuthenticate;
