const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');

// Load ENV
dotenv.config();

// Inisialisasi App
const app = express();

// ====== PASSPORT CONFIG ======
// (File config/passport.js Anda sudah benar, jadi ini tidak perlu diubah)
try {
  const passportConfig = require('./config/passport');
  if (typeof passportConfig === 'function') {
    passportConfig(passport);
  } else {
    console.log('[INFO] Passport config dimuat sebagai non-function.');
  }
} catch (err) {
  console.error('[ERROR] Tidak bisa memuat config passport:', err.message);
}

// ====== RENDER HELPER (FIXED) ======
// Menggunakan destructuring { attachRender } untuk mengambil fungsi dari objek
try {
  const { attachRender } = require('./config/render');
  
  if (typeof attachRender === 'function') {
    attachRender(app); // Memanggil fungsi yang benar
  } else {
    console.error('[ERROR] Fungsi attachRender tidak ditemukan di config/render.js');
    // Fallback jika gagal
    app.response.renderView = function (view, data = {}) {
      return this.render(view, data);
    };
  }
} catch (err) {
  console.error('[ERROR] Gagal memuat render config:', err.message);
  // Fallback jika gagal total
  app.response.renderView = function (view, data = {}) {
    return this.render(view, data);
  };
}


// ====== MONGOOSE ======
if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI!');
}
mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

// ====== REGISTER MODEL ======
require('./models/User');
require('./models/Novel');

// ====== MIDDLEWARE ======
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// SESSION
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// GLOBAL FLASH & USER
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// ROUTES
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/novels', require('./routes/novels'));
app.use('/2fa', require('./routes/twofa'));

// HEALTH CHECK
app.get('/health', (req, res) => res.send('OK'));

// 404 FALLBACK
app.use((req, res) => res.status(404).render('404', { title: '404' }));

// ====== EXPORT UNTUK VERCEL ======
const PORT = process.env.PORT || 3000;
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
}