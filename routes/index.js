// routes/index.js
const express = require('express');
const router = express.Router();

// Halaman beranda
router.get('/', (req, res) => {
  res.render('index', { title: 'Beranda' });
});

module.exports = router;
