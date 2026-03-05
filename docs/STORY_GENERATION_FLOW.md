# NyxAI 故事生成流程總覽

> 生成日期：2026-03-05
> 適用版本：V3.0

---

## 一、生成流程架構

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (StoryOutput.tsx)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. 用戶輸入故事起點 + 選擇題材 + 設定角色                │  │
│  │  2. 選擇分段數 (1/2/3段，預設3段)                         │  │
│  │  3. 點擊「開始創作」或「繼續創作」                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              主 API: /api/generate-story/route.ts                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  安全檢查層：                                              │  │
│  │    - 輸入驗證 (validateInput)                             │  │
│  │    - Prompt Injection 檢測                                │  │
│  │    - 非法內容檢測                                         │  │
│  │    - 速率限制 (rate limit)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  記憶注入層（已登入用戶）：                                 │  │
│  │    - 讀取 user_preferences (preferred_styles/topics)      │  │
│  │    - 注入到 enrichedSystemPrompt                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  模式判斷：                                               │  │
│  │    IF targetSegments > 1 → 多段生成 (handleMultiSegment)  │  │
│  │    ELSE → 單段生成 (直接 streaming)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              分段 API: /api/story/segment/route.ts               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  分段生成模式（使用隱形大綱）：                            │  │
│  │    1. 第1段：從故事開頭延續                               │  │
│  │    2. 第2段：承接第1段 + 動態上下文提取                   │  │
│  │    3. 第3段：懸念結尾（特殊 prompt 邏輯）                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     OpenRouter API (DeepSeek R1)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Request:                                                │  │
│  │    model: "deepseek/deepseek-r1-0528"                    │  │
│  │    temperature: 0.85                                     │  │
│  │    max_tokens: 3000-6000 (根據段數動態)                  │  │
│  │    messages:                                             │  │
│  │      - system: SYSTEM_PROMPT (基礎 + 主題擴展)            │  │
│  │      - user: segmentPrompt (動態構建)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、Prompt 注入位置詳解

### 2.1 System Prompt 注入

| 位置 | 檔案 | 注入方式 |
|------|------|----------|
| **基礎 System Prompt** | `segment/system_prompt.ts` | 靜態定義，直接 import |
| **主題擴展** | `StoryOutput.tsx` | `SYSTEM_PROMPT + theme.systemPromptAddon` |
| **用戶記憶** | `generate-story/route.ts` | 異步注入用戶偏好到 `enrichedSystemPrompt` |

### 2.2 User Prompt 注入

| 模式 | 位置 | 構建方式 |
|------|------|----------|
| **單段生成** | `StoryOutput.tsx buildPrompt()` | 動態構建，包含故事起點、題材、角色 |
| **分段生成-第1段** | `segment/route.ts` | 從故事開頭 + 大綱場景資訊 |
| **分段生成-第2+段** | `segment/route.ts` | 前段風格樣本 + 上文銜接 + 動態上下文 |
| **續寫模式** | `StoryOutput.tsx buildPrompt()` | 提取前1800字 + 風格樣本 + 角色鎖定 |

---

## 三、System Prompt 完整內容

**檔案位置**: `src/app/api/story/segment/system_prompt.ts`

完整內容見原始檔案，主要包含：
- 角色定位：頂級中文小黃文作家
- 生成鐵律（10+ 條格式與內容規範）
- 輸出規則（禁止思考、標記、額外說明）

---

## 四、User Prompt 構建邏輯

### 4.1 分段生成 User Prompt（segment/route.ts）

**第1段：**
```
【任務】繼續以下故事開頭，完成第 1 段的精彩敘事。

【故事開頭】
${story_start}

【本段大綱】
場景：${outline.setting}
核心事件：${outline.key_event}
情緒基調：${outline.mood}
涉及角色：${outline.characters_involved.join('、')}

【角色卡】
${characters}
```

**第2+段：**
```
【任務】承接前文，自然流暢地寫作第 ${scene_index}/${total_scenes} 段。

【前文輪廓】
角色狀態：${dynamic_context.characters}
關係發展：${dynamic_context.relationships}
關鍵道具：${dynamic_context.key_items}

【風格樣本】（前文中段，維持風格一致）
${previousMid}

【上文銜接】（直接接續此處）
${previousEnding}
```

