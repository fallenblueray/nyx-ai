"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface TrendingStory {
  id: string;
  short_id: string;
  title: string;
  preview: string;
  template_name?: string;
  view_count: number;
  created_at: string;
}

export function TrendingStoriesScroll() {
  const [stories, setStories] = useState<TrendingStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stories/trending?period=today&sort_by=trending&limit=10`);
      const data = await response.json();
      
      if (data.stories) {
        setStories(data.stories);
      }
    } catch (error) {
      console.error("Fetch trending error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const formatViewCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}萬`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <section id="trending" className="py-12 px-4">
      <div className="mx-auto max-w-6xl">
        {/* 標題 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
            <Flame className="h-6 w-6 text-orange-400" />
            今天最熱門的 AI 故事
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="h-9 w-9 rounded-full border-white/20 bg-black/40 hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="h-9 w-9 rounded-full border-white/20 bg-black/40 hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* 可滾動卡片區 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-400" />
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/40 py-12 text-center text-white/40">
            暫無熱門故事，來成為第一個創作者吧！
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {stories.map((story, index) => (
              <Link
                key={story.id}
                href={`/story/${story.short_id || story.id}`}
                className="group flex-shrink-0"
              >
                <div className="w-[280px] rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
                  {/* 排名 */}
                  <div className="mb-2 flex items-center gap-2">
                    {index < 3 ? (
                      <span className="text-xl">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                        {index + 1}
                      </span>
                    )}
                    {story.template_name && (
                      <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                        {story.template_name}
                      </span>
                    )}
                  </div>

                  {/* 標題 */}
                  <h3 className="line-clamp-2 text-base font-semibold text-white group-hover:text-purple-300">
                    {story.title}
                  </h3>

                  {/* 預覽 */}
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/50">
                    「{story.preview}」
                  </p>

                  {/* 數據 */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatViewCount(story.view_count)} 閱讀
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 查看全部 */}
        <div className="mt-6 text-center">
          <Link href="/trending">
            <Button
              variant="outline"
              className="border-white/20 bg-black/40 px-6 text-white/70 hover:bg-white/10 hover:text-white"
            >
              查看全部熱門故事 →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
