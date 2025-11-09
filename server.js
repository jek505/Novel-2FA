const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');

dotenv.config();
const app = express();

// ====== KONEKSI MONGODB ======
if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI');
}
mongoose.connect(process.env.MONGODB_URI, {
  // opsi default modern mongoose sudah oke
}).then(() => console.log('Mongo connected'))
  .catch(err => console.error('Mongo error', err.message));

// ====== REGISTER MODEL DULU (PENTING) ======
require('./models/User');
require('./models/Novel');

// ====== VIEW ENGINE & STATIC ======
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ====== SESSION, FLASH, PASSPORT ======
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
  }),
}));
app.use(flash());

// CONFIGURE PASSPORT SETELAH MODEL TEREGISTER
const passportCfg = require('./config/passport');
if (typeof passportCfg === 'function') {
  passportCfg(passport);
}
app.use(passport.initialize());
app.use(passport.session());

// GLOBALS & HELPER
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});
app.response.renderView = function(view, data = {}) { return this.render(view, data); };

// ROUTES
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/novels', require('./routes/novels'));
app.use('/2fa', require('./routes/twofa'));

// HEALTH
app.get('/health', (req, res) => res.send('OK'));

// 404
app.use((req, res) => res.status(404).render('404', { title: '404' }));

// EXPORT UNTUK VERCEL
const PORT = process.env.PORT || 3000;
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
}
