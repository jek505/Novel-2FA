const express = require('express');
const router = express.Router();
const { ensureSetup2FAIfEnabled } = require('../config/middleware');

// Home page. If user has 2FA enabled but not verified in this session,
// ensureSetup2FAIfEnabled will redirect to verification.
router.get('/', ensureSetup2FAIfEnabled, (req, res) => {
  res.renderView('index', { title: 'Beranda' });
});

module.exports = router;