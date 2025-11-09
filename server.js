const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');

// ====== CONFIGURASI DASAR ======
dotenv.config();
const app = express();

// ====== VIEW ENGINE ======
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ====== MIDDLEWARE UMUM ======
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ====== SESSION & FLASH ======
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions'
    }),
  })
);
app.use(flash());

// ====== PASSPORT CONFIG (anti error) ======
const passportCfg = require('./config/passport');
if (typeof passportCfg === 'function') {
  passportCfg(passport);
} else {
  console.log('[passport] config loaded (non-callable export)');
}

app.use(passport.initialize());
app.use(passport.session());

// ====== GLOBAL VARS UNTUK FLASH MESSAGE ======
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// ====== CUSTOM renderView() ======
app.response.renderView = function (view, data = {}) {
  return this.render(view, data);
};

// ====== ROUTES ======
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/novels', require('./routes/novels'));
app.use('/2fa', require('./routes/twofa'));

// ====== HEALTH CHECK ======
app.get('/health', (req, res) => res.send('OK'));

// ====== ERROR 404 FALLBACK ======
app.use((req, res) => res.status(404).render('404', { title: 'Halaman Tidak Ditemukan' }));

// ====== SERVER EXPORT UNTUK VERCEL ======
const PORT = process.env.PORT || 3000;

if (process.env.VERCEL) {
  module.exports = app; // penting agar bisa jalan di Vercel
} else {
  app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
}
