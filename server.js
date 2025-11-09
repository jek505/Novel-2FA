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

// 1) Koneksi DB
if (!process.env.MONGODB_URI) console.error('Missing MONGODB_URI');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Mongo error:', err.message));

// 2) Register models (WAJIB sebelum passport)
require('./models/User');
require('./models/Novel');

// 3) Views, parsers, static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 4) Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  })
}));
app.use(flash());

// 5) Passport (tanpa require() dipanggil)
try {
  const cfg = require('./config/passport');
  if (typeof cfg === 'function') cfg(passport);
  else console.log('[passport] non-callable export');
} catch (e) {
  console.error('[passport] load error:', e.message);
}
app.use(passport.initialize());
app.use(passport.session());

// 6) Globals & helper
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});
app.response.renderView = function (view, data = {}) { return this.render(view, data); };

// 7) Routes
app.use('/', require('./routes/home'));
app.use('/auth', require('./routes/auth'));
app.use('/novels', require('./routes/novels'));
app.use('/2fa', require('./routes/twofa'));

// 8) Health & 404
app.get('/health', (_req, res) => res.send('OK'));
app.use((req, res) => res.status(404).render('404', { title: '404' }));

// 9) Export untuk Vercel / listen lokal
const PORT = process.env.PORT || 3000;
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
}
