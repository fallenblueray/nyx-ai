import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'moonshotai/kimi-k2.5';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

interface SceneOutline {
  scene_index: number;
  setting: string;
  key_event: string;
  mood: string;
  characters_involved: string[];
  word_count_target: number;
}

interface StoryOutline {
  scenes: SceneOutline[];
  overall_arc: string;
}

interface Character {
  name: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const { story_start, characters, genre, style, target_segments = 2 } = await request.json();

    // Validate target_segments: must be 1, 2, or 3
    const segmentCount = Math.min(Math.max(target_segments, 1), 3);
    
    if (!story_start || story_start.trim().length === 0) {
      return NextResponse.json(
        { error: '故事開頭不能為空' },
        { status: 400 }
      );
    }

    // Check authentication using JWT token
    const token = await getToken({ 
      req: request, 
      secret: NEXTAUTH_SECRET 
    });
    
    // Allow anonymous users (consistent with generate-story API)
    const isLoggedIn = !!token?.sub;

    // Build character context
    const characterContext = characters
      ?.map((c: Character) => `${c.name}：${c.description}`)
      .join('\n') || '';

    // Build scene descriptions for requested segment count
    let sceneDescriptions = '';
    const targetWordsPerScene = 2500;
    const totalWords = segmentCount * targetWordsPerScene;
    
    if (segmentCount === 1) {
      sceneDescriptions = `1. 只能生成 **1個場景**，完整講述整個故事
2. 單場景需要包含開端 → 發展 → 高潮 → 收尾 完整結構
3. 約2500字`;
    } else if (segmentCount === 2) {
      sceneDescriptions = `1. 只能生成 **2個場景**（scene_index: 1 和 2）
2. 第1場景：鋪墊發展，約2500字
3. 第2場景：高潮收尾，約2500字
4. 合計約5000字`;
    } else {
      // 3 segments
      sceneDescriptions = `1. 只能生成 **3個場景**（scene_index: 1、2、3）
2. 第1場景：開端鋪墊，約2500字
3. 第2場景：發展轉折，約2500字
4. 第3場景：高潮收尾，約2500字
5. 合計約7500字`;
    }

    const outlinePrompt = `【絕對重要】根據故事開頭生成大綱，必須嚴格遵守以下規則：

【開頭】${story_start.slice(0, 200)}

【角色】${characterContext || '自由創作'}

【強制規則 - 必須100%遵守】
${sceneDescriptions}

【場景結構要求】
只定義骨架（場景、核心事件、情緒），不寫具體細節

輸出格式（純 JSON，只輸出這個 JSON，不要有其他內容）：
${segmentCount === 1 ? `{
  "overall_arc": "故事主線一句話描述",
  "scenes": [
    {"scene_index": 1, "setting": "單場景完整描述", "key_event": "核心事件", "mood": "情緒基調", "characters_involved": ["角色A"], "word_count_target": 2500}
  ]
}` : segmentCount === 2 ? `{
  "overall_arc": "故事主線一句話描述",
  "scenes": [
    {"scene_index": 1, "setting": "場景1描述", "key_event": "核心事件1", "mood": "情緒基調", "characters_involved": ["角色A"], "word_count_target": 2500},
    {"scene_index": 2, "setting": "場景2描述", "key_event": "核心事件2", "mood": "情緒基調", "characters_involved": ["角色A"], "word_count_target": 2500}
  ]
}` : `{
  "overall_arc": "故事主線一句話描述",
  "scenes": [
    {"scene_index": 1, "setting": "場景1描述", "key_event": "核心事件1", "mood": "情緒基調", "characters_involved": ["角色A"], "word_count_target": 2500},
    {"scene_index": 2, "setting": "場景2描述", "key_event": "核心事件2", "mood": "情緒基調", "characters_involved": ["角色A"], "word_count_target": 2500},
    {"scene_index": 3, "setting": "場景3描述", "key_event": "核心事件3", "mood": "情緒基調", "characters_involved": ["角色A"], "word_count_target": 2500}
  ]
}`}

警告：必須且只能生成 **${segmentCount}個場景**。嚴格遵守字數分配。`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nyxai.app',
        'X-Title': 'NyxAI Story Generator'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: `你是專業的小說結構規劃師。你必須嚴格遵守用戶的規則，只能生成 ${segmentCount} 個場景，絕對不能多也不能少。` },
          { role: 'user', content: outlinePrompt }
        ],
        temperature: 0.5,
        max_tokens: 2000
      }),
      signal: AbortSignal.timeout(55000)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: '生成大綱失敗，請重試' },
        { status: 502 }
      );
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let outline: StoryOutline;
    try {
      outline = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      return NextResponse.json(
        { error: '大綱格式解析失敗' },
        { status: 500 }
      );
    }

    // Validate: must have requested number of scenes
    if (!outline.scenes || outline.scenes.length < segmentCount) {
      console.error('Invalid outline structure, scenes:', outline?.scenes, 'expected:', segmentCount);
      return NextResponse.json(
        { error: `大綱格式錯誤：需要${segmentCount}章` },
        { status: 500 }
      );
    }

    // SAFETY: Truncate to exactly requested scenes if AI generated more
    if (outline.scenes.length > segmentCount) {
      console.warn(`AI generated ${outline.scenes.length} scenes, truncating to ${segmentCount}`);
      outline.scenes = outline.scenes.slice(0, segmentCount);
    }

    // Ensure scene indices are correct
    outline.scenes = outline.scenes.map((scene, idx) => ({
      ...scene,
      scene_index: idx + 1,
      word_count_target: 2500
    }));

    return NextResponse.json({
      success: true,
      outline,
      metadata: {
        total_scenes: segmentCount,
        estimated_total_words: segmentCount * 2500,
      }
    });

  } catch (error) {
    console.error('Outline generation error:', error);
    return NextResponse.json(
      { error: '系統錯誤，請稍後重試' },
      { status: 500 }
    );
  }
}
