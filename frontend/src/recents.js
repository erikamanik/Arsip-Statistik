import { useEffect, useState } from 'react';

const KEY = 'recents';
const MAX = 5;
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };

// item: { to, title, sub }
export function addRecent(item) {
  const next = [item, ...read().filter((r) => r.to !== item.to)].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* abaikan */ }
  window.dispatchEvent(new Event('recents-change'));
}

export function useRecents() {
  const [list, setList] = useState(read);
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener('recents-change', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('recents-change', sync); window.removeEventListener('storage', sync); };
  }, []);
  return list;
}
