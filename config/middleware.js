/**
 * Middleware functions used across routes for authentication and 2FA.
 */
function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Anda harus login terlebih dahulu.');
  res.redirect('/auth/login');
}

function ensureGuest(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

/**
 * Middleware to force users to complete 2FA setup or verification if enabled.
 * If the user is logged in and has enabled 2FA but has not yet verified
 * their TOTP in this session, redirect them to the verification page.
 */
function ensureSetup2FAIfEnabled(req, res, next) {
  if (req.user && req.user.twoFA && req.user.twoFA.enabled && !req.session.twoFAVerified) {
    return res.redirect('/2fa/verify');
  }
  next();
}

/**
 * Middleware to protect sensitive routes. If 2FA is enabled for the current
 * user, they must have verified their TOTP during this session to proceed.
 */
function ensure2FA(req, res, next) {
  if (!req.user) {
    req.flash('error', 'Anda harus login terlebih dahulu.');
    return res.redirect('/auth/login');
  }
  if (req.user.twoFA && req.user.twoFA.enabled) {
    if (!req.session.twoFAVerified) {
      return res.redirect('/2fa/verify');
    }
  }
  next();
}

module.exports = { ensureAuth, ensureGuest, ensure2FA, ensureSetup2FAIfEnabled };