/**
 * NyxAI 安全層
 * 僅防禦惡意攻擊，不過濾成人內容
 * 
 * 保護：
 * - Prompt Injection（指令注入）
 * - 輸入驗證（長度、格式）
 * - 基礎非法內容關鍵詞過濾
 */

// ============================================================
// 1. Prompt Injection 檢測
// ============================================================

const INJECTION_PATTERNS = [
  // 繞過系統指令
  /ignore\s+(all\s+)?previous\s+(instruction|command|system|prompt)/i,
  /disregard\s+(all\s+)?(your\s+)?(instruction|rule|guideline)/i,
  /forget\s+(everything|all|your)\s+(you\s+)?(know|learned|were\s+told)/i,
  
  // 扮演/模擬
  /you\s+are\s+(now\s+)?(a|an|)\s*(different|mock|pretend|roleplay)/i,
  /act\s+as\s+(if|like)\s+(you\s+are|being)/i,
  /simulate\s+(being|a)\s*(chatbot|AI|assistant)/i,
  
  // 提取敏感資訊
  /(what\s+is|show\s+me|reveal)\s+(your\s+)?(system\s+prompt|instruction|configuration)/i,
  /(tell|output)\s+me\s+(your|the)\s+(hidden|secret|internal)/i,
  /extract\s+(the\s+)?(system\s+)?prompt/i,
  /list\s+(all\s+)?(your\s+)?(instruction|rule)/i,
  
  // 扮演管理員/開發者
  /(you\s+are|act\s+as)\s+(a\s+)?(system\s+)?(admin|administrator|root|developer|programmer)/i,
  /bypass\s+(your\s+)?(restriction|safety|filter|guideline)/i,
  
  // JavaScript/程式碼注入
  /<script|javascript:|on\w+\s*=|eval\s*\(/i,
  /\}\s*;\s*alert/,
  
  // SQL 注入測試
  /('|")\s*(OR|AND)\s+('|")?\s*=/i,
  /union\s+select/i,
  /drop\s+table/i,
]

/**
 * 檢測 Prompt Injection 攻擊
 * @returns { isInjection: boolean, matchedPattern?: string }
 */
export function detectPromptInjection(input: string): { isInjection: boolean; matchedPattern?: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { isInjection: true, matchedPattern: pattern.source }
    }
  }
  return { isInjection: false }
}

// ============================================================
// 2. 輸入驗證
// ============================================================

export interface ValidationResult {
  valid: boolean
  error?: string
}

const MAX_INPUT_LENGTH = 5000       // 劇情起點最大字符
const MAX_TOPICS = 5                // 最大題材數
const MAX_CHARACTERS = 10            // 最大角色數
const MAX_CHARACTER_NAME = 100      // 角色名最大字符
const MAX_CHARACTER_DESC = 500      // 角色描述最大字符

export function validateInput(params: {
  storyInput?: string
  topics?: Array<{ category: string; item: string }>
  characters?: Array<{ name: string; description: string; traits: string[] }>
}): ValidationResult {
  // 驗證劇情起點
  if (params.storyInput !== undefined) {
    if (!params.storyInput || params.storyInput.trim().length === 0) {
      return { valid: false, error: '請輸入劇情起點' }
    }
    if (params.storyInput.length > MAX_INPUT_LENGTH) {
      return { valid: false, error: `劇情起點過長，請限制在 ${MAX_INPUT_LENGTH} 字以內` }
    }
  }

  // 驗證題材數量
  if (params.topics && params.topics.length > MAX_TOPICS) {
    return { valid: false, error: `題材數量過多，請選擇最多 ${MAX_TOPICS} 個` }
  }

  // 驗證角色數量
  if (params.characters && params.characters.length > MAX_CHARACTERS) {
    return { valid: false, error: `角色數量過多，請限制在 ${MAX_CHARACTERS} 個以內` }
  }

  // 驗證每個角色
  if (params.characters) {
    for (const char of params.characters) {
      if (!char.name || char.name.trim().length === 0) {
        return { valid: false, error: '角色名稱不能為空' }
      }
      if (char.name.length > MAX_CHARACTER_NAME) {
        return { valid: false, error: `角色名稱過長，請限制在 ${MAX_CHARACTER_NAME} 字以內` }
      }
      if (char.description && char.description.length > MAX_CHARACTER_DESC) {
        return { valid: false, error: `角色描述過長，請限制在 ${MAX_CHARACTER_DESC} 字以內` }
      }
    }
  }

  return { valid: true }
}

// ============================================================
// 3. 基礎非法內容關鍵詞（法律底線）- 兒童相關
// ============================================================

const ILLEGAL_KEYWORDS = [
  // 兒童性虐待相關（零容忍）
  /child\s*(abuse|sexual|porn|exploit|trafficking)/i,
  /minor\s*(sexual|porn|abuse)/i,
  /underage\s*(sex|sexual|porn)/i,
  /little\s*(girl|boy|child).*sex/i,
  /\b(pedo|pедo|pedophile)\b/i,
  
  // 暴力犯罪
  /(terrorist|extremist)\s*(attack|plot|plan)/i,
  /\b(bomb|explosive)\s*(making|build|plant)/i,
]

/**
 * 檢測非法內容（法律底線）
 * @returns { isIllegal: boolean, matchedPattern?: string }
 */
export function detectIllegalContent(input: string): { isIllegal: boolean; matchedPattern?: string } {
  for (const pattern of ILLEGAL_KEYWORDS) {
    if (pattern.test(input)) {
      return { isIllegal: true, matchedPattern: pattern.source }
    }
  }
  return { isIllegal: false }
}

// ============================================================
// 4. 速率限制（基礎實現）
// ============================================================

// 簡單的內存速率限制（生產環境建議用 Redis）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMITS: Record<'anonymous' | 'loggedIn', { windowMs: number; maxRequests: number }> = {
  anonymous: { windowMs: 60 * 1000, maxRequests: 3 },  // 匿名用戶：每分鐘 3 次
  loggedIn: { windowMs: 60 * 1000, maxRequests: 10 },  // 登入用戶：每分鐘 10 次
}

/**
 * 速率限制檢查
 * @param identifier - 用戶標識（IP 或 userId）
 * @param type - 用戶類型
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  identifier: string,
  type: 'anonymous' | 'loggedIn'
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[type]
  const now = Date.now()
  
  const record = rateLimitMap.get(identifier)
  
  if (!record || now > record.resetTime) {
    // 新窗口
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }
  
  if (record.count >= config.maxRequests) {
    // 超限
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now
    }
  }
  
  // 遞增計數
  record.count++
  rateLimitMap.set(identifier, record)
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetIn: record.resetTime - now
  }
}

/**
 * 清理過期的速率限制記錄
 */
export function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// 定期清理（每 5 分鐘）
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}
