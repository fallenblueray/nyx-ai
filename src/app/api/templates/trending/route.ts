import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Template } from "@/types/template";
import { officialTemplates } from "@/data/templates";

export const dynamic = "force-dynamic";

/**
 * GET /api/templates/trending
 * 獲取熱門模板列表（24小時內使用次數）
 * 
 * Query params:
 * - limit: 返回數量，默認 10
 * - hours: 統計時間範圍，默認 24
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const hours = parseInt(searchParams.get("hours") || "24", 10);

    const supabase = await createServerClient();

    const trendingTemplates: (Template & { usageCount: number })[] = [];

    try {
      // 使用 trending_templates 視圖獲取24小時內熱門模板
      const { data: trendingData, error: trendingError } = await supabase
        .from("trending_templates")
        .select("template_id, usage_count_24h")
        .limit(limit);

      if (!trendingError && trendingData && trendingData.length > 0) {
        // 從官方模板中獲取完整數據
        for (const item of trendingData) {
          const template = officialTemplates.find((t) => t.id === item.template_id);
          if (template) {
            trendingTemplates.push({
              ...template,
              usageCount: item.usage_count_24h || 0,
            });
          }
        }
      } else {
        // 如果視圖沒有數據，直接查詢 template_usage_stats 做聚合
        const { data: stats, error } = await supabase
          .from("template_usage_stats")
          .select("template_id")
          .gte("used_at", new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());

        if (!error && stats && stats.length > 0) {
          // 統計每個模板的使用次數
          const usageCount: Record<string, number> = {};
          stats.forEach((stat: { template_id: string }) => {
            usageCount[stat.template_id] = (usageCount[stat.template_id] || 0) + 1;
          });

          // 排序並獲取前 N 個
          const sortedTemplateIds = Object.entries(usageCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([id]) => id);

          // 從官方模板中獲取完整數據
          for (const templateId of sortedTemplateIds) {
            const template = officialTemplates.find((t) => t.id === templateId);
            if (template) {
              trendingTemplates.push({
                ...template,
                usageCount: usageCount[templateId],
              });
            }
          }
        }
      }
    } catch (e) {
      // 表不存在或查詢失敗，使用默認邏輯
      console.warn("Trending stats query failed, using fallback:", e);
    }

    // 如果數據不足，補充熱門默認模板
    if (trendingTemplates.length < limit) {
      const existingIds = new Set(trendingTemplates.map((t) => t.id));
      // 熱門模板配置：同時支持 id 和 slug 匹配
      const HOT_TEMPLATES = [
        { slug: "cold-boss-overtime", id: "career-001" },      // 女上司加班
        { slug: "lonely-neighbor", id: "mature-001" },         // 寂寞鄰居
        { slug: "female-teacher-after-class", id: "campus-002" }, // 女老師課後
        { slug: "childhood-sweetheart", id: "classic-002" },   // 青梅竹馬
        { slug: "school-belle-senior", id: "campus-001" },     // 校花學姐
      ];
      
      // 優先使用預設熱門模板
      for (const hot of HOT_TEMPLATES) {
        if (trendingTemplates.length >= limit) break;
        if (existingIds.has(hot.id)) continue;
        
        // 同時匹配 id 或 slug
        const template = officialTemplates.find(
          (t) => t.id === hot.id || t.slug === hot.slug
        );
        if (template) {
          trendingTemplates.push({ ...template, usageCount: 0 });
          existingIds.add(template.id);
        }
      }
      
      // 如果還不足，補充其他活躍模板
      if (trendingTemplates.length < limit) {
        const fillTemplates = officialTemplates
          .filter((t) => t.isActive && !existingIds.has(t.id))
          .slice(0, limit - trendingTemplates.length)
          .map((t) => ({ ...t, usageCount: 0 }));
        
        trendingTemplates.push(...fillTemplates);
      }
    }

    return NextResponse.json({
      templates: trendingTemplates,
      total: trendingTemplates.length,
      hours,
    });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
