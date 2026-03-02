import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createAdminClient } from '@/lib/supabase-admin';

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

export async function POST(request: NextRequest) {
  try {
    const { story_start, characters, genre, style } = await request.json();

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
      ?.map((c: any) => `${c.name}：${c.description}`)
      .join('\n') || '';

    const outlinePrompt = `根據故事開頭生成三幕式大綱（純 JSON 輸出）：

【開頭】${story_start.slice(0, 200)}

【角色】${characterContext || '自由創作'}

輸出格式：
{
  "overall_arc": "故事主線",
  "scenes": [
    {"scene_index": 1, "setting": "場景1", "key_event": "事件1", "mood": "情緒", "characters_involved": ["角色A"], "word_count_target": 2000},
    {"scene_index": 2, "setting": "場景2", "key_event": "事件2", "mood": "情緒", "characters_involved": ["角色A"], "word_count_target": 2000},
    {"scene_index": 3, "setting": "場景3", "key_event": "事件3", "mood": "情緒", "characters_involved": ["角色A"], "word_count_target": 2000}
  ]
}

規則：三段合計約6000字，段間有連貫，只定義骨架不寫細節。`;

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
        max_tokens: 2500
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
