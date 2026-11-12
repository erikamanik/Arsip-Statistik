import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme.js';

// variant: 'icon' (topbar) | 'row' (sidebar)
export default function ThemeToggle({ variant = 'icon' }) {
  const { resolved, setPref } = useTheme();
  const dark = resolved === 'dark';
  const toggle = () => setPref(dark ? 'light' : 'dark');
  const Icon = dark ? Sun : Moon;
  const label = dark ? 'Mode terang' : 'Mode gelap';

  if (variant === 'row') {
    return <button className="side-link" onClick={toggle}><Icon size={17} /> {label}</button>;
  }
  return <button className="icon-btn" onClick={toggle} aria-label={label} title={label}><Icon size={20} /></button>;
}
