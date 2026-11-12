require('dotenv').config();
require('express-async-errors');
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Isi dulu variabel ini di file backend/.env: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();

const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(cors({ origin: origins }));
app.use(express.json());

// File yang diunggah (nama file acak, jadi tidak bisa ditebak)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
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

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('Terhubung ke MongoDB Atlas');
    app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Gagal terhubung ke MongoDB:', err.message);
    process.exit(1);
  });
