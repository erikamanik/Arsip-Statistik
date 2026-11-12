const express = require('express');
const fs = require('fs');
const path = require('path');
const { del } = require('@vercel/blob');

const Year = require('../models/Year');
const Category = require('../models/Category');
const Group = require('../models/Group');
const Archive = require('../models/Archive');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth); // semua endpoint di bawah wajib login

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads'); // hanya untuk arsip lama

const DEFAULT_CATEGORIES = [
  'Statistik Harga',
  'Statistik Distribusi',
  'Statistik Keuangan Dan Teknologi Informasi',
];

/* ----------------------------- file di Vercel Blob ----------------------------- */
// Browser mengunggah file langsung ke Vercel Blob; backend hanya menyimpan alamatnya.
const isBlobUrl = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
};

// Hapus file lama (Blob, atau folder uploads untuk arsip sebelum migrasi)
const removeFile = async (archive) => {
  if (!archive) return;
  if (archive.fileUrl) {
    try {
      await del(archive.fileUrl);
    } catch (err) {
      console.error('Gagal menghapus file di Blob:', err.message);
    }
  } else if (archive.filePath) {
    fs.unlink(path.join(UPLOAD_DIR, archive.filePath), () => {});
  }
};
const discardBlob = (url) => (isBlobUrl(url) ? removeFile({ fileUrl: url }) : undefined);

const validName = (v) => typeof v === 'string' && v.trim().length > 0;
const isHttpUrl = (v) => /^https?:\/\/\S+$/i.test(v || '');

/* ------------------------------ helper hapus ----------------------------- */
async function deleteArchivesOfGroups(groupIds) {
  const archives = await Archive.find({ group: { $in: groupIds } });
  await Promise.all(archives.map((a) => removeFile(a)));
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

// Simpan arsip: type = link | file | image (file sudah diunggah browser ke Vercel Blob)
router.post('/groups/:groupId/archives', async (req, res) => {
  const { title, type, url, fileUrl, originalName, mimeType, size } = req.body;
  try {
    if (!validName(title)) {
      await discardBlob(fileUrl);
      return res.status(400).json({ message: 'Judul arsip wajib diisi.' });
    }
    if (!['link', 'file', 'image'].includes(type)) {
      await discardBlob(fileUrl);
      return res.status(400).json({ message: 'Jenis arsip tidak valid.' });
    }
    if (!(await Group.exists({ _id: req.params.groupId }))) {
      await discardBlob(fileUrl);
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
      if (!isBlobUrl(fileUrl)) return res.status(400).json({ message: 'Pilih file yang akan diunggah.' });
      if (type === 'image' && !String(mimeType || '').startsWith('image/')) {
        await discardBlob(fileUrl);
        return res.status(400).json({ message: 'File harus berupa gambar.' });
      }
      data.fileUrl = fileUrl;
      data.originalName = String(originalName || '').slice(0, 255);
      data.mimeType = String(mimeType || '');
      data.size = Number(size) || 0;
    }

    const archive = await Archive.create(data);
    res.status(201).json(archive);
  } catch (err) {
    console.error(err);
    await discardBlob(fileUrl);
    res.status(500).json({ message: 'Gagal menyimpan arsip.' });
  }
});

// Edit arsip (admin): judul, tautan, atau ganti file
router.put('/archives/:id', adminOnly, async (req, res) => {
  const { title, url, fileUrl, originalName, mimeType, size } = req.body;
  try {
    const archive = await Archive.findById(req.params.id);
    if (!archive) {
      await discardBlob(fileUrl);
      return res.status(404).json({ message: 'Arsip tidak ditemukan.' });
    }

    if (title !== undefined) {
      if (!validName(title)) {
        await discardBlob(fileUrl);
        return res.status(400).json({ message: 'Judul arsip wajib diisi.' });
      }
      archive.title = title;
    }

    if (archive.type === 'link' && url !== undefined) {
      if (!isHttpUrl(url)) return res.status(400).json({ message: 'Tautan tidak valid.' });
      archive.url = url;
    }

    let oldFile = null;
    if (archive.type !== 'link' && fileUrl) {
      if (!isBlobUrl(fileUrl)) return res.status(400).json({ message: 'File tidak valid.' });
      if (archive.type === 'image' && !String(mimeType || '').startsWith('image/')) {
        await discardBlob(fileUrl);
        return res.status(400).json({ message: 'File harus berupa gambar.' });
      }
      oldFile = { fileUrl: archive.fileUrl, filePath: archive.filePath };
      archive.fileUrl = fileUrl;
      archive.filePath = undefined;
      archive.originalName = String(originalName || '').slice(0, 255);
      archive.mimeType = String(mimeType || '');
      archive.size = Number(size) || 0;
    }

    await archive.save();
    await removeFile(oldFile); // hapus file lama setelah berhasil disimpan
    res.json(archive);
  } catch (err) {
    console.error(err);
    await discardBlob(fileUrl);
    res.status(500).json({ message: 'Gagal memperbarui arsip.' });
  }
});

router.delete('/archives/:id', adminOnly, async (req, res) => {
  const archive = await Archive.findById(req.params.id);
  if (!archive) return res.status(404).json({ message: 'Arsip tidak ditemukan.' });
  await removeFile(archive);
  await archive.deleteOne();
  res.json({ message: 'Arsip berhasil dihapus.' });
});

module.exports = router;