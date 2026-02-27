'use client';

import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Check localStorage first, then DOM
    const saved = localStorage.getItem('theme');
    if (saved) {
      const isDark = saved === 'dark';
      setDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      setDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 hover:border-brand-300 dark:hover:border-brand-500/40 transition-all duration-200 cursor-pointer active:scale-90"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
