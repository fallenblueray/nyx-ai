import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/referral - 獲取當前用戶的邀請碼和統計
export async function GET() {
  try {
    // 使用 next-auth 獲取用戶會話
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = createAdminClient();

    // 查詢用戶的邀請碼
    let { data: referralCode } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", userId)
      .single();

    // 如果沒有邀請碼，創建一個
    if (!referralCode) {
      const code = nanoid(8).toUpperCase();
      
      const { data: newCode, error: createError } = await supabase
        .from("referral_codes")
        .insert({
          user_id: userId,
          code: code,
          total_invites: 0,
          successful_conversions: 0,
          reward_earned: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("Create referral code error:", createError);
        return NextResponse.json({ error: "創建邀請碼失敗" }, { status: 500 });
      }

      referralCode = newCode;
    }

    // 獲取邀請歷史
    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    if (referralsError) {
      console.error("Fetch referrals error:", referralsError);
    }

    return NextResponse.json({
      code: referralCode.code,
      totalInvites: referralCode.total_invites,
      conversions: referralCode.successful_conversions,
      rewards: referralCode.reward_earned,
      referrals: referrals || [],
    });

  } catch (error) {
    console.error("Referral GET error:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST /api/referral/track - 追蹤邀請轉化
export async function POST(request: Request) {
  try {
    console.log('[Referral API] POST request received');
    const { code, referredId } = await request.json();
    console.log('[Referral API] Params:', { code, referredId });

    if (!code || !referredId) {
      console.log('[Referral API] Missing params');
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    const supabase = createAdminClient();
    console.log('[Referral API] Supabase client created');

    // 查找邀請碼
    console.log('[Referral API] Looking up code:', code.toUpperCase());
    const { data: referralCode, error: codeError } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (codeError) {
      console.error('[Referral API] Code lookup error:', codeError);
    }

    if (codeError || !referralCode) {
      console.log('[Referral API] Code not found');
      return NextResponse.json({ error: "無效的邀請碼" }, { status: 404 });
    }
    console.log('[Referral API] Code found:', referralCode.code, 'for user:', referralCode.user_id);

    // 不能自己邀請自己
    if (referralCode.user_id === referredId) {
      return NextResponse.json({ error: "無法使用自己的邀請碼" }, { status: 400 });
    }

    // 檢查是否已經被邀請過
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("*")
      .eq("referred_id", referredId)
      .single();

    if (existingReferral) {
      return NextResponse.json({ error: "該用戶已被邀請" }, { status: 400 });
    }

    // 創建邀請記錄
    console.log('[Referral API] Creating referral record');
    const { error: insertError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referralCode.user_id,
        referred_id: referredId,
        code: code.toUpperCase(),
        status: "converted",
        converted_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Referral API] Insert referral error:', insertError);
      return NextResponse.json({ error: "記錄邀請失敗" }, { status: 500 });
    }
    console.log('[Referral API] Referral record created successfully');

    // 更新邀請碼統計
    const { error: updateError } = await supabase
      .from("referral_codes")
      .update({
        successful_conversions: referralCode.successful_conversions + 1,
        reward_earned: referralCode.reward_earned + 1000, // 獎勵 1000 字
        updated_at: new Date().toISOString(),
      })
      .eq("id", referralCode.id);

    if (updateError) {
      console.error("Update referral code error:", updateError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Referral POST error:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
