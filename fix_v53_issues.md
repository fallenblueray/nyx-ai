# V5.3 問題修復計劃

## 問題 1：緩存導致提示詞修改不生效

**症狀：**
- 在 /admin/prompts 保存新提示詞
- 刷新頁面生成角色，仍按舊提示詞生成

**原因：**
- `prompt-engine.ts` 有 60 秒緩存機制
- 保存後需等待 60 秒或重啟服務器才生效

**修復方案：**
1. 縮短緩存時間到 10 秒（開發/測試友好）
2. 提供手動清除緩存 API
3. 保存提示詞後自動清除緩存

---

## 問題 2：Outline 路由未使用 DeepSeek R1

**當前代碼：**
```typescript
const model = process.env.STORY_GENERATION_MODEL || "deepseek/deepseek-chat"
```

**預期模型：**
- `deepseek/deepseek-r1-0528` (OpenRouter)

**修復方案：**
1. 修改 `outline/route.ts` 強制使用 R1 模型
2. 或更新環境變數 `STORY_GENERATION_MODEL`

---

## 修復步驟

### 步驟 1：修改 prompt-engine.ts

```typescript
// 縮短緩存時間到 10 秒
const CACHE_DURATION = 10000 // 10秒

// 添加清除緩存函數
export function clearPromptCache(): void {
  promptCache = {}
  cacheTimestamp = 0
  console.log('[PromptEngine] Cache cleared')
}

// 添加調試日誌
export async function getPromptFromDB(key: string): Promise<string | null> {
  // ... existing code ...
  console.log(`[PromptEngine] Fetching prompt: ${key} from DB`)
  // ...
  if (data) {
    console.log(`[PromptEngine] Loaded custom prompt: ${key}, length: ${data.content.length}`)
  }
}
```

### 步驟 2：修改 /api/admin/prompts/route.ts

在 POST 更新提示詞後，清除緩存：

```typescript
import { clearPromptCache } from '@/lib/prompt-engine'

// ... in POST handler after successful update ...
clearPromptCache()
return NextResponse.json({ success: true, version: newVersion })
```

### 步驟 3：修改 /api/story/outline/route.ts

```typescript
// 強制使用 R1 模型
const model = "deepseek/deepseek-r1-0528"

// 增加更詳細日誌
console.log('[Outline] Generating with model:', model)
console.log('[Outline] Template:', template.id)
```

---

## 驗證方法

1. **測試緩存清除**
   - 修改角色提示詞
   - 立即保存
   - 生成角色，檢查是否符合新提示詞

2. **測試 R1 模型**
   - 查看日誌確認模型名稱
   - 觀察生成質量是否提升

3. **測試即時生效**
   - 連續修改 3 次提示詞
   - 每次保存後立即測試生成
   - 確認每次都使用最新提示詞
