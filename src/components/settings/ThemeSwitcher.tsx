'use client';

import { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Moon, Sun } from 'lucide-react';

interface ThemeSwitcherProps {
  translations: any;
}

type Theme = 'light' | 'dark';

export function ThemeSwitcher({ translations }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // 初始化主題
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as Theme | null;
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light';
    const initial = saved || systemPreference;
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    // 主題改變是純客戶端操作，無需刷新頁面
    // localStorage 已在 applyTheme 中保存
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <Label>{translations.settings.appearance.label}</Label>
      <RadioGroup value={theme} onValueChange={(v) => handleThemeChange(v as Theme)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="light" id="light" />
          <Label htmlFor="light" className="flex items-center space-x-2 cursor-pointer">
            <Sun className="h-4 w-4" />
            <span>{translations.settings.appearance.light}</span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dark" id="dark" />
          <Label htmlFor="dark" className="flex items-center space-x-2 cursor-pointer">
            <Moon className="h-4 w-4" />
            <span>{translations.settings.appearance.dark}</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
