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
  // 不在這裡做服務端重定向，允許匿名訪問
  // 客戶端會處理登入狀態
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // 只在有登入時獲取偏好設定
  let translations = getTranslation('zh-TW');
  
  if (userId) {
    const supabase = createAdminClient();
    const { data: profileData } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', userId)
      .maybeSingle();

    if (profileData?.preferred_language) {
      const language = profileData.preferred_language as Language;
      translations = getTranslation(language);
    }
  }

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
