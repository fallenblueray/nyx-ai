import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createAdminClient } from '@/lib/supabase-admin';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'nvai/moonshotai/kimi-k2.5';

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

export async function POST(request: NextRequest) {
  try {
    const { story_start, characters, genre, style } = await request.json();

    if (!story_start || story_start.trim().length === 0) {
      return NextResponse.json(
        { error: '故事開頭不能為空' },
        { status: 400 }
      );
    }

    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    // Build character context
    const characterContext = characters
      ?.map((c: any) => `${c.name}：${c.description}`)
      .join('\n') || '';

    const outlinePrompt = `你是一位專業小說編輯。請根據以下故事開頭，生成一個三幕式（3 scenes）的隱形大綱。

【故事開頭】
${story_start}

【角色設定】
${characterContext || '無特定角色'}

【風格】
類型：${genre || '一般'}
文風：${style || '流暢自然'}

【輸出格式】
請輸出純 JSON，不要有任何 markdown 標記或其他文字：
{
  "overall_arc": "整體故事弧線簡述（30字內）",
  "scenes": [
    {
      "scene_index": 1,
      "setting": "場景設定（時間、地點、氛圍）",
      "key_event": "本段核心事件（必須發生的劇情點）",
      "mood": "情緒基調",
      "characters_involved": ["角色A", "角色B"],
      "word_count_target": 2000
    },
    {
      "scene_index": 2,
      "setting": "...",
      "key_event": "...",
      "mood": "...",
      "characters_involved": ["..."],
      "word_count_target": 2000
    },
    {
      "scene_index": 3,
      "setting": "...",
      "key_event": "...",
      "mood": "...",
      "characters_involved": ["..."],
      "word_count_target": 2000
    }
  ]
}

【重要規則】
1. 三段合計約 6000 字，每段 1800-2200 字
2. 段與段之間要有自然的劇情連貫，scene 2 要承接 scene 1，scene 3 要承接 scene 2
3. 不要寫出具體對話或細節描寫，只定義「骨架」
4. 場景描述要足夠具體，讓後續寫作時知道該發生什麼
5. 可以在後段引入新角色，但要標明為 NEW
6. 確保三段構成完整的故事起承轉合`;

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
          { role: 'system', content: '你是專業的小說結構規劃師，擅長設計緊湊的三幕式故事大綱。' },
          { role: 'user', content: outlinePrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
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
    const outline: StoryOutline = JSON.parse(data.choices[0].message.content);

    // Validate outline structure
    if (!outline.scenes || outline.scenes.length !== 3) {
      return NextResponse.json(
        { error: '大綱格式錯誤' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      outline,
      metadata: {
        total_scenes: 3,
        estimated_total_words: 6000,
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
