import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createAdminClient } from '@/lib/supabase-admin';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'moonshotai/kimi-k2.5';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

interface SceneContext {
  scene_index: number;
  total_scenes: number;
  outline: {
    setting: string;
    key_event: string;
    mood: string;
    characters_involved: string[];
  };
  previous_segment?: string;
  dynamic_context?: {
    characters: any[];
    relationships: string[];
    key_items: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const {
      story_start,
      scene_context,
      characters,
      genre,
      style,
      language = '繁體中文'
    } = await request.json();

    if (!story_start || !scene_context) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const { scene_index, total_scenes, outline, previous_segment, dynamic_context } = scene_context;

    // Check authentication using JWT token
    const token = await getToken({ 
      req: request, 
      secret: NEXTAUTH_SECRET 
    });
    
    // Allow anonymous users (consistent with generate-story API)
    const isLoggedIn = !!token?.sub;

    // Build prompt based on scene position
    const isFirstScene = scene_index === 1;
    const isLastScene = scene_index === total_scenes;

    let segmentPrompt = '';

    if (isFirstScene) {
      // First scene: continue from story_start
      segmentPrompt = `【任務】繼續以下故事開頭，完成第 1 段的精彩敘事。

【故事開頭】
${story_start}

【本段大綱】
場景：${outline.setting}
核心事件：${outline.key_event}
情緒基調：${outline.mood}
涉及角色：${outline.characters_involved.join('、')}

【角色卡】
${characters?.map((c: any) => `- ${c.name}：${c.description}`).join('\n') || '無特定角色'}`;
    } else {
      // Subsequent scenes: continue from previous segment
      const previousEnding = previous_segment?.slice(-500) || '';
      
      segmentPrompt = `【任務】承接前文，自然流暢地寫作第 ${scene_index}/${total_scenes} 段。

【前文結尾】（最後約500字）
${previousEnding}

【動態上下文】
${dynamic_context ? `
角色狀態：${dynamic_context.characters.map((c: any) => `${c.name}(${c.mood || '情緒正常'})`).join('、')}
關係發展：${dynamic_context.relationships.join('；') || '無重大變化'}
關鍵道具：${dynamic_context.key_items.join('、') || '無'}
` : '無'}`;
    }

    // Common prompt suffix
    segmentPrompt += `

【本段大綱】
場景：${outline.setting}
核心事件：${outline.key_event}
情緒基調：${outline.mood}
涉及角色：${outline.characters_involved.join('、')}

【寫作要求】
1. 字數：1800-2200 字（約 3-4 個標準段落）
2. 語言：${language}
3. 風格：${style || '流暢自然，有畫面感'}
4. 類型：${genre || '一般小說'}
5. 
${isFirstScene ? '5. 從故事開頭自然延續，不要重複開頭內容' : '5. 承接前文結尾，自然過渡，不要重複前文'}
6. 專注描寫「${outline.key_event}」這個核心事件
7. 保持「${outline.mood}」的情緒基調
8. ${isLastScene ? '本段需要為故事畫上句點，給出滿意的結局或開放式餘韻' : '本段結尾要為下一段留下自然的銜接點'}
9. 可適當深入描寫角色心理與感官細節
10. 禁止輸出「第X段」或「Scene X」等標記，純故事內文即可

【輸出格式】
直接輸入故事正文，不要有任何前言後語。`; 

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
          { 
            role: 'system', 
            content: '你是專業小說家，擅長長篇敘事與細膩描寫。每次寫作都要保持風格一致、情節連貫。' 
          },
          { role: 'user', content: segmentPrompt }
        ],
        temperature: 0.85,
        max_tokens: 3500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: `生成第 ${scene_index} 段失敗，請重試` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const segmentText = data.choices[0].message.content.trim();

    // Validate output
    if (segmentText.length < 500) {
      return NextResponse.json(
        { error: '生成內容過短，請重試' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      segment: {
        text: segmentText,
        scene_index,
        total_scenes,
        word_count: segmentText.length
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Segment generation error:', error);
    return NextResponse.json(
      { error: '系統錯誤，請稍後重試' },
      { status: 500 }
    );
  }
}
