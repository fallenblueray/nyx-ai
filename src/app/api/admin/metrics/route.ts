/**
 * NyxAI Admin Metrics API
 * Stage 4.2: P2 評估系統 - 管理員指標查詢
 * 
 * GET /api/admin/metrics?range=7d|30d|all
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { createAdminClient } from "@/lib/supabase-admin"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function GET(req: NextRequest) {
  // 管理員驗證
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') || '7d'
  
  const supabase = createAdminClient()
  
  // 計算時間範圍
  const now = new Date()
  const since = new Date()
  if (range === '7d') since.setDate(now.getDate() - 7)
  else if (range === '30d') since.setDate(now.getDate() - 30)
  else since.setFullYear(2020) // all

  try {
    // 並行查詢所有指標
    const [logsResult, qualityResult, guardrailResult, modelResult] = await Promise.all([
      // 1. 技術指標：延遲、Token消耗
      supabase
        .from('evaluation_logs')
        .select('latency_ms, total_tokens, model, is_anonymous, created_at')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false }),
      
      // 2. 質量指標：評估分數分佈
      supabase
        .from('story_evaluations')
        .select('overall_score, coherence, literary_quality, engagement, passed_threshold, evaluated_at')
        .gte('evaluated_at', since.toISOString()),
      
      // 3. 安全審計：Guardrail 觸發
      supabase
        .from('evaluation_logs')
        .select('guardrail_type, created_at')
        .eq('guardrail_triggered', true)
        .gte('created_at', since.toISOString()),
      
      // 4. 模型使用分佈
      supabase
        .from('evaluation_logs')
        .select('model')
        .gte('created_at', since.toISOString()),
    ])

    const logs = logsResult.data || []
    const quality = qualityResult.data || []
    const guardrails = guardrailResult.data || []
    const modelUsage = modelResult.data || []

    // 計算技術指標
    const latencies = logs.map(l => l.latency_ms).filter(Boolean)
    const sortedLatencies = latencies.sort((a, b) => a - b)
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] ?? 0
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] ?? 0
    const totalTokens = logs.reduce((sum, l) => sum + (l.total_tokens || 0), 0)

    // 計算質量指標
    const avgScore = quality.length 
      ? quality.reduce((sum, q) => sum + q.overall_score, 0) / quality.length
      : 0
    const passRate = quality.length
      ? quality.filter(q => q.passed_threshold).length / quality.length
      : 0

    // 模型分佈
    const modelDist = modelUsage.reduce((acc: Record<string, number>, l) => {
      acc[l.model] = (acc[l.model] || 0) + 1
      return acc
    }, {})

    // Guardrail 分佈
    const guardrailDist = guardrails.reduce((acc: Record<string, number>, g) => {
      const type = g.guardrail_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      range,
      generated_at: now.toISOString(),
      
      technical: {
        total_requests: logs.length,
        anonymous_requests: logs.filter(l => l.is_anonymous).length,
        latency: { p50, p95, avg: latencies.reduce((s, v) => s + v, 0) / (latencies.length || 1) },
        tokens: { total: totalTokens, avg_per_request: totalTokens / (logs.length || 1) },
      },
      
      quality: {
        total_evaluated: quality.length,
        avg_score: Math.round(avgScore * 10) / 10,
        pass_rate: Math.round(passRate * 1000) / 10, // %
        score_distribution: {
          excellent: quality.filter(q => q.overall_score >= 80).length,
          good: quality.filter(q => q.overall_score >= 60 && q.overall_score < 80).length,
          poor: quality.filter(q => q.overall_score < 60).length,
        },
        avg_dimensions: quality.length ? {
          coherence: quality.reduce((s, q) => s + q.coherence, 0) / quality.length,
          literary_quality: quality.reduce((s, q) => s + q.literary_quality, 0) / quality.length,
          engagement: quality.reduce((s, q) => s + q.engagement, 0) / quality.length,
        } : null,
      },
      
      security: {
        guardrail_triggers: guardrails.length,
        distribution: guardrailDist,
      },
      
      models: {
        distribution: modelDist,
      }
    })

  } catch (error) {
    console.error('[admin/metrics] Error:', error)
    return NextResponse.json({ error: "查詢失敗" }, { status: 500 })
  }
}
