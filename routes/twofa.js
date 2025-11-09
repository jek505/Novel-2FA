const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const { ensureAuth } = require('../config/middleware');

// Halaman setup (generate secret + QR)
router.get('/setup', ensureAuth, async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `${process.env.APP_NAME || 'Novelku'} (${req.user.email})`,
  });
  req.session.tmp2FASecret = secret.base32;
  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
  res.renderView('auth/twofa-setup', { title: 'Aktifkan Autentikasi Dua Langkah', qrDataUrl });
});

// Simpan secret ke database
router.post('/setup', ensureAuth, async (req, res) => {
  const token = (req.body.token || '').trim();
  const secret = req.session.tmp2FASecret;
  if (!secret) {
    req.flash('error', 'Sesi 2FA kadaluarsa. Silakan ulangi setup.');
    return res.redirect('/2fa/setup');
  }
  const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  if (!ok) {
    req.flash('error', 'Kode verifikasi salah.');
    return res.redirect('/2fa/setup');
  }

  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'twoFA.enabled': true, 'twoFA.secret': secret },
  });

  delete req.session.tmp2FASecret;
  req.session.twoFAVerified = true;
  req.flash('success', 'Autentikasi dua langkah diaktifkan.');
  res.redirect('/');
});

// Halaman verifikasi saat login
router.get('/verify', ensureAuth, async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user?.twoFA?.enabled || !user.twoFA.secret) {
    return res.redirect('/2fa/setup');
  }

  // Generate ulang QR setiap login
  const appName = encodeURIComponent(process.env.APP_NAME || 'Novelku');
  const label = encodeURIComponent(user.email);
  const otpauth = `otpauth://totp/${appName}:${label}?secret=${user.twoFA.secret}&issuer=${appName}`;
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  res.renderView('auth/twofa-verify', { title: 'Verifikasi Dua Langkah', qrDataUrl });
});

// Verifikasi token login
router.post('/verify', ensureAuth, async (req, res) => {
  const token = (req.body.token || '').trim();
  const user = await User.findById(req.user._id);
  const ok =
    user?.twoFA?.enabled &&
    speakeasy.totp.verify({ secret: user.twoFA.secret, encoding: 'base32', token, window: 2 });

  if (!ok) {
    req.flash('error', 'Kode verifikasi salah.');
    return res.redirect('/2fa/verify');
  }

  req.session.twoFAVerified = true;
  req.flash('success', 'Verifikasi dua langkah berhasil.');
  res.redirect('/');
});

module.exports = router;
