'use client';

import { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Moon, Sun } from 'lucide-react';

interface ThemeSwitcherProps {
  translations: Record<string, unknown>;
}

type Theme = 'light' | 'dark';

function applyTheme(newTheme: Theme) {
  const html = document.documentElement;
  if (newTheme === 'dark') {
    html.classList.add('dark');
    html.style.colorScheme = 'dark';
  } else {
    html.classList.remove('dark');
    html.style.colorScheme = 'light';
  }
  localStorage.setItem('theme', newTheme);
}

export function ThemeSwitcher({ translations }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light';
    const initial = saved || systemPreference;
    queueMicrotask(() => {
      setTheme(initial);
      applyTheme(initial);
      setMounted(true);
    });
  }, []);

  const handleThemeChange = (value: string) => {
    const newTheme = value as Theme;
    applyTheme(newTheme);
    setTheme(newTheme);
  };

  if (!mounted) return null;

  const t = translations as { settings?: { appearance?: { label?: string; light?: string; dark?: string } } };

  return (
    <div className="space-y-4">
      <Label>{t.settings?.appearance?.label ?? '外觀'}</Label>
      <RadioGroup value={theme} onValueChange={handleThemeChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="light" id="light" />
          <Label htmlFor="light" className="flex items-center space-x-2 cursor-pointer">
            <Sun className="h-4 w-4" />
            <span>{t.settings?.appearance?.light ?? '淺色'}</span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dark" id="dark" />
          <Label htmlFor="dark" className="flex items-center space-x-2 cursor-pointer">
            <Moon className="h-4 w-4" />
            <span>{t.settings?.appearance?.dark ?? '深色'}</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
