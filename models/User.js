const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  twoFA: {
    enabled: { type: Boolean, default: false },
    secret: { type: String, default: '' }
  }
}, { timestamps: true });

// daftar model bernama "User"
module.exports = mongoose.model('User', userSchema);
