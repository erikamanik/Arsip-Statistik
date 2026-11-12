const express = require('express');
const jwt = require('jsonwebtoken');
const { handleUpload } = require('@vercel/blob/client');
const User = require('../models/User');

const router = express.Router();
const MAX_SIZE = 25 * 1024 * 1024; // maks 25 MB

// Browser meminta "tiket" upload di sini, lalu mengirim file langsung ke Vercel Blob
// (tidak lewat backend, jadi tidak kena batas 4,5 MB Vercel).
router.post('/', async (req, res) => {
  try {
    const json = await handleUpload({
      request: req,
      body: req.body,
      onBeforeGenerateToken: async () => {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        let payload;
        try {
          payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
          throw new Error('Silakan login terlebih dahulu.');
        }
        const user = await User.findById(payload.id).select('_id');
        if (!user) throw new Error('Silakan login terlebih dahulu.');
        return { maximumSizeInBytes: MAX_SIZE, addRandomSuffix: true };
      },
    });
    res.json(json);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;