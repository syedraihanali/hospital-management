function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || 500;
  const message =
    status >= 500 ? 'Internal server error' : err.message || 'Request could not be processed';

  return res.status(status).json({ error: message });
}

module.exports = errorHandler;
