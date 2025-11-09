const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
require('dotenv').config();
require('./models/User');
require('./models/Novel'); // <- pastikan ada
require('./config/passport')(passport);

const app = express();

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static (penting untuk /uploads dan /images)
app.use(express.static(path.join(__dirname, 'public')));

// Session & flash
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Globals (untuk EJS)
app.use((req, res, next) => {
  res.locals.appName = process.env.APP_NAME || 'Novelku';
  res.locals.user = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// EJS helper
app.response.renderView = function(view, data = {}) {
  return this.render(view, data);
};

// Routes
app.use('/novels', require('./routes/novels'));
app.use('/', require('./routes/auth')); // kalau ada auth

// 404
app.use((req, res) => res.status(404).renderView('404', { title: '404' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
