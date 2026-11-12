const mongoose = require('mongoose');

// Card pengelompokan arsip di dalam sebuah kategori (berdasarkan nama arsip)
const groupSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
