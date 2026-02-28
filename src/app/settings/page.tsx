import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/settings/ThemeSwitcher';
import { WordCountDisplay } from '@/components/settings/WordCountDisplay';
import { MemorySettings } from '@/components/settings/MemorySettings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { getUserPreferences } from '@/app/actions/preferences';

export const metadata = {
  title: '設定 | NyxAI',
  description: '管理語言、外觀、字數、充值和 AI 記憶',
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const supabase = createAdminClient();
  const { data: profileData, error: dataError } = await supabase
    .from('profiles')
    .select('preferred_language, word_count')
    .eq('id', session.user.id)
    .single();

  if (dataError || !profileData) {
    redirect('/app');
  }

  const language = (profileData.preferred_language || 'zh-TW') as Language;
  const translations = getTranslation(language);
  const wordCount = profileData.word_count || 0;

  // 獲取記憶層偏好
  const { preferences } = await getUserPreferences();

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="language">
              {translations.settings.tabs.language}
            </TabsTrigger>
            <TabsTrigger value="appearance">
              {translations.settings.tabs.appearance}
            </TabsTrigger>
            <TabsTrigger value="wordcount">
              {translations.settings.tabs.wordCount}
            </TabsTrigger>
            <TabsTrigger value="memory">
              🧠 AI 記憶
            </TabsTrigger>
          </TabsList>

          <TabsContent value="language" className="space-y-4">
            <LanguageSwitcher currentLanguage={language} translations={translations} />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <ThemeSwitcher translations={translations} />
          </TabsContent>

          <TabsContent value="wordcount" className="space-y-4">
            <WordCountDisplay wordCount={wordCount} translations={translations} />
          </TabsContent>

          <TabsContent value="memory" className="space-y-4">
            {preferences ? (
              <MemorySettings initialPreferences={preferences} />
            ) : (
              <p className="text-slate-400 text-sm">載入記憶設定中...</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
