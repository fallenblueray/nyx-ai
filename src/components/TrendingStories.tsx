"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Eye, Share2, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";

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

export function TrendingStories() {
  const [stories, setStories] = useState<TrendingStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trending");

  useEffect(() => {
    fetchTrending();
  }, [activeTab]);

  const fetchTrending = async () => {
    setIsLoading(true);
    try {
      const sortBy = activeTab === "trending" ? "trending" : activeTab;
      const response = await fetch(`/api/stories/trending?period=today&sort_by=${sortBy}&limit=10`);
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
    <Card className="bg-white/5 border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-5 h-5 text-orange-400" />
          🔥 熱門故事
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-black/20">
            <TabsTrigger value="trending" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              最熱門
            </TabsTrigger>
            <TabsTrigger value="views" className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              最多閱讀
            </TabsTrigger>
            <TabsTrigger value="shares" className="flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              最多分享
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                暫無熱門故事
              </div>
            ) : (
              <div className="space-y-3">
                {stories.map((story, index) => (
                  <Link 
                    key={story.id} 
                    href={`/story/${story.short_id || story.id}`}
                  >
                    <div 
                      className={`p-3 rounded-lg border bg-gradient-to-r ${getRankStyle(index)} hover:opacity-80 transition-opacity cursor-pointer`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold min-w-[28px]">
                          {getRankIcon(index)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-white truncate">
                            {story.title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {story.preview}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {story.template_name && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                                {story.template_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {story.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="w-3 h-3" />
                              {story.share_count}
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

        <Link href="/trending">
          <Button 
            variant="outline" 
            className="w-full mt-4 border-purple-500/30 hover:bg-purple-500/10"
          >
            查看全部熱門
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
