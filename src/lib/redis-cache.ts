/**
 * NyxAI Redis 緩存層
 * 
 * 策略：相同 prompt_hash → 緩存 3 小時
 * 效益：減少 40-60% OpenRouter API 成本
 */

import { Redis } from '@upstash/redis'
import crypto from 'crypto'

// 緩存 TTL（秒）
const CACHE_TTL = 60 * 60 * 3 // 3 小時

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  
  if (!url || !token) {
    console.warn('[redis-cache] Missing UPSTASH credentials, cache disabled')
    return null
  }
  
  redis = new Redis({ url, token })
  return redis
}

// ============================================================
// 緩存 Key 生成
// ============================================================

/**
 * 生成緩存 Key
 * 包含：model + systemPrompt + userPrompt（hash）
 * 不包含：user_id（相同 prompt 對所有用戶一致）
 */
export function buildCacheKey(params: {
  model: string
  systemPrompt: string
  userPrompt: string
}): string {
  const raw = `${params.model}:${params.systemPrompt}:${params.userPrompt}`
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32)
  return `story:${hash}`
}

// ============================================================
// 緩存讀寫
// ============================================================

export interface CachedStory {
  content: string
  model: string
  cachedAt: number
}

/**
 * 讀取緩存故事
 * @returns CachedStory | null
 */
export async function getCachedStory(key: string): Promise<CachedStory | null> {
  const client = getRedis()
  if (!client) return null
  
  try {
    const data = await client.get<CachedStory>(key)
    if (data) {
      console.log(`[redis-cache] HIT: ${key.slice(0, 20)}...`)
    }
    return data
  } catch (e) {
    console.warn('[redis-cache] GET error:', e)
    return null
  }
}

/**
 * 寫入緩存故事
 */
export async function setCachedStory(key: string, content: string, model: string): Promise<void> {
  const client = getRedis()
  if (!client) return
  
  try {
    const payload: CachedStory = {
      content,
      model,
      cachedAt: Date.now()
    }
    await client.set(key, payload, { ex: CACHE_TTL })
    console.log(`[redis-cache] SET: ${key.slice(0, 20)}... (TTL: ${CACHE_TTL}s)`)
  } catch (e) {
    console.warn('[redis-cache] SET error:', e)
  }
}

/**
 * 清除特定緩存
 */
export async function invalidateCachedStory(key: string): Promise<void> {
  const client = getRedis()
  if (!client) return
  
  try {
    await client.del(key)
  } catch (e) {
    console.warn('[redis-cache] DEL error:', e)
  }
}
