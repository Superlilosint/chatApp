const router = require('express').Router();
const passport = require('../config/passport');
const { oauthCallback, logout } = require('../controllers/authController');

router.get(
  '/google',
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  oauthCallback
);

router.get(
  '/github',
  passport.authenticate('github', { session: false, scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  oauthCallback
);

router.post('/logout', logout);

module.exports = router;
