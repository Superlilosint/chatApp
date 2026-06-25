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

module.exports = passport;
