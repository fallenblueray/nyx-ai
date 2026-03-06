import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createAdminClient } from '@/lib/supabase-admin';
import { SYSTEM_PROMPT } from './system_prompt';
import { cleanGeneratedContent, extractPureStoryContent } from '@/lib/content-cleaner';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'deepseek/deepseek-r1-0528';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

interface DynamicCharacter {
  name: string;
  description?: string;
  state?: string;
  mood?: string;
}

interface RequestCharacter {
  name: string;
  description: string;
}

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
    characters: DynamicCharacter[];
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
    const supabase = createAdminClient();
    const FREE_WORD_LIMIT = 8000;

    // ============================================================
    // 字數額度檢查
    // ============================================================
    let currentWordCount = 0;

    if (isLoggedIn) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("word_count")
        .eq("id", token.sub)
        .single();
      currentWordCount = profile?.word_count ?? 0;
    } else {
      // 從 header 獲取匿名 ID
      const anonymousId = request.headers.get('x-anonymous-id');
      if (anonymousId) {
        const { data: usage } = await supabase
          .from("anonymous_usage")
          .select("words_used, words_limit")
          .eq("anonymous_id", anonymousId)
          .maybeSingle();
        const wordsUsed = usage?.words_used ?? 0;
        const wordsLimit = usage?.words_limit ?? FREE_WORD_LIMIT;
        currentWordCount = Math.max(0, wordsLimit - wordsUsed);
      }
    }

    // 字數不足時禁止生成
    if (currentWordCount <= 0) {
      return NextResponse.json(
        { 
          error: '字數已用完，請充值或登入',
          errorType: isLoggedIn ? 'insufficient_words' : 'free_quota_exceeded'
        },
        { status: 403 }
      );
    }

    // Build prompt based on scene position
    const isFirstScene = scene_index === 1;
    const isLastScene = scene_index === total_scenes;
    
    // 🎯 CRITICAL: 3rd segment cliffhanger logic for conversion
    // When user selects 3 segments, scene 3 is NOT the true ending
    // It should end with rising tension to trigger 4th generation
    const isSegment3Of3 = (scene_index === 3 && total_scenes === 3);

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
${characters?.map((c: RequestCharacter) => `- ${c.name}：${c.description}`).join('\n') || '無特定角色'}`;
    } else {
      // Subsequent scenes: improved context injection
      const previousEnding = previous_segment?.slice(-400) || '';
      const previousMid = previous_segment?.slice(
        Math.max(0, Math.floor(previous_segment.length / 2) - 200),
        Math.floor(previous_segment.length / 2) + 200
      ) || '';
      
      segmentPrompt = `【任務】承接前文，自然流暢地寫作第 ${scene_index}/${total_scenes} 段。

【前文輪廓】
${dynamic_context ? `
角色狀態：${dynamic_context.characters?.map((c: DynamicCharacter) => `${c.name}(${c.mood || '情緒正常'})`).join('、') || '無'}
關係發展：${dynamic_context.relationships?.join('；') || '無重大變化'}
關鍵道具：${dynamic_context.key_items?.join('、') || dynamic_context.keyItems?.join('、') || '無'}
` : '無'}

【風格樣本】（前文中段，維持風格一致）
${previousMid}

【上文銜接】（直接接續此處）
${previousEnding}`;
    }

    // Common prompt suffix
    segmentPrompt += `

【本段大綱】
場景：${outline.setting}
核心事件：${outline.key_event}
情緒基調：${outline.mood}
涉及角色：${outline.characters_involved.join('、')}

【寫作要求】
1. 字數：2300-2500 字（嚴格遵守，不可超過）
2. 語言：${language}
3. 風格：${style || '流暢自然，有畫面感'}
4. 類型：${genre || '一般小說'}
5. ${isFirstScene ? '從故事開頭自然延續，不要重複開頭內容' : '承接前文結尾，自然過渡，不要重複前文'}
6. 專注描寫「${outline.key_event}」這個核心事件
7. 保持「${outline.mood}」的情緒基調
8. ${isSegment3Of3 ? '本段結尾必須製造懸念：情節升溫、關鍵情節即將發生、角色關係將迎來轉折，讓讀者產生「必須繼續」的心理焦慮' : (isLastScene ? '本段需要為故事畫上句點，給出滿意的結局或開放式餘韻' : '本段結尾要為下一段留下自然的銜接點')}
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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: segmentPrompt }
        ],
        temperature: 0.85,
        max_tokens: 4500
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
    const rawSegmentText = data.choices[0].message.content.trim();

    // 清理內容：移除 AI 思考內容和分段標記
    let segmentText = cleanGeneratedContent(rawSegmentText);
    segmentText = extractPureStoryContent(segmentText);

    // 硬截斷：確保不超過 2800 字（給 2500 目標留緩衝）
    const MAX_SEGMENT_LENGTH = 2800;
    if (segmentText.length > MAX_SEGMENT_LENGTH) {
      // 找目標長度附近的句子結束點
      const searchStart = Math.floor(MAX_SEGMENT_LENGTH * 0.85);
      const searchEnd = Math.min(segmentText.length, Math.floor(MAX_SEGMENT_LENGTH * 1.05));
      const searchRange = segmentText.slice(searchStart, searchEnd);
      
      // 找最近的自然斷點（。！？）
      const sentenceEnds: RegExpExecArray[] = [];
      const pattern = /[。！？][^」』）)]/g;
      let matchResult: RegExpExecArray | null;
      while ((matchResult = pattern.exec(searchRange)) !== null) {
        sentenceEnds.push(matchResult);
      }
      
      if (sentenceEnds.length > 0) {
        // 找最接近 2500 字的斷點
        const targetPos = 2500 - searchStart;
        const bestMatch = sentenceEnds.reduce((closest, match) => {
          const matchPos = (match.index ?? 0);
          const closestPos = (closest.index ?? 0);
          return Math.abs(matchPos - targetPos) < Math.abs(closestPos - targetPos) ? match : closest;
        });
        
        const cutPoint = searchStart + (bestMatch.index ?? 0) + 1;
        segmentText = segmentText.slice(0, cutPoint);
      } else {
        // 找不到句子結束，硬切
        segmentText = segmentText.slice(0, MAX_SEGMENT_LENGTH);
      }
    }

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
