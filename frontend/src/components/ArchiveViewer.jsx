import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileQuestion, Loader2 } from 'lucide-react';
import { API_URL, downloadName, fetchBlob, fileUrl, formatSize } from '../api.js';
import { canRead, viewKind } from '../fileTypes.js';
import Modal from './Modal.jsx';
import { useDownload } from './useDownload.js';

const MAX_TEXT = 400 * 1024; // batas teks yang ditampilkan
const MAX_ROWS = 500;

// Penampil Office (Word/Excel/PowerPoint) memakai layanan Microsoft, jadi hanya jalan jika file bisa diakses publik.
const isPublicHost = () => {
  try {
    const h = new URL(API_URL).hostname;
    return !(h === 'localhost' || h.endsWith('.local') || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h === '::1');
  } catch {
    return false;
  }
};

// Parser CSV kecil (mendukung tanda kutip)
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const delim = (text.split('\n', 1)[0].match(/;/g) || []).length > (text.split('\n', 1)[0].match(/,/g) || []).length ? ';' : ',';
  for (let i = 0; i < text.length && rows.length <= MAX_ROWS; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
}

// Render PDF ke kanvas (cadangan untuk browser tanpa penampil PDF bawaan, mis. banyak browser HP)
function PdfPages({ blob }) {
  const host = useRef(null);
  const [state, setState] = useState({ busy: true, error: false, pages: 0 });

  useEffect(() => {
    let dead = false;
    let doc;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
        const total = Math.min(doc.numPages, 200);
        if (dead) return;
        setState({ busy: false, error: false, pages: total });
        const box = host.current;
        const width = Math.max(280, (box?.clientWidth || 600) - 4);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let i = 1; i <= total && !dead; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = box?.querySelector(`[data-page="${i}"]`);
          if (!canvas) continue;
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = `${vp.width / dpr}px`;
          canvas.style.aspectRatio = `${vp.width} / ${vp.height}`;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        }
      } catch {
        if (!dead) setState({ busy: false, error: true, pages: 0 });
      }
    })();
    return () => { dead = true; doc?.destroy?.(); };
  }, [blob]);

  if (state.error) return <Fallback text="PDF ini tidak bisa ditampilkan di perangkat Anda." blob={blob} />;
  return (
    <div className="pdf-pages" ref={host}>
      {state.busy && <Busy text="Menyiapkan halaman…" />}
      {Array.from({ length: state.pages }, (_, i) => <canvas key={i} data-page={i + 1} className="pdf-page" aria-label={`Halaman ${i + 1}`} />)}
    </div>
  );
}

function Busy({ text = 'Memuat…' }) {
  return <div className="viewer-state" role="status"><Loader2 className="spin-ico" size={26} /><p>{text}</p></div>;
}

function Fallback({ text, a }) {
  const { download, busy } = useDownload({ quiet: true });
  return (
    <div className="viewer-state">
      <span className="empty-icon"><FileQuestion size={28} /></span>
      <p>{text}</p>
      {a && <button className="btn btn-primary" disabled={busy} onClick={() => download(a)}><Download size={18} /> Unduh file</button>}
    </div>
  );
}

