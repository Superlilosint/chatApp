const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const env = require('../config/env');

module.exports = function socketAuth(socket, next) {
  const cookies = socket.handshake.headers.cookie;
  if (!cookies) {
    return next(new Error('Authentication required'));
  }

  const parsed = cookie.parse(cookies);
  const token = parsed.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};
