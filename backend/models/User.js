const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // kosong jika akun dibuat lewat Google
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    googleId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
