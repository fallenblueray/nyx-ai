import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Eye, Share2, TrendingUp, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { StoryShareCard } from "@/components/StoryShareCard";

export const metadata: Metadata = {
  title: "熱門故事排行榜 | NyxAI",
  description: "探索 NyxAI 上最熱門的 AI 生成故事",
};

interface TrendingStory {
  id: string;
  short_id: string;
  title: string;
  preview: string;
  template_name?: string;
  view_count: number;
  share_count: number;
  trending_score: number;
  created_at: string;
}

async function getTrendingStories(period: string = "today", sortBy: string = "trending", limit: number = 20): Promise<TrendingStory[]> {
  const supabase = await createClient();

  let query = supabase
    .from("stories")
    .select("id, title, content, short_id, template_name, view_count, share_count, created_at")
    .eq("is_public", true);

  // 時間範圍篩選
  if (period === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query = query.gte("created_at", today.toISOString());
  } else if (period === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query = query.gte("created_at", weekAgo.toISOString());
  }

  // 排序邏輯
  if (sortBy === "trending" || sortBy === "views") {
    query = query.order("view_count", { ascending: false });
  } else if (sortBy === "shares") {
    query = query.order("share_count", { ascending: false });
  }

  query = query.limit(limit);

  const { data: stories, error } = await query;

  if (error || !stories) {
    console.error("Trending fetch error:", error);
    return [];
  }

  return stories.map((story) => {
    const title = story.title || story.content?.split("\n")[0]?.slice(0, 30) || "精彩故事";
    const preview = story.content?.slice(0, 150) + "..." || "";
    const trendingScore = (story.view_count || 0) + (story.share_count || 0) * 3;

    return {
      id: story.id,
      short_id: story.short_id,
      title,
      preview,
      template_name: story.template_name,
      view_count: story.view_count || 0,
      share_count: story.share_count || 0,
      trending_score: trendingScore,
      created_at: story.created_at,
    };
  });
}

export default async function TrendingPage({
  searchParams,
}: {
  searchParams: { period?: string; sort?: string };
}) {
  const period = searchParams.period || "today";
  const sortBy = searchParams.sort || "trending";

  const stories = await getTrendingStories(period, sortBy, 50);

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return "from-yellow-500/20 to-orange-500/20 border-yellow-500/30";
    if (index === 1) return "from-gray-400/20 to-gray-300/20 border-gray-400/30";
    if (index === 2) return "from-amber-700/20 to-amber-600/20 border-amber-700/30";
    return "from-purple-500/10 to-pink-500/10 border-purple-500/20";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-white">
            NyxAI
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/app">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                開始創作
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Flame className="w-8 h-8 text-orange-400" />
            🔥 熱門故事排行榜
          </h1>
          <p className="text-gray-400">
            探索 NyxAI 上最精彩的 AI 生成故事
          </p>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 mb-6">
            <TabsTrigger value="today" asChild>
              <Link href="/trending?period=today" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                今日熱門
              </Link>
            </TabsTrigger>
            <TabsTrigger value="week" asChild>
              <Link href="/trending?period=week" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                本週熱門
              </Link>
            </TabsTrigger>
            <TabsTrigger value="all" asChild>
              <Link href="/trending?period=all" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                全部時間
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="mt-0">
            {stories.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-medium text-white mb-2">
                  暫無熱門故事
                </h3>
                <p className="text-gray-400 mb-6">
                  還沒有故事上榜，成為第一個創作者吧！
                </p>
                <Link href="/app">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                    開始創作
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {stories.map((story, index) => (
                  <Link 
                    key={story.id} 
                    href={`/story/${story.short_id || story.id}`}
                  >
                    <div 
                      className={`p-5 rounded-xl border bg-gradient-to-r ${getRankStyle(index)} hover:opacity-90 transition-opacity cursor-pointer`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-2xl font-bold min-w-[40px] text-center">
                          {getRankIcon(index)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg text-white mb-1">
                                {story.title}
                              </h3>
                              <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                {story.preview}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            {story.template_name && (
                              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
                                {story.template_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-gray-500">
                              <Eye className="w-4 h-4" />
                              {story.view_count} 閱讀
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <Share2 className="w-4 h-4" />
                              {story.share_count} 分享
                            </span>
                            <span className="text-gray-600">
                              {new Date(story.created_at).toLocaleDateString("zh-TW")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            想讓你的故事上榜？
          </h2>
          <p className="text-gray-300 mb-4">
            創作精彩故事，分享給朋友，登上熱門排行榜！
          </p>
          <Link href="/app">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
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
