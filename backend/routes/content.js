const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const Year = require('../models/Year');
const Category = require('../models/Category');
const Group = require('../models/Group');
const Archive = require('../models/Archive');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth); // semua endpoint di bawah wajib login

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DEFAULT_CATEGORIES = [
  'Statistik Harga',
  'Statistik Distribusi',
  'Statistik Keuangan Dan Teknologi Informasi',
];

/* ---------------------------- upload (multer) ---------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // maks 25 MB

const removeFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(path.join(UPLOAD_DIR, filePath), () => {});
};

const validName = (v) => typeof v === 'string' && v.trim().length > 0;
const isHttpUrl = (v) => /^https?:\/\/\S+$/i.test(v || '');

/* ------------------------------ helper hapus ----------------------------- */
async function deleteArchivesOfGroups(groupIds) {
  const archives = await Archive.find({ group: { $in: groupIds } });
  archives.forEach((a) => removeFile(a.filePath));
  await Archive.deleteMany({ group: { $in: groupIds } });
}
async function deleteGroupsOfCategories(categoryIds) {
  const groups = await Group.find({ category: { $in: categoryIds } }).select('_id');
  const ids = groups.map((g) => g._id);
  await deleteArchivesOfGroups(ids);
  await Group.deleteMany({ category: { $in: categoryIds } });
}

/* --------------------------------- TAHUN --------------------------------- */
router.get('/years', async (req, res) => {
  const years = await Year.find().sort({ year: -1 }).lean();
  const withCount = await Promise.all(
    years.map(async (y) => {
      const cats = await Category.find({ year: y._id }).select('_id');
      const groups = await Group.find({ category: { $in: cats.map((c) => c._id) } }).select('_id');
      const archives = await Archive.countDocuments({ group: { $in: groups.map((g) => g._id) } });
      return { ...y, archiveCount: archives };
    })
  );
  res.json(withCount);
});

router.get('/years/:id', async (req, res) => {
  const year = await Year.findById(req.params.id);
  if (!year) return res.status(404).json({ message: 'Tahun tidak ditemukan.' });
  res.json(year);
});

router.post('/years', async (req, res) => {
  const yr = Number(req.body.year);
  if (!Number.isInteger(yr) || yr < 1990 || yr > 2100) {
    return res.status(400).json({ message: 'Masukkan tahun yang valid (contoh: 2026).' });
  }
  if (await Year.findOne({ year: yr })) {
    return res.status(409).json({ message: `Tahun ${yr} sudah ada.` });
  }
  const year = await Year.create({ year: yr, createdBy: req.user.email });
  await Category.insertMany(DEFAULT_CATEGORIES.map((name) => ({ year: year._id, name })));
  res.status(201).json(year);
});

router.put('/years/:id', adminOnly, async (req, res) => {
  const yr = Number(req.body.year);
  if (!Number.isInteger(yr) || yr < 1990 || yr > 2100) {
    return res.status(400).json({ message: 'Masukkan tahun yang valid.' });
  }
  const dup = await Year.findOne({ year: yr, _id: { $ne: req.params.id } });
  if (dup) return res.status(409).json({ message: `Tahun ${yr} sudah ada.` });
  const year = await Year.findByIdAndUpdate(req.params.id, { year: yr }, { new: true });
  if (!year) return res.status(404).json({ message: 'Tahun tidak ditemukan.' });
  res.json(year);
});

router.delete('/years/:id', adminOnly, async (req, res) => {
  const year = await Year.findById(req.params.id);
  if (!year) return res.status(404).json({ message: 'Tahun tidak ditemukan.' });
  const cats = await Category.find({ year: year._id }).select('_id');
  const catIds = cats.map((c) => c._id);
  await deleteGroupsOfCategories(catIds);
  await Category.deleteMany({ year: year._id });
  await year.deleteOne();
  res.json({ message: 'Tahun beserta isinya berhasil dihapus.' });
});

/* ------------------------------- KATEGORI -------------------------------- */
router.get('/years/:yearId/categories', async (req, res) => {
  const cats = await Category.find({ year: req.params.yearId }).sort({ createdAt: 1 }).lean();
  const withCount = await Promise.all(
    cats.map(async (c) => {
      const groups = await Group.find({ category: c._id }).select('_id');
      const archives = await Archive.countDocuments({ group: { $in: groups.map((g) => g._id) } });
      return { ...c, groupCount: groups.length, archiveCount: archives };
    })
  );
  res.json(withCount);
});

router.get('/categories/:id', async (req, res) => {
  const cat = await Category.findById(req.params.id).populate('year');
  if (!cat) return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
  res.json(cat);
});

router.post('/years/:yearId/categories', async (req, res) => {
  if (!validName(req.body.name)) return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
  if (!(await Year.exists({ _id: req.params.yearId }))) {
    return res.status(404).json({ message: 'Tahun tidak ditemukan.' });
  }
  const cat = await Category.create({ year: req.params.yearId, name: req.body.name });
  res.status(201).json(cat);
});

router.put('/categories/:id', adminOnly, async (req, res) => {
  if (!validName(req.body.name)) return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
  const cat = await Category.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
  if (!cat) return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
  res.json(cat);
});

router.delete('/categories/:id', adminOnly, async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
  await deleteGroupsOfCategories([cat._id]);
  await cat.deleteOne();
  res.json({ message: 'Kategori berhasil dihapus.' });
});

