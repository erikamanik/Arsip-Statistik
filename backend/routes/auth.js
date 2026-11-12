const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v || '');

// POST /api/auth/register  -> daftar sebagai "user" atau "admin"
router.post('/register', async (req, res) => {
  try {
    const { role = 'user', name, email, password, adminCode } = req.body;

    if (!name?.trim() || !isEmail(email) || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi dengan benar.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }
    if (role === 'admin') {
      if (!process.env.ADMIN_CODE || adminCode !== process.env.ADMIN_CODE) {
        return res.status(403).json({ message: 'Kode admin salah.' });
      }
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email sudah terdaftar.' });

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: role === 'admin' ? 'admin' : 'user',
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }
    const ok = await bcrypt.compare(password || '', user.password);
    if (!ok) return res.status(401).json({ message: 'Email atau password salah.' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

// POST /api/auth/google  -> login/daftar dengan Google (selalu menjadi "user")
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Token Google tidak ditemukan.' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return res.status(400).json({ message: 'Email Google belum terverifikasi.' });
    }

    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        googleId: payload.sub,
        role: 'user',
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await user.save();
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Login Google gagal. Periksa GOOGLE_CLIENT_ID.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

// GET /api/auth/users  (admin) -> daftar akun
router.get('/users', auth, adminOnly, async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users.map((u) => ({ ...publicUser(u), createdAt: u.createdAt })));
});

// PATCH /api/auth/users/:id/role  (admin) -> jadikan admin / user
router.patch('/users/:id/role', auth, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ message: 'Role tidak valid.' });
  if (String(req.user._id) === req.params.id && role !== 'admin') {
    return res.status(400).json({ message: 'Anda tidak bisa menurunkan role akun sendiri.' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan.' });
  res.json(publicUser(user));
});

module.exports = router;
