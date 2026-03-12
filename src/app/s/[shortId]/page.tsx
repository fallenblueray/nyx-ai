import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

interface StoryPreviewPageProps {
  params: Promise<{
    shortId: string;
  }>;
}

// 動態生成 metadata（Open Graph）
export async function generateMetadata({
  params,
}: StoryPreviewPageProps): Promise<Metadata> {
  const { shortId } = await params;
  
  const supabase = await createClient();
  
  // 查詢故事
  const { data: story } = await supabase
    .from("stories")
    .select("title, content, short_id, created_at")
    .eq("short_id", shortId)
    .single();

  if (!story) {
    return {
      title: "故事未找到 | NyxAI",
      description: "這個故事鏈接已失效或不存在。",
    };
  }

  // 提取標題和預覽
  const title = story.title || "AI 生成的神秘故事";
  const preview = story.content
    ?.replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 150) || "一個引人入勝的 AI 生成故事...";

  return {
    title: `${title} | NyxAI`,
    description: `${preview}...`,
    openGraph: {
      title: title,
      description: `${preview}...`,
      url: `https://nyx-ai.net/s/${shortId}`,
      siteName: "NyxAI",
      type: "article",
      publishedTime: story.created_at,
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: `${preview}...`,
    },
  };
}

export default async function StoryPreviewPage({
  params,
}: StoryPreviewPageProps) {
  const { shortId } = await params;
  
  const supabase = await createClient();
  
  // 查詢故事
  const { data: story } = await supabase
    .from("stories")
    .select("id, title, content, short_id, template_name, created_at")
    .eq("short_id", shortId)
    .single();

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">故事未找到</h1>
          <p className="text-gray-400 mb-6">這個故事鏈接已失效或不存在。</p>
          <Link href="/">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <BookOpen className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 提取標題
  const displayTitle = story.title || 
    story.content?.split("\n")[0]?.slice(0, 30) || 
    "神秘故事";

  // 提取前 300 字作為預覽
  const previewText = story.content
    ?.replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 300) || "";

  // 構建主應用鏈接（帶入故事 ID）
  const appUrl = `/app?story=${story.id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">NyxAI</span>
          </Link>
          <span className="text-sm text-gray-400">AI 故事創作平台</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <article className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          {/* Story Header */}
          <div className="p-8 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                {story.template_name || "原創故事"}
              </span>
              <span className="text-gray-500 text-sm">
                {new Date(story.created_at).toLocaleDateString("zh-TW")}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              {displayTitle}
            </h1>
          </div>

          {/* Story Preview with Gradient Mask */}
          <div className="relative">
            <div className="p-8 pb-24">
              <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-wrap">
                {previewText}
              </p>
            </div>
            
            {/* Gradient Mask */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent pointer-events-none" />
            
            {/* CTA Section */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center">
              <p className="text-gray-400 mb-4 text-center">
                還有 {story.content?.length || 0} 字的精彩內容...
              </p>
              <Link href={appUrl}>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
                >
                  繼續閱讀完整故事
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </article>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm text-gray-400">5 秒生成</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl mb-2">🎭</div>
            <div className="text-sm text-gray-400">多種模板</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl mb-2">✨</div>
            <div className="text-sm text-gray-400">無限創作</div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">想創作自己的故事？</p>
          <Link href="/app">
            <Button 
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              開始創作
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          © 2025 NyxAI. AI 驅動的故事創作平台。
        </div>
      </footer>
    </div>
  );
}