**通用後綴（所有分段）：**
```
【本段大綱】
場景：${outline.setting}
核心事件：${outline.key_event}
情緒基調：${outline.mood}
涉及角色：${outline.characters_involved.join('、')}

【寫作要求】
1. 字數：2300-2500 字（嚴格遵守，不可超過）
2. 語言：繁體中文
3. 風格：流暢自然，有畫面感
4. 類型：一般小說
5. 從故事開頭自然延續，不要重複開頭內容
6. 專注描寫「核心事件」
7. 保持情緒基調
8. 本段結尾要為下一段留下自然的銜接點
   (第3段特殊：製造懸念，讓讀者產生「必須繼續」的心理焦慮)
9. 可適當深入描寫角色心理與感官細節
10. 禁止輸出「第X段」或「Scene X」等標記

【輸出格式】
直接輸入故事正文，不要有任何前言後語。
```

### 4.2 單段生成 User Prompt（StoryOutput.tsx）

```
用戶設定：
- 故事起點：${storyInput}
- 題材：${selectedTopics}
- 角色：${characters}

【強制要求】字數：分 ${segmentCount} 段，每段約 ${wordsPerSegment} 字。
每段必須生成 ${wordsPerSegment-200}-${wordsPerSegment} 字，嚴格遵守，不可縮短。
```

### 4.3 續寫 User Prompt（StoryOutput.tsx）

```
【續寫任務 - 必須生成${wordsPerSegment}~${wordsPerSegment + 500}字】

【角色設定】（必須沿用，不可新增或遺漏）
${characterList}

【風格樣本】（必須保持相同文筆）
${styleSample.slice(0, 500)}

【前文結尾】（直接承接，嚴禁重複）
${ending}

【強制要求】
1. 字數：嚴格控制${wordsPerSegment}~${wordsPerSegment + 500}字之間
2. 承接：從上文結尾下一秒開始，自然過渡
3. 人物：只能使用【角色設定】中的角色
4. 劇情：延續前文情節發展
5. 風格：完全模仿【風格樣本】的文筆
6. 結構：必須包含對話、心理描寫、動作細節
7. 內容：延續前文的親密場景

只輸出故事正文，一個字都不要多。
```

---

## 五、關鍵技術參數

| 參數 | 值 | 說明 |
|------|-----|------|
| Model | `deepseek/deepseek-r1-0528` | OpenRouter |
| Temperature | 0.85 | 創造力與一致性平衡 |
| max_tokens | 3000-6000 | 根據段數動態調整 |
| 每段目標字數 | 2300-2500 | 約 300-350 tokens |
| 硬截斷限制 | 2800 字（分段）/ 3000 字（單段） | 防止超長 |

---

## 六、特殊邏輯：第3段懸念結尾

**位置**: `segment/route.ts` 第 63-68 行

```typescript
// 🎯 CRITICAL: 3rd segment cliffhanger logic for conversion
const isSegment3Of3 = (scene_index === 3 && total_scenes === 3);

// User Prompt 寫作要求第8條：
${isSegment3Of3 
  ? '本段結尾必須製造懸念：情節升溫、關鍵情節即將發生、角色關係將迎來轉折，讓讀者產生「必須繼續」的心理焦慮' 
  : (isLastScene ? '本段需要為故事畫上句點' : '本段結尾要為下一段留下自然的銜接點')
}
```

---

## 七、主題系統擴展

**位置**: `StoryOutput.tsx` buildPrompt()

```typescript
const theme = getThemeById(storyTheme)
const themeAddon = theme ? theme.systemPromptAddon : ''
const systemPrompt = OFFICIAL_SYSTEM_PROMPT + (themeAddon ? `\n\n【風格要求】${themeAddon}` : '')
```

主題擴展會動態附加到 System Prompt 後方。

---

## 八、清理與截斷流程

1. **生成後清理**: `cleanGeneratedContent()` - 移除 `<think>` 標籤
2. **純內容提取**: `extractPureStoryContent()` - 移除分段標記
3. **過渡清理**: `cleanSegmentTransition()` - 移除重複內容
4. **硬截斷**: `truncateToTarget()` - 按目標長度截斷到句子結束點
5. **重疊移除**: `removeOverlap()` - 移除與前段重複的內容

---

## 相關檔案清單

| 檔案 | 用途 |
|------|------|
| `src/app/api/story/segment/system_prompt.ts` | System Prompt 定義 |
| `src/app/api/story/segment/route.ts` | 分段生成 API |
| `src/app/api/generate-story/route.ts` | 主生成 API（含多段處理） |
| `src/components/StoryOutput.tsx` | 前端生成邏輯 + Prompt 構建 |
| `src/lib/content-cleaner.ts` | 內容清理工具 |
| `src/lib/themes.ts` | 主題系統定義 |