/* --------------------------- GRUP (card arsip) --------------------------- */
router.get('/categories/:categoryId/groups', async (req, res) => {
  const groups = await Group.find({ category: req.params.categoryId }).sort({ createdAt: -1 }).lean();
  const withCount = await Promise.all(
    groups.map(async (g) => ({ ...g, archiveCount: await Archive.countDocuments({ group: g._id }) }))
  );
  res.json(withCount);
});

router.get('/groups/:id', async (req, res) => {
  const group = await Group.findById(req.params.id).populate({
    path: 'category',
    populate: { path: 'year' },
  });
  if (!group) return res.status(404).json({ message: 'Kelompok tidak ditemukan.' });
  res.json(group);
});

router.post('/categories/:categoryId/groups', async (req, res) => {
  if (!validName(req.body.name)) return res.status(400).json({ message: 'Nama kelompok wajib diisi.' });
  if (!(await Category.exists({ _id: req.params.categoryId }))) {
    return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
  }
  const group = await Group.create({
    category: req.params.categoryId,
    name: req.body.name,
    createdBy: req.user.email,
  });
  res.status(201).json(group);
});

router.put('/groups/:id', adminOnly, async (req, res) => {
  if (!validName(req.body.name)) return res.status(400).json({ message: 'Nama kelompok wajib diisi.' });
  const group = await Group.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
  if (!group) return res.status(404).json({ message: 'Kelompok tidak ditemukan.' });
  res.json(group);
});

router.delete('/groups/:id', adminOnly, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Kelompok tidak ditemukan.' });
  await deleteArchivesOfGroups([group._id]);
  await group.deleteOne();
  res.json({ message: 'Kelompok berhasil dihapus.' });
});

/* --------------------------------- ARSIP --------------------------------- */
router.get('/groups/:groupId/archives', async (req, res) => {
  const archives = await Archive.find({ group: req.params.groupId }).sort({ createdAt: -1 });
  res.json(archives);
});

// Upload: type = link | file | image
router.post('/groups/:groupId/archives', upload.single('file'), async (req, res) => {
  try {
    const { title, type, url } = req.body;

    if (!validName(title)) {
      removeFile(req.file?.filename);
      return res.status(400).json({ message: 'Judul arsip wajib diisi.' });
    }
    if (!['link', 'file', 'image'].includes(type)) {
      removeFile(req.file?.filename);
      return res.status(400).json({ message: 'Jenis arsip tidak valid.' });
    }
    if (!(await Group.exists({ _id: req.params.groupId }))) {
      removeFile(req.file?.filename);
      return res.status(404).json({ message: 'Kelompok tidak ditemukan.' });
    }

    const data = {
      group: req.params.groupId,
      title,
      type,
      uploadedBy: { id: req.user._id, name: req.user.name, email: req.user.email },
    };

    if (type === 'link') {
      if (!isHttpUrl(url)) return res.status(400).json({ message: 'Masukkan tautan yang valid (diawali http:// atau https://).' });
      data.url = url;
    } else {
      if (!req.file) return res.status(400).json({ message: 'Pilih file yang akan diunggah.' });
      if (type === 'image' && !req.file.mimetype.startsWith('image/')) {
        removeFile(req.file.filename);
        return res.status(400).json({ message: 'File harus berupa gambar.' });
      }
      data.filePath = req.file.filename;
      data.originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      data.mimeType = req.file.mimetype;
      data.size = req.file.size;
    }

    const archive = await Archive.create(data);
    res.status(201).json(archive);
  } catch (err) {
    console.error(err);
    removeFile(req.file?.filename);
    res.status(500).json({ message: 'Gagal menyimpan arsip.' });
  }
});

// Edit arsip (admin): judul, tautan, atau ganti file
router.put('/archives/:id', adminOnly, upload.single('file'), async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id);
    if (!archive) {
      removeFile(req.file?.filename);
      return res.status(404).json({ message: 'Arsip tidak ditemukan.' });
    }

    if (req.body.title !== undefined) {
      if (!validName(req.body.title)) {
        removeFile(req.file?.filename);
        return res.status(400).json({ message: 'Judul arsip wajib diisi.' });
      }
      archive.title = req.body.title;
    }

    if (archive.type === 'link' && req.body.url !== undefined) {
      if (!isHttpUrl(req.body.url)) return res.status(400).json({ message: 'Tautan tidak valid.' });
      archive.url = req.body.url;
    }

    if (archive.type !== 'link' && req.file) {
      if (archive.type === 'image' && !req.file.mimetype.startsWith('image/')) {
        removeFile(req.file.filename);
        return res.status(400).json({ message: 'File harus berupa gambar.' });
      }
      removeFile(archive.filePath);
      archive.filePath = req.file.filename;
      archive.originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      archive.mimeType = req.file.mimetype;
      archive.size = req.file.size;
    }

    await archive.save();
    res.json(archive);
  } catch (err) {
    console.error(err);
    removeFile(req.file?.filename);
    res.status(500).json({ message: 'Gagal memperbarui arsip.' });
  }
});

router.delete('/archives/:id', adminOnly, async (req, res) => {
  const archive = await Archive.findById(req.params.id);
  if (!archive) return res.status(404).json({ message: 'Arsip tidak ditemukan.' });
  removeFile(archive.filePath);
  await archive.deleteOne();
  res.json({ message: 'Arsip berhasil dihapus.' });
});

module.exports = router;
