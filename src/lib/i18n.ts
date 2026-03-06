import zhTW from '@/locales/zh-TW.json';
import zhCN from '@/locales/zh-CN.json';

export type Language = 'zh-TW' | 'zh-CN';
type Translations = typeof zhTW;

const translations: Record<Language, Translations> = {
  'zh-TW': zhTW,
  'zh-CN': zhCN,
};

export function getTranslation(lang: Language): Translations {
  return translations[lang] || zhTW;
}

export function getNestedTranslation(obj: unknown, path: string): string {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj) as string || path;
}

export const DEFAULT_LANGUAGE: Language = 'zh-TW';
export const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
];
