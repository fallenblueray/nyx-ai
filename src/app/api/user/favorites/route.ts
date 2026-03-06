import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Template } from "@/types/template";
import { officialTemplates } from "@/data/templates";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/favorites
 * 獲取當前用戶的收藏模板列表
 */
export async function GET() {
  try {
    const supabase = await createServerClient();

    // 獲取當前用戶
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 查詢用戶收藏
    const { data: favorites, error } = await supabase
      .from("user_template_favorites")
      .select("template_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Favorites GET error:", error);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 }
      );
    }

    // 從官方模板中獲取完整數據
    const favoriteTemplates: (Template & { favoritedAt: string })[] = [];
    
    for (const fav of favorites || []) {
      const template = officialTemplates.find((t) => t.id === fav.template_id);
      if (template) {
        favoriteTemplates.push({
          ...template,
          favoritedAt: fav.created_at,
        });
      }
    }

    return NextResponse.json({
      templates: favoriteTemplates,
      total: favoriteTemplates.length,
    });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/favorites
 * 添加模板到收藏
 * 
 * Body: { templateId: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    // 獲取當前用戶
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 解析請求體
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    // 檢查模板是否存在
    const template = officialTemplates.find((t) => t.id === templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // 插入收藏記錄
    const { error } = await supabase
      .from("user_template_favorites")
      .insert({
        user_id: user.id,
        template_id: templateId,
      });

    if (error) {
      // 處理重複收藏的錯誤
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Template already favorited" },
          { status: 409 }
        );
      }
      
      console.error("Favorites POST error:", error);
      return NextResponse.json(
        { error: "Failed to add favorite" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Template favorited successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/favorites?templateId=xxx
 * 取消收藏模板
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient();

    // 獲取當前用戶
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 獲取 templateId
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    // 刪除收藏記錄
    const { error } = await supabase
      .from("user_template_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("template_id", templateId);

    if (error) {
      console.error("Favorites DELETE error:", error);
      return NextResponse.json(
        { error: "Failed to remove favorite" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Template unfavorited successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Favorites DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
