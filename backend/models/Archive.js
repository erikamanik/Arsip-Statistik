const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['link', 'file', 'image'], required: true },
    url: { type: String }, // untuk tipe link
    filePath: { type: String }, // nama file di folder uploads (tipe file / image)
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    uploadedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      email: { type: String },
    },
  },
  { timestamps: true } // createdAt = waktu upload
);

module.exports = mongoose.model('Archive', archiveSchema);
