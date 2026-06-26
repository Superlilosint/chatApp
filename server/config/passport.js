const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const env = require('./env');

function findOrCreateUser(profile, provider, done) {
  const providerId = profile.id;
  const email = profile.emails?.[0]?.value || '';
  const displayName = profile.displayName || profile.username || 'Anonymous';
  const avatar = profile.photos?.[0]?.value || '';

  User.findOne({ providerId, provider })
    .then((existingUser) => {
      if (existingUser) {
        return done(null, existingUser);
      }
      return User.create({ providerId, provider, email, displayName, avatar })
        .then((newUser) => done(null, newUser));
    })
    .catch((err) => done(err, null));
}

if (env.google.clientId && env.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
        scope: ['profile', 'email'],
      },
      (accessToken, refreshToken, profile, done) => {
        findOrCreateUser(profile, 'google', done);
      }
    )
  );
} else {
  console.warn('Google OAuth not configured — skipping');
}

if (env.github.clientId && env.github.clientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.github.clientId,
        clientSecret: env.github.clientSecret,
        callbackURL: env.github.callbackUrl,
        scope: ['user:email'],
      },
      (accessToken, refreshToken, profile, done) => {
        findOrCreateUser(profile, 'github', done);
      }
    )
  );
} else {
  console.warn('GitHub OAuth not configured — skipping');
}

module.exports = passport;
