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
  title: "NyxAI - 輸入一句話，AI為你寫完整故事",
  description: "NyxAI 是一個 AI 故事生成器。輸入一句開頭，AI 立即生成完整劇情。無需登入，免費體驗 8000 字。每天都有數萬篇 AI 故事在 NyxAI 誕生。",
  keywords: "AI故事, AI生成, 故事創作, 小說生成, AI寫作",
};

// 網頁版本號 - 小更新 +0.001，大型更新（如重構系統）+0.1
const VERSION = 'v1.068'

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
