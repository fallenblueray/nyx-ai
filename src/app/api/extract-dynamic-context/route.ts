import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'moonshotai/kimi-k2.5';

export async function POST(request: NextRequest) {
  try {
    const { segment, existingCharacters = [] } = await request.json();

    if (!segment || segment.length < 100) {
      return NextResponse.json({
        characters: [],
        relationships: [],
        keyItems: []
      });
    }

    const prompt = `分析以下故事段落，提取關鍵上下文信息。

【故事段落】
${segment.slice(0, 2000)}

【已存在的角色】
${existingCharacters.join('、') || '無'}

【分析要求】
1. 找出所有出現的角色，標記他們的情緒狀態（如：憤怒、喜悅、焦慮、平靜）
2. 標記哪些角色是「新出現的」（不在「已存在的角色」列表中）
3. 提取角色之間的關係變化（如：「A 和 B 發生爭執」、「C 對 D 產生好感」）
4. 提取關鍵道具或線索（如：一把槍、一封信、某個秘密）

【輸出格式】
純 JSON，不要有 markdown：
{
  "characters": [
    {"name": "角色名", "mood": "情緒狀態", "status": "當前狀態簡述"}
  ],
  "relationships": ["關係變化描述1", "關係變化描述2"],
  "keyItems": ["道具1", "道具2"]
}`;

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
          { role: 'system', content: '你是專業的文學分析師，擅長提取故事中的角色動態和情節發展。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        characters: [],
        relationships: [],
        keyItems: []
      });
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.warn('Dynamic context JSON parse failed:', parseError);
      return NextResponse.json({
        characters: [],
        relationships: [],
        keyItems: []
      });
    }

    return NextResponse.json({
      characters: result.characters || [],
      relationships: result.relationships || [],
      keyItems: result.keyItems || []
    });

  } catch (error) {
    console.error('Dynamic context extraction error:', error);
    return NextResponse.json({
      characters: [],
      relationships: [],
      keyItems: []
    });
  }
}
