import { File as FileIcon, FileArchive, FileSpreadsheet, FileText, Image as ImageIcon, Link2, Presentation } from 'lucide-react';

export const TYPES = [
  { key: 'link', label: 'Tautan', icon: Link2 },
  { key: 'file', label: 'File', icon: FileIcon },
  { key: 'image', label: 'Gambar', icon: ImageIcon },
];

const EXT = {
  pdf: { Icon: FileText, cls: 'ft-pdf', view: 'pdf' },
  doc: { Icon: FileText, cls: 'ft-doc', view: 'office' }, docx: { Icon: FileText, cls: 'ft-doc', view: 'office' },
  txt: { Icon: FileText, cls: 'ft-txt', view: 'text' }, md: { Icon: FileText, cls: 'ft-txt', view: 'text' }, log: { Icon: FileText, cls: 'ft-txt', view: 'text' }, json: { Icon: FileText, cls: 'ft-txt', view: 'text' },
  xls: { Icon: FileSpreadsheet, cls: 'ft-xls', view: 'office' }, xlsx: { Icon: FileSpreadsheet, cls: 'ft-xls', view: 'office' },
  csv: { Icon: FileSpreadsheet, cls: 'ft-xls', view: 'csv' },
  ppt: { Icon: Presentation, cls: 'ft-ppt', view: 'office' }, pptx: { Icon: Presentation, cls: 'ft-ppt', view: 'office' },
  zip: { Icon: FileArchive, cls: 'ft-zip' }, rar: { Icon: FileArchive, cls: 'ft-zip' }, '7z': { Icon: FileArchive, cls: 'ft-zip' },
  png: { Icon: ImageIcon, cls: 'image', view: 'image' }, jpg: { Icon: ImageIcon, cls: 'image', view: 'image' }, jpeg: { Icon: ImageIcon, cls: 'image', view: 'image' },
  gif: { Icon: ImageIcon, cls: 'image', view: 'image' }, webp: { Icon: ImageIcon, cls: 'image', view: 'image' },
};

const extOf = (a) => ((a.originalName || a.filePath || '').split('.').pop() || '').toLowerCase();

// Ikon, kelas warna, dan label ringkas untuk satu arsip
export function archiveVisual(a) {
  if (a.type === 'link') return { Icon: Link2, cls: 'link', label: 'Tautan' };
  if (a.type === 'image') return { Icon: ImageIcon, cls: 'image', label: 'Gambar' };
  const ext = extOf(a);
  const hit = EXT[ext];
  return { Icon: hit?.Icon || FileText, cls: hit?.cls || 'ft-other', label: hit ? ext.toUpperCase() : 'File' };
}

// Cara arsip dibaca di dalam aplikasi: link | image | pdf | text | csv | office | none
export function viewKind(a) {
  if (a.type === 'link') return 'link';
  if (a.type === 'image') return 'image';
  return EXT[extOf(a)]?.view || 'none';
}

// Bisa dibaca di dalam aplikasi (tanpa mengunduh)?
export const canRead = (a) => !['link', 'none'].includes(viewKind(a));
