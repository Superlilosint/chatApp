module.exports = function errorHandler(err, req, res, _next) {
  console.error(err.stack || err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
};
