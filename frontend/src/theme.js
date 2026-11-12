import { useEffect, useState } from 'react';

const KEY = 'theme'; // 'system' | 'light' | 'dark'
const mq = () => window.matchMedia('(prefers-color-scheme: dark)');

export const getPref = () => {
  try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; }
};
export const resolveTheme = (pref) => (pref === 'system' ? (mq().matches ? 'dark' : 'light') : pref);

export function applyTheme(pref = getPref()) {
  const t = resolveTheme(pref);
  document.documentElement.dataset.theme = t;
  document.documentElement.style.colorScheme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#071a2f' : '#0b2a4a');
}

export function setThemePref(pref) {
  try { localStorage.setItem(KEY, pref); } catch { /* abaikan */ }
  applyTheme(pref);
  window.dispatchEvent(new Event('theme-change'));
}

export function useTheme() {
  const read = () => ({ pref: getPref(), resolved: resolveTheme(getPref()) });
  const [state, setState] = useState(read);
  useEffect(() => {
    const sync = () => setState(read());
    const media = mq();
    const onSystem = () => { if (getPref() === 'system') { applyTheme(); sync(); } };
    window.addEventListener('theme-change', sync);
    media.addEventListener('change', onSystem);
    return () => { window.removeEventListener('theme-change', sync); media.removeEventListener('change', onSystem); };
  }, []);
  return { ...state, setPref: setThemePref };
}
