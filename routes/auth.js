const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const { ensureGuest } = require('../config/middleware');

// Show register page
router.get('/register', ensureGuest, (req, res) => {
  res.renderView('auth/register', { title: 'Daftar' });
});

// Handle registration
router.post('/register', ensureGuest, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      req.flash('error', 'Lengkapi semua field.');
      return res.redirect('/auth/register');
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      req.flash('error', 'Email sudah digunakan.');
      return res.redirect('/auth/register');
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash: hash });
    // Log the new user in automatically
    req.login(user, err => {
      if (err) throw err;
      return res.redirect('/');
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal mendaftar.');
    res.redirect('/auth/register');
  }
});

// Show login page
router.get('/login', ensureGuest, (req, res) => {
  res.renderView('auth/login', { title: 'Masuk' });
});

// Handle login
router.post('/login', ensureGuest, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info?.message || 'Login gagal.');
      return res.redirect('/auth/login');
    }
    req.logIn(user, err2 => {
      if (err2) return next(err2);
      // Reset 2FA verification status for new session
      req.session.twoFAVerified = false;
      // If user has already enabled 2FA, redirect to verify page
      if (user.twoFA && user.twoFA.enabled) {
        return res.redirect('/2fa/verify');
      }
      // Otherwise, force them to set up 2FA
      return res.redirect('/2fa/setup');
    });
  })(req, res, next);
});

// Handle logout
router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});

module.exports = router;