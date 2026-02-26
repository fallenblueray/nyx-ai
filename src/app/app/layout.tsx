import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { TranslationProvider } from '@/components/TranslationContext';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 驗證用戶登入
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // 獲取用戶偏好設定
  const supabase = createAdminClient();
  const { data: profileData } = await supabase
    .from('profiles')
    .select('preferred_language')
    .eq('id', session.user.id)
    .single();

  const language = (profileData?.preferred_language || 'zh-TW') as Language;
  const translations = getTranslation(language);

  // 將翻譯傳遞給 TranslationProvider
  return (
    <>
      {/* 主題初始化腳本 - 必須在 layout 級別應用 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const theme = localStorage.getItem('theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme ? theme === 'dark' : systemDark;
                
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch(e) {}
            })();
          `,
        }}
      />
      <TranslationProvider translations={translations}>{children}</TranslationProvider>
    </>
  );
}
