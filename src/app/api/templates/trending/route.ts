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

    let trendingTemplates: (Template & { usageCount: number })[] = [];

    try {
      // 查詢指定時間範圍內的模板使用統計
      const { data: stats, error } = await supabase
        .from("template_usage_stats")
        .select("template_id, count")
        .gte("used_at", new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order("used_at", { ascending: false });

      if (!error && stats) {
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
    } catch (e) {
      // 表不存在或查詢失敗，使用默認邏輯
      console.warn("Trending stats query failed, using fallback:", e);
    }

    // 如果數據不足，補充熱門默認模板
    if (trendingTemplates.length < limit) {
      const existingIds = new Set(trendingTemplates.map((t) => t.id));
      const HOT_TEMPLATE_IDS = [
        "office-overtime",
        "neighbor-wife",
        "teacher-tutoring", 
        "childhood-friend",
        "school-senior"
      ];
      
      // 優先使用預設熱門模板
      for (const id of HOT_TEMPLATE_IDS) {
        if (trendingTemplates.length >= limit) break;
        if (existingIds.has(id)) continue;
        
        const template = officialTemplates.find((t) => t.id === id);
        if (template) {
          trendingTemplates.push({ ...template, usageCount: 0 });
          existingIds.add(id);
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
