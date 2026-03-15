/**
 * 匿名用戶識別系統 V2
 * - 前端生成 UUID，存 localStorage
 * - 同時收集瀏覽器指紋（防無痕模式繞過）
 * - 服務端以指紋為主、anonymous_id 為輔查詢
 * - 不依賴 localStorage 作為真實來源（防篡改）
 */

const ANONYMOUS_ID_KEY = 'nyx-anon-id'

// 指紋組件類型
export interface FingerprintComponents {
  canvas?: string
  webgl?: string
  fonts?: string[]
  timezone?: string
  screenResolution?: string
  colorDepth?: number
  userAgent?: string
  language?: string
  platform?: string
  touchSupport?: boolean
  deviceMemory?: number
  hardwareConcurrency?: number
}

// 完整匿名身份（包含指紋）
export interface AnonymousIdentity {
  anonymousId: string
  fingerprint: string
  components: FingerprintComponents
}

/**
 * 生成瀏覽器指紋（基於多種組件）
 * 不依賴外部庫，使用原生 API 收集特徵
 */
export async function generateFingerprint(): Promise<{ fingerprint: string; components: FingerprintComponents }> {
  if (typeof window === 'undefined') {
    return { fingerprint: '', components: {} }
  }

  const components: FingerprintComponents = {}

  try {
    // 1. Canvas 指紋
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 200
      canvas.height = 50
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(0, 0, 200, 50)
      ctx.fillStyle = '#069'
      ctx.fillText('NyxAI Fingerprint', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Canvas 指紋', 4, 30)
      components.canvas = canvas.toDataURL()
    }

    // 2. WebGL 指紋
    const glCanvas = document.createElement('canvas')
    const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        components.webgl = `
          ${gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)}
          ${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}
        `.trim()
      }
    }

    // 3. 系統特徵
    components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    components.screenResolution = `${screen.width}x${screen.height}x${screen.colorDepth}`
    components.colorDepth = screen.colorDepth
    components.userAgent = navigator.userAgent
    components.language = navigator.language
    components.platform = navigator.platform
    components.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    components.deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory || 0
    components.hardwareConcurrency = navigator.hardwareConcurrency || 0

    // 4. 字體檢測（簡化版）
    const testFonts = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana']
    const detectedFonts: string[] = []
    const testString = 'mmmmmmmmmwwwwwww'
    const testSize = '72px'
    
    const baseCanvas = document.createElement('canvas')
    const baseCtx = baseCanvas.getContext('2d')
    if (baseCtx) {
      baseCtx.font = `${testSize} monospace`
      const baseWidth = baseCtx.measureText(testString).width
      
      for (const font of testFonts) {
        baseCtx.font = `${testSize} ${font}, monospace`
        const width = baseCtx.measureText(testString).width
        if (width !== baseWidth) {
          detectedFonts.push(font)
        }
      }
    }
    components.fonts = detectedFonts

  } catch (e) {
    console.warn('[Fingerprint] Generation failed:', e)
  }

  // 生成指紋哈希（簡單的字符串拼接後 base64）
  const fingerprintString = JSON.stringify(components)
  const fingerprint = btoa(fingerprintString).slice(0, 64)

  return { fingerprint, components }
}

/**
 * 獲取或生成匿名 ID（包含指紋）
 * V2: 同時返回指紋信息
 */
export async function getOrCreateAnonymousIdentity(): Promise<AnonymousIdentity> {
  if (typeof window === 'undefined') {
    return { anonymousId: '', fingerprint: '', components: {} }
  }

  // 獲取或創建匿名 ID
  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY)
  if (!anonymousId) {
    anonymousId = crypto.randomUUID()
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId)
  }

  // 生成指紋
  const { fingerprint, components } = await generateFingerprint()

  return { anonymousId, fingerprint, components }
}

/**
 * 向後兼容：獲取或生成匿名 ID（舊版函數名）
 * @deprecated 請使用 getOrCreateAnonymousIdentity()
 */
export async function getOrCreateAnonymousId(): Promise<string> {
  const identity = await getOrCreateAnonymousIdentity()
  return identity.anonymousId
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
