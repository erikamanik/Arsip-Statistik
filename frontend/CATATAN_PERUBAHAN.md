# Catatan Perubahan UI

Setelah mengekstrak: `npm install` lalu `npm run dev` (dependensi baru: `@fontsource-variable/figtree` dan `@fontsource-variable/bricolage-grotesque`).

## Fitur & halaman baru
- **Pencarian global** `/cari` (Ctrl/Cmd + K), filter jenis, sorot kata kunci, lokasi arsip.
- **Dashboard**: ringkasan angka, "Unggahan terbaru", "Terakhir dibuka".
- **Daftar arsip**: filter jenis, urutan, pencarian judul/file/pengunggah, ikon & warna per jenis file (PDF, Word, Excel, PowerPoint, ZIP).
- **Notifikasi dalam aplikasi** (lonceng): unggahan baru dari anggota lain, badge belum dibaca.
- **Mode gelap** (Sistem/Terang/Gelap) di Profil, tombol cepat di sidebar/topbar, tanpa kedip saat load.
- **Indikator offline** + toast saat koneksi kembali. `sw.js` sudah punya handler `push` dan `notificationclick`.
- **Font self-host** (tercache oleh service worker, jalan saat offline).

## Notifikasi & dialog
- Toast: animasi keluar, jeda saat hover/fokus, bilah waktu, tombol aksi. Pemakaian: `toast(pesan, tipe, { action, duration, onClose })`.
- Hapus arsip tanpa dialog, diganti toast **Urungkan** (6 detik). Hapus tahun/kategori/kelompok tetap memakai konfirmasi karena berdampak berantai.
- Konfirmasi sebelum simpan/upload dihapus. Galat validasi dan server tampil **inline** di form.
- Dialog `danger` kini fokus awal di "Batal".
- Upload: **progress bar**, tombol batalkan, validasi 25 MB dan format tautan di sisi klien.
- Login: galat tampil sekali (inline). Opsi Admin disembunyikan di balik "Punya kode admin?".

## Navigasi
- Sidebar: indikator aktif yang bergeser halus, "Terakhir dibuka", badge Admin, pintasan pencarian.
- Bottom nav mobile: 3–4 item (Dashboard, Cari, Pengguna, Profil) dengan indikator bergeser.
- Mobile: tombol **Kembali** menggantikan breadcrumb panjang. Layout kini layout route sehingga sidebar tidak remount.
- `aria-current` akurat; scroll kembali ke atas tiap pindah halaman.

## Animasi & loading
- Skeleton (kartu, daftar) menggantikan spinner; transisi halaman; stagger ringan; modal punya animasi keluar.
- `prefers-reduced-motion`: animasi dimatikan tetapi spinner tetap berdenyut.

## Warna & aksesibilitas
- Semua warna hardcode dipindah ke variabel CSS. Hijau toast digelapkan (kontras ~5,3:1). Bug `tone` kartu diperbaiki.
- Kartu folder tidak lagi punya tombol di dalam tombol; bisa dibuka di tab baru. Tombol edit/hapus admin selalu terlihat.
- Modal: focus trap, fokus dikembalikan saat tutup, tidak menutup saat seret pilihan teks keluar dari input, `aria-labelledby`.

## Catatan penting
- Pencarian, "Unggahan terbaru", dan notifikasi memakai **indeks sisi-klien** (`src/searchIndex.js`) yang menelusuri tahun → kategori → kelompok → arsip lalu menyimpan hasilnya 2 menit. Untuk data besar, sebaiknya backend menyediakan endpoint pencarian/terbaru, lalu cukup ganti isi fungsi `build()`.
- Hapus arsip dengan Urungkan baru benar-benar menghapus di server setelah toast selesai; jika tab ditutup sebelum itu, arsip tetap ada (aman).
- Web Push butuh server yang mengirim push; sisi klien (`sw.js`) sudah siap.

## Revisi 12 Nov 2026
Setelah mengekstrak: `npm install` (dependensi baru: `pdfjs-dist`) lalu `npm run dev`.

**Baca & Unduh arsip**
- Tombol **Baca/Lihat** kini membuka penampil di dalam aplikasi (tidak lagi mengunduh): gambar, PDF, TXT, CSV (tabel). Panah ← → pindah antar arsip.
- PDF memakai penampil bawaan browser; di browser tanpa penampil PDF (banyak HP) otomatis dirender dengan pdf.js.
- Word/Excel/PowerPoint dibaca lewat penampil Office online; hanya jalan jika backend di alamat publik (di localhost tampil pesan + tombol unduh).
- Tombol **Unduh** baru di tiap arsip dan di dalam penampil; file disimpan dengan nama aslinya (`originalName`).
- Tautan memakai tombol "Buka tautan". File ZIP/RAR dst. hanya punya tombol Unduh.

**Desain**
- Login HP diperbaiki (brand tidak lagi menimpa judul); batang grafik login tidak lagi menimpa teks.
- Konten rata tengah di layar lebar; daftar arsip jadi baris ringkas (nama pengunggah, tanggal, aksi sejajar).
- Tombol aksi utama jadi tombol melayang di HP; filter di HP lebih ringkas (chip bisa digeser).
- Kartu tahun: angka besar, lencana "Berjalan", "terakhir diunggah", panah menggantikan teks "Buka".
- Palet jenis file baru yang tidak bentrok dengan warna status (PDF magenta, Word biru, Excel hijau, PPT amber, gambar ungu, tautan cyan).
- Mode gelap: tombol utama lebih terang, sidebar lebih gelap dari halaman.
- Sidebar bawah dirapikan (Pasang aplikasi jadi baris biasa), profil jadi dua kolom, empty state beralur batang grafik.
- Teks kecil dinaikkan (min. 12px), paginasi "Tampilkan lagi" (30 per halaman), typo manifest PWA diperbaiki, toast "Koneksi tersambung" tidak muncul saat load.