function Body({ a }) {
  const kind = viewKind(a);
  const [data, setData] = useState(null); // blob | string | rows
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(null);
    setError(false);
    if (!['pdf', 'text', 'csv'].includes(kind)) return undefined;
    const ctrl = new AbortController();
    let url;
    fetchBlob(a, ctrl.signal)
      .then(async (blob) => {
        if (kind === 'pdf') {
          const pdf = new Blob([blob], { type: 'application/pdf' });
          url = URL.createObjectURL(pdf);
          setData({ blob: pdf, url });
        } else {
          const text = await blob.slice(0, MAX_TEXT).text();
          setData(kind === 'csv' ? { rows: parseCsv(text), cut: blob.size > MAX_TEXT } : { text, cut: blob.size > MAX_TEXT });
        }
      })
      .catch((e) => { if (e.name !== 'AbortError') setError(true); });
    return () => { ctrl.abort(); if (url) URL.revokeObjectURL(url); };
  }, [a._id, kind]);

  if (kind === 'image') return <div className="viewer-img"><img src={fileUrl(a)} alt={a.title} /></div>;

  if (kind === 'office') {
    if (!isPublicHost()) return <Fallback a={a} text="Dokumen Word, Excel, dan PowerPoint hanya bisa dibaca di aplikasi setelah backend dipasang di alamat publik. Untuk saat ini, unduh filenya." />;
    return (
      <div className="viewer-frame">
        <iframe title={a.title} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl(a))}`} />
        <p className="viewer-hint">Dokumen tidak tampil? Gunakan tombol Unduh di atas.</p>
      </div>
    );
  }

  if (!['pdf', 'text', 'csv'].includes(kind)) return <Fallback a={a} text="Jenis file ini belum bisa dibaca langsung di aplikasi. Silakan unduh." />;
  if (error) return <Fallback a={a} text="File tidak bisa dimuat. Periksa koneksi Anda atau coba unduh." />;
  if (!data) return <Busy />;

  if (kind === 'pdf') {
    return navigator.pdfViewerEnabled === false
      ? <PdfPages blob={data.blob} />
      : <div className="viewer-frame"><iframe title={a.title} src={data.url} /></div>;
  }
  if (kind === 'csv') {
    const [head, ...rest] = data.rows;
    return (
      <div className="viewer-table">
        <table>
          <thead><tr>{(head || []).map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{rest.slice(0, MAX_ROWS).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
        {(data.cut || rest.length > MAX_ROWS) && <p className="viewer-hint">Hanya sebagian data yang ditampilkan. Unduh file untuk melihat semuanya.</p>}
      </div>
    );
  }
  return (
    <div className="viewer-text">
      <pre>{data.text}</pre>
      {data.cut && <p className="viewer-hint">Hanya bagian awal yang ditampilkan. Unduh file untuk melihat semuanya.</p>}
    </div>
  );
}

// list: arsip yang bisa dibaca, dipakai untuk tombol sebelumnya/berikutnya
export default function ArchiveViewer({ a, list = [], onSelect, onClose }) {
  const { download, busy } = useDownload({ quiet: true });
  const readable = list.filter(canRead);
  const i = readable.findIndex((x) => x._id === a._id);
  const prev = i > 0 ? readable[i - 1] : null;
  const next = i >= 0 && i < readable.length - 1 ? readable[i + 1] : null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input,textarea,select')) return;
      if (e.key === 'ArrowLeft' && prev) onSelect(prev);
      if (e.key === 'ArrowRight' && next) onSelect(next);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [prev, next, onSelect]);

  const tools = (
    <>
      {readable.length > 1 && (
        <>
          <button className="icon-btn" disabled={!prev} onClick={() => prev && onSelect(prev)} aria-label="Arsip sebelumnya" title="Sebelumnya (←)"><ChevronLeft size={20} /></button>
          <button className="icon-btn" disabled={!next} onClick={() => next && onSelect(next)} aria-label="Arsip berikutnya" title="Berikutnya (→)"><ChevronRight size={20} /></button>
        </>
      )}
      <button className="btn btn-soft sm" disabled={busy} onClick={() => download(a)}><Download size={16} /> {busy ? 'Mengunduh…' : 'Unduh'}</button>
    </>
  );

  return (
    <Modal title={a.title} size="viewer" headExtra={tools} onClose={onClose}>
      <p className="viewer-meta">{downloadName(a)}{a.size ? ` · ${formatSize(a.size)}` : ''}</p>
      <Body a={a} />
    </Modal>
  );
}

// Hook: kembalikan open(a) dan node yang harus dirender
export function useArchiveViewer(list) {
  const [current, setCurrent] = useState(null);
  const close = useCallback(() => setCurrent(null), []);
  const node = current ? <ArchiveViewer a={current} list={list} onSelect={setCurrent} onClose={close} /> : null;
  return { open: setCurrent, node };
}
