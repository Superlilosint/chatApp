const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(user) {
  return jwt.sign(
    { userId: user._id, displayName: user.displayName, avatar: user.avatar },
    env.jwtSecret,
    { expiresIn: '7d' }
  );
}

exports.oauthCallback = (req, res) => {
  const token = signToken(req.user);
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.redirect(env.nodeEnv === 'production' ? '/' : env.clientUrl);
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};
