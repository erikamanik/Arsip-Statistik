const mongoose = require('mongoose');

// Kategori statistik per tahun (3 kategori bawaan dibuat otomatis saat tahun ditambahkan)
const categorySchema = new mongoose.Schema(
  {
    year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year', required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
