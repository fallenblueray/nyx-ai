import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/settings/ThemeSwitcher';
import { WordCountDisplay } from '@/components/settings/WordCountDisplay';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

export const metadata = {
  title: '設定 | NyxAI',
  description: '管理語言、外觀、字數和充值',
};

export default async function SettingsPage() {
  // 驗證用戶登入（使用 NextAuth）
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // 獲取用戶偏好設定（使用 admin client）
  const supabase = createAdminClient();
  const { data: profileData, error: dataError } = await supabase
    .from('profiles')
    .select('preferred_language, word_count')
    .eq('user_id', session.user.id)
    .single();

  if (dataError || !profileData) {
    redirect('/app');
  }

  const language = (profileData.preferred_language || 'zh-TW') as Language;
  const translations = getTranslation(language);
  const wordCount = profileData.word_count || 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {translations.settings.title}
            </h1>
            <Link href="/app">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {translations.settings.back}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="language" className="w-full">
          {/* Tabs 標籤 */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="language">
              {translations.settings.tabs.language}
            </TabsTrigger>
            <TabsTrigger value="appearance">
              {translations.settings.tabs.appearance}
            </TabsTrigger>
            <TabsTrigger value="wordcount">
              {translations.settings.tabs.wordCount}
            </TabsTrigger>
          </TabsList>

          {/* 語言 Tab */}
          <TabsContent value="language" className="space-y-4">
            <LanguageSwitcher
              currentLanguage={language}
              translations={translations}
            />
          </TabsContent>

          {/* 外觀 Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <ThemeSwitcher translations={translations} />
          </TabsContent>

          {/* 字數與充值 Tab */}
          <TabsContent value="wordcount" className="space-y-4">
            <WordCountDisplay wordCount={wordCount} translations={translations} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
