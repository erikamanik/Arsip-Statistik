import { File as FileIcon, FileArchive, FileSpreadsheet, FileText, Image as ImageIcon, Link2, Presentation } from 'lucide-react';

export const TYPES = [
  { key: 'link', label: 'Tautan', icon: Link2 },
  { key: 'file', label: 'File', icon: FileIcon },
  { key: 'image', label: 'Gambar', icon: ImageIcon },
];

const EXT = {
  pdf: { Icon: FileText, cls: 'ft-pdf' },
  doc: { Icon: FileText, cls: 'ft-doc' }, docx: { Icon: FileText, cls: 'ft-doc' }, txt: { Icon: FileText, cls: 'ft-doc' },
  xls: { Icon: FileSpreadsheet, cls: 'ft-xls' }, xlsx: { Icon: FileSpreadsheet, cls: 'ft-xls' }, csv: { Icon: FileSpreadsheet, cls: 'ft-xls' },
  ppt: { Icon: Presentation, cls: 'ft-ppt' }, pptx: { Icon: Presentation, cls: 'ft-ppt' },
  zip: { Icon: FileArchive, cls: 'ft-zip' }, rar: { Icon: FileArchive, cls: 'ft-zip' }, '7z': { Icon: FileArchive, cls: 'ft-zip' },
};

// Ikon, kelas warna, dan label ringkas untuk satu arsip
export function archiveVisual(a) {
  if (a.type === 'link') return { Icon: Link2, cls: 'link', label: 'Tautan' };
  if (a.type === 'image') return { Icon: ImageIcon, cls: 'image', label: 'Gambar' };
  const ext = (a.originalName || '').split('.').pop().toLowerCase();
  const hit = EXT[ext];
  return { Icon: hit?.Icon || FileText, cls: hit?.cls || 'ft-other', label: hit ? ext.toUpperCase() : 'File' };
}
