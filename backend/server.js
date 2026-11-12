require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// DNS khusus hanya untuk lokal (di Vercel tidak perlu)
if (!process.env.VERCEL) {
  require('dns').setServers(['8.8.8.8', '1.1.1.1']);
}

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const blobRoutes = require('./routes/blob');

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length && !process.env.VERCEL) {
  console.error(`Isi dulu variabel ini di file backend/.env: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();

const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''));
app.use(cors({ origin: origins }));
app.use(express.json());

// File yang diunggah (nama file acak, jadi tidak bisa ditebak)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check: tidak butuh database, berguna untuk cek apakah function hidup
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Koneksi MongoDB yang di-cache (wajib untuk serverless)
let connecting = null;
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  }
  try {
    await connecting;
  } catch (err) {
    connecting = null;
    throw err;
  }
}

app.use(async (req, res, next) => {
  if (missing.length) {
    return res.status(500).json({ message: `Variabel environment belum diisi: ${missing.join(', ')}` });
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Gagal terhubung ke MongoDB:', err.message);
    res.status(500).json({ message: 'Tidak dapat terhubung ke database.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/blob-upload', blobRoutes); // harus sebelum contentRoutes (punya auth sendiri)
app.use('/api', contentRoutes);

// Penangan error (mis. file terlalu besar)
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Ukuran file maksimal 25 MB.' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID tidak valid.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

// Jalankan server hanya saat lokal; di Vercel cukup export app
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      console.log('Terhubung ke MongoDB Atlas');
      app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('Gagal terhubung ke MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = app;