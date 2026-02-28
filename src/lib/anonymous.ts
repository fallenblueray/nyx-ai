/**
 * 匿名用戶識別系統
 * - 前端生成 UUID，存 localStorage
 * - 服務端以此 ID 查 Supabase anonymous_usage 表
 * - 不依賴 localStorage 作為真實來源（防篡改）
 */

const ANONYMOUS_ID_KEY = 'nyx-anon-id'

/**
 * 獲取或生成匿名 ID（純前端）
 */
export function getOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  
  let id = localStorage.getItem(ANONYMOUS_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ANONYMOUS_ID_KEY, id)
  }
  return id
}

/**
 * 獲取匿名 ID（不創建）
 */
export function getAnonymousId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ANONYMOUS_ID_KEY)
}

/**
 * 清除匿名 ID（用戶登入後保留，用於合併額度）
 */
export function clearAnonymousId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ANONYMOUS_ID_KEY)
}

export const FREE_WORD_LIMIT = 8000
