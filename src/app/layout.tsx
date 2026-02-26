import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NyxAI - 五秒開展故事",
  description: "AI 故事生成平台，無審查自由創作",
};

// 網頁版本號 - 每次新增功能或修改內容 +0.001
const VERSION = 'v1.001'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        {/* 立即應用主題，避免閃爍 */}
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
                  console.log('[Theme Init] Applied:', isDark ? 'dark' : 'light');
                } catch (e) {
                  console.error('[Theme Init] Error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        {/* 版本號 */}
        <footer className="fixed bottom-2 right-2 text-xs text-gray-400 opacity-50 hover:opacity-100 transition-opacity pointer-events-none">
          {VERSION}
        </footer>
      </body>
    </html>
  );
}
