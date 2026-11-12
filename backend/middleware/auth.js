const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Wajib login
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Silakan login terlebih dahulu.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Akun tidak ditemukan.' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Sesi berakhir, silakan login kembali.' });
  }
}

// Hanya admin
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Hanya admin yang boleh melakukan aksi ini.' });
  }
  next();
}

module.exports = { auth, adminOnly };
