const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

module.exports = (passport) => {
  // Pastikan model User terdaftar
  let User;
  try {
    User = mongoose.model('User');
  } catch (e) {
    // Jika belum terdaftar, require file model lalu ambil lagi
    require('../models/User');
    User = mongoose.model('User');
  }

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return done(null, false, { message: 'Email tidak terdaftar.' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return done(null, false, { message: 'Password salah.' });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const u = await User.findById(id);
      done(null, u);
    } catch (err) {
      done(err);
    }
  });
};
