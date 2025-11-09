const mongoose = require('mongoose');

const novelSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  coverUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Novel', novelSchema);
