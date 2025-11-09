const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  twoFA: {
    enabled: { type: Boolean, default: false },
    secret: { type: String }
  }
});

module.exports = mongoose.model('User', userSchema);