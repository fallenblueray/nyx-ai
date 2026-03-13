import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Sparkles, Eye } from "lucide-react";
import Link from "next/link";
import { StoryShareCard } from "@/components/StoryShareCard";

interface StoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

// 動態生成 metadata
export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { id } = await params;
  
  const supabase = await createClient();
  
  // 支持短 ID 和完整 ID 查詢
  const { data: story } = await supabase
    .from("stories")
    .select("title, content, short_id")
    .or(`id.eq.${id},short_id.eq.${id}`)
    .single();

  if (!story) {
    return {
      title: "故事未找到 | NyxAI",
    };
  }

  const title = story.title || "AI 生成的精彩故事";
  const preview = story.content?.slice(0, 100) || "";

  return {
    title: `${title} | NyxAI`,
    description: `${preview}...`,
    openGraph: {
      title,
      description: `${preview}...`,
      url: `https://nyx-ai.net/story/${story.short_id || id}`,
      siteName: "NyxAI",
      type: "article",
    },
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  
  const supabase = await createClient();
  
  // 查詢故事（支持短 ID 和完整 ID）
  const { data: story } = await supabase
    .from("stories")
    .select("id, title, content, short_id, template_name, template_id, view_count, created_at")
    .or(`id.eq.${id},short_id.eq.${id}`)
    .single();

  if (!story) {
    notFound();
  }

  // 增加閱讀計數
  await supabase
    .from("stories")
    .update({ view_count: (story.view_count || 0) + 1 })
    .eq("id", story.id);

  // 提取標題
  const displayTitle = story.title || story.content.split("\n")[0]?.slice(0, 30) || "精彩故事";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-white">NyxAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {(story.view_count || 0) + 1} 閱讀
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 故事卡片 */}
        <article className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          {/* 頭部 */}
          <div className="p-8 border-b border-white/10">
            {story.template_name && (
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                  {story.template_name}
                </span>
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              {displayTitle}
            </h1>
            <p className="text-gray-400 text-sm">
              {new Date(story.created_at).toLocaleDateString("zh-TW")} 發布
            </p>
          </div>

          {/* 故事內容 */}
          <div className="p-8">
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-lg text-gray-200 leading-relaxed">
                {story.content}
              </div>
            </div>
          </div>

          {/* 分享區域 */}
          <div className="p-8 border-t border-white/10 bg-white/5">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              分享這個故事
            </h3>
            <StoryShareCard 
              storyContent={story.content} 
              storyTitle={displayTitle}
              templateName={story.template_name}
            />
          </div>
        </article>

        {/* CTA 區域 */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            想用同樣的題材創作？
          </h2>
          <p className="text-gray-300 mb-4">
            使用「{story.template_name || "這個"}」模板，生成你的專屬故事
          </p>
          <Link href={`/app?template=${story.template_id || ""}`}>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              用這個模板創作
            </Button>
          </Link>
        </div>

        {/* 其他推薦 */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">更多故事</h3>
          <Link href="/">
            <Button variant="outline" className="w-full border-purple-500/30">
              探索更多 AI 故事
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
