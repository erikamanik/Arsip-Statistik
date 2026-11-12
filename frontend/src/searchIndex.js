import { useEffect, useState } from 'react';
import api from './api.js';

// Indeks arsip sisi-klien: menelusuri tahun -> kategori -> kelompok -> arsip lalu menyimpannya sementara.
// Catatan: kalau backend nanti punya endpoint pencarian/terbaru, cukup ganti isi build() ini.
const TTL = 2 * 60 * 1000;
let cache = null; // { at, items }
let inflight = null;

async function mapLimit(list, n, fn) {
  const out = new Array(list.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, list.length) }, async () => {
      while (i < list.length) {
        const k = i++;
        out[k] = await fn(list[k]);
      }
    })
  );
  return out;
}

async function build() {
  const years = (await api.get('/years')).data.filter((y) => y.archiveCount !== 0);
  const cats = (await mapLimit(years, 6, (y) => api.get(`/years/${y._id}/categories`).then((r) => r.data.map((c) => ({ ...c, year: y }))))).flat().filter((c) => c.archiveCount !== 0);
  const groups = (await mapLimit(cats, 6, (c) => api.get(`/categories/${c._id}/groups`).then((r) => r.data.map((g) => ({ ...g, category: c}))))).flat().filter((g) => g.archiveCount !== 0);
  const items = (await mapLimit(groups, 6, (g) => api.get(`/groups/${g._id}/archives`).then((r) => r.data.map((a) => ({ ...a, group: g }))))).flat();
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

const fresh = () => (cache && Date.now() - cache.at < TTL ? cache.items : null);

export function getIndex() {
  const hit = fresh();
  if (hit) return Promise.resolve(hit);
  if (!inflight) {
    inflight = build()
      .then((items) => { cache = { at: Date.now(), items }; return items; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

// Panggil setelah upload/edit/hapus arsip atau perubahan struktur
export function invalidateIndex() {
  cache = null;
  window.dispatchEvent(new Event('index-invalidated'));
}

export function useIndex({ delay = 0 } = {}) {
  const [state, setState] = useState(() => ({ items: fresh(), loading: !fresh(), error: null }));

  useEffect(() => {
    let alive = true;
    let timer;
    const run = () =>
      getIndex()
        .then((items) => alive && setState({ items, loading: false, error: null }))
        .catch((error) => alive && setState((s) => ({ ...s, loading: false, error })));
    const later = (ms) => { clearTimeout(timer); timer = setTimeout(run, ms); };
    later(delay);
    const onFocus = () => later(0);
    const onInvalid = () => later(2500);
    window.addEventListener('focus', onFocus);
    window.addEventListener('index-invalidated', onInvalid);
    return () => {
      alive = false;
      clearTimeout(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('index-invalidated', onInvalid);
    };
  }, [delay]);

  return state;
}
