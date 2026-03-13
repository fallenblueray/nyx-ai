import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 獲取熱門故事列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "today"; // today, week, all_time
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sort_by") || "trending"; // trending, views, shares

    const supabase = await createClient();

    // 構建查詢
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
    if (sortBy === "trending") {
      // trending_score = view_count + share_count * 3
      query = query.order("share_count", { ascending: false });
    } else if (sortBy === "views") {
      query = query.order("view_count", { ascending: false });
    } else if (sortBy === "shares") {
      query = query.order("share_count", { ascending: false });
    }

    // 限制數量
    query = query.limit(limit);

    const { data: stories, error } = await query;

    if (error) {
      console.error("Trending API error:", error);
      return NextResponse.json(
        { error: "獲取熱門故事失敗" },
        { status: 500 }
      );
    }

    // 處理數據，提取標題和預覽
    const processedStories = stories?.map((story) => {
      const title = story.title || story.content?.split("\n")[0]?.slice(0, 30) || "精彩故事";
      const preview = story.content?.slice(0, 100) + "..." || "";
      
      // 計算趨勢分數
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
    }) || [];

    return NextResponse.json({
      stories: processedStories,
      period,
      sort_by: sortBy,
    });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      { error: "服務器錯誤" },
      { status: 500 }
    );
  }
}
