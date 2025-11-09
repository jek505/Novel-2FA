const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Novel = mongoose.model('Novel');
const { ensureAuth, ensure2FA } = require('../config/middleware');
const multer = require('multer');
const path = require('path');

// ===== MULTER (upload cover ke /public/uploads) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Hanya file gambar yang diizinkan'));
    }
    cb(null, true);
  },
});
// ====================================================

// ===== READ: daftar =====
router.get('/', async (req, res) => {
  try {
    const novels = await Novel.find().sort({ createdAt: -1 });
    res.renderView('novels/index', { title: 'Novel', novels });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat novel.');
    res.redirect('/');
  }
});

// ===== CREATE: form =====
router.get('/new/form', ensureAuth, ensure2FA, (req, res) => {
  res.renderView('novels/new', { title: 'Tambah Novel' });
});

// ===== CREATE: simpan =====
router.post('/', ensureAuth, ensure2FA, upload.single('cover'), async (req, res) => {
  try {
    const { title, author, description, content } = req.body;
    if (!title || !author) {
      req.flash('error', 'Judul dan penulis wajib diisi.');
      return res.redirect('/novels/new/form');
    }
    const coverUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.coverUrl || '');
    console.log('[UPLOAD CREATE]', Boolean(req.file), coverUrl); // debug
    const n = await Novel.create({ title, author, description, content, coverUrl });
    req.flash('success', 'Novel berhasil ditambahkan.');
    res.redirect('/novels/' + n._id);
  } catch (err) {
    console.error(err);
    req.flash('error', err.message || 'Gagal menambahkan novel.');
    res.redirect('/novels/new/form');
  }
});

// ===== READ: detail =====
router.get('/:id', async (req, res) => {
  try {
    const novel = await Novel.findById(req.params.id);
    if (!novel) return res.status(404).renderView('404', { title: 'Novel Tidak Ditemukan' });
    res.renderView('novels/detail', { title: novel.title, novel });
  } catch (err) {
    console.error(err);
    res.status(404).renderView('404', { title: 'Novel Tidak Ditemukan' });
  }
});

// ===== UPDATE: form =====
router.get('/:id/edit', ensureAuth, ensure2FA, async (req, res) => {
  try {
    const novel = await Novel.findById(req.params.id);
    if (!novel) {
      req.flash('error', 'Novel tidak ditemukan.');
      return res.redirect('/novels');
    }
    res.renderView('novels/edit', { title: 'Edit: ' + novel.title, novel });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat halaman edit.');
    res.redirect('/novels');
  }
});

// ===== UPDATE: simpan =====
router.post('/:id/update', ensureAuth, ensure2FA, upload.single('cover'), async (req, res) => {
  try {
    const { title, author, description, content, coverUrl: coverUrlInput } = req.body;
    const novel = await Novel.findById(req.params.id);
    if (!novel) {
      req.flash('error', 'Novel tidak ditemukan.');
      return res.redirect('/novels');
    }
    novel.title = title || novel.title;
    novel.author = author || novel.author;
    novel.description = description ?? novel.description;
    novel.content = content ?? novel.content;
    if (req.file) {
      novel.coverUrl = `/uploads/${req.file.filename}`;
    } else if (coverUrlInput) {
      novel.coverUrl = coverUrlInput;
    }
    console.log('[UPLOAD UPDATE]', Boolean(req.file), novel.coverUrl); // debug
    await novel.save();
    req.flash('success', 'Novel berhasil diperbarui.');
    res.redirect('/novels/' + novel._id);
  } catch (err) {
    console.error(err);
    req.flash('error', err.message || 'Gagal memperbarui novel.');
    res.redirect('/novels/' + req.params.id + '/edit');
  }
});

// ===== DELETE =====
router.post('/:id/delete', ensureAuth, ensure2FA, async (req, res) => {
  try {
    await Novel.findByIdAndDelete(req.params.id);
    req.flash('success', 'Novel dihapus.');
    res.redirect('/novels');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal menghapus novel.');
    res.redirect('/novels');
  }
});

module.exports = router;
