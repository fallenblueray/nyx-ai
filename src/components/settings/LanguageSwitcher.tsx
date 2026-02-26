'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { updateUserPreference } from '@/app/actions/settings';
import { LANGUAGE_OPTIONS, DEFAULT_LANGUAGE } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLanguage?: Language;
  translations: any;
}

export function LanguageSwitcher({
  currentLanguage = DEFAULT_LANGUAGE,
  translations,
}: LanguageSwitcherProps) {
  const [language, setLanguage] = useState<Language>(currentLanguage);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLanguageChange = async (newLanguage: Language) => {
    setIsLoading(true);
    try {
      setLanguage(newLanguage);
      await updateUserPreference('preferred_language', newLanguage);
      // 延遲重新載入，讓 UI 有時間反應
      setTimeout(() => router.refresh(), 300);
    } catch (error) {
      console.error('語言切換失敗:', error);
      setLanguage(currentLanguage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="language-select">
        {translations.settings.language.label}
      </Label>
      <Select
        value={language}
        onValueChange={(value) =>
          handleLanguageChange(value as Language)
        }
        disabled={isLoading}
      >
        <SelectTrigger id="language-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
