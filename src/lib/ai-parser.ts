/**
 * NyxAI Robust AI Output Parser
 * 专门处理 LLM 输出的格式不一致问题
 */

export interface ParseResult<T> {
  success: boolean
  data: T | null
  errors: ParseError[]
  confidence: number
}

export interface ParseError {
  field: string
  message: string
}

// 清理 AI 输出的各种格式问题
export function cleanAIOutput(text: string): string {
  return text
    .replace(/^\s*[*#>\-]+\s*/gm, '')  // 移除 markdown 标记
    .replace(/\*\*/g, '')               // 移除粗体
    .replace(/###\s*(={3,})/g, '$1')    // ### === → ===
    .replace(/={3,}/g, '===')           // 统一分隔符
    .replace(/\n{3,}/g, '\n\n')          // 压缩多余空行
    .trim()
}

// 解析单个角色
function parseCharacter(text: string): {
  name: string
  age: string
  role: string
  personality: string
  appearance: string
  desireStyle: string
  traits: string[]
} | null {
  // 支持繁体/简体/各种冒号
  const nameMatch = text.match(/名[稱称][:：\s]+([^\n]+?)(?:\n|$|年[齡龄])/)
  const ageMatch = text.match(/年[齡龄][:：\s]*(\d+)(?:[歲岁]|\s|$)/)
  const roleMatch = text.match(/身[份份][:：\s]+([^\n]+?)(?:\n|$|性[格格])/)
  const personalityMatch = text.match(/性[格格][:：\s]+([^\n]+?)(?:\n|$|外[貌贸])/)
  
  // 外貌可能是多行
  const appearanceMatch = text.match(/外[貌贸][:：\s]*([\s\S]+?)(?=欲望|特[質质]|\n\n|$)/)
  const desireStyleMatch = text.match(/欲望[風风]格[:：\s]*([\s\S]+?)(?=特[質质]|\n\n|$)/)
  const traitsMatch = text.match(/特[質质][:：\s]*([^\n]+)/)

  if (!nameMatch?.[1]) {
    return null
  }

  return {
    name: nameMatch[1].trim(),
    age: ageMatch?.[1]?.trim() || '',
    role: roleMatch?.[1]?.trim() || '',
    personality: personalityMatch?.[1]?.trim() || '',
    appearance: appearanceMatch?.[1]?.trim() || '',
    desireStyle: desireStyleMatch?.[1]?.trim() || '',
    traits: traitsMatch?.[1]?.split(/[、,，\s]+/).filter(t => t) || []
  }
}

// 主解析函数
export function parseCharacterPair(rawText: string): ParseResult<{
  character1: ReturnType<typeof parseCharacter>
  character2: ReturnType<typeof parseCharacter>
  relationship: string
  tension: string
}> {
  const errors: ParseError[] = []
  
  // 清理文本
  const text = cleanAIOutput(rawText)
  console.log('[AIParser] Cleaned text length:', text.length)

  // 尝试多种方式分割角色
  let char1Text = ''
  let char2Text = ''
  let relationText = ''

  // 方法1: 使用 ===角色1=== 分隔
  const char1Match = text.match(/==={0,3}\s*角色\s*1\s*={0,3}([\s\S]*?)(?:(?:==={0,3}\s*角色\s*2\s*={0,3})|(?:角色\s*2))/i)
  const char2Match = text.match(/==={0,3}\s*角色\s*2\s*={0,3}([\s\S]*?)(?:(?:==={0,3}\s*(?:關[係系]|人物關係|Relationship))|(?:關[係系][類類]型))/i)
  const relationMatch = text.match(/(?:==={0,3}\s*(?:關[係系]|人物關係|Relationship)\s*={0,3}|關[係系][類類]型[:：\s]*)([\s\S]*)/i)

  if (char1Match?.[1] && char2Match?.[1]) {
    char1Text = char1Match[1].trim()
    char2Text = char2Match[1].trim()
    relationText = relationMatch?.[1]?.trim() || ''
  } else {
    // 方法2: 使用「名稱」出现次数分割
    const nameMatches = [...text.matchAll(/名[稱称][:：\s]/g)]
    if (nameMatches.length >= 2) {
      const firstPos = nameMatches[0].index!
      const secondPos = nameMatches[1].index!
      
      // 找到第二个角色结束的位置（可能是第三个名称或关系部分）
      let thirdPos = text.length
      if (nameMatches.length >= 3) {
        thirdPos = nameMatches[2].index!
      } else {
        // 寻找关系关键词
        const relationPos = text.search(/關[係系]|核心張力/)
        if (relationPos > secondPos) {
          thirdPos = relationPos
        }
      }
      
      char1Text = text.slice(firstPos, secondPos).trim()
      char2Text = text.slice(secondPos, thirdPos).trim()
      relationText = thirdPos < text.length ? text.slice(thirdPos).trim() : ''
    } else {
      errors.push({ field: 'split', message: '无法分割角色文本' })
    }
  }

  console.log('[AIParser] Split lengths:', { 
    c1: char1Text?.length || 0, 
    c2: char2Text?.length || 0, 
    rel: relationText?.length || 0 
  })

  // 解析角色
  const character1 = parseCharacter(char1Text)
  const character2 = parseCharacter(char2Text)

  if (!character1) {
    errors.push({ field: 'character1', message: '无法解析角色1' })
  }
  if (!character2) {
    errors.push({ field: 'character2', message: '无法解析角色2' })
  }

  // 解析关系
  const relationshipMatch = relationText.match(/關[係系][類類]型[:：\s]*([^\n]+)/)
  const tensionMatch = relationText.match(/核心[張张]力[:：\s]*(.+)/)

  const data = {
    character1,
    character2,
    relationship: relationshipMatch?.[1]?.trim() || '',
    tension: tensionMatch?.[1]?.trim() || ''
  }

  // 计算信心度
  let confidence = 0
  if (character1?.name) confidence += 0.2
  if (character1?.age) confidence += 0.1
  if (character1?.role) confidence += 0.1
  if (character2?.name) confidence += 0.2
  if (character2?.age) confidence += 0.1
  if (character2?.role) confidence += 0.1
  if (data.relationship) confidence += 0.1
  if (data.tension) confidence += 0.1

  return {
    success: errors.length === 0 && character1 !== null && character2 !== null,
    data,
    errors,
    confidence
  }
}

// 格式化供前端使用
export function formatCharacterForDisplay(character: NonNullable<ReturnType<typeof parseCharacter>>) {
  return {
    name: character.name,
    description: `${character.age}歲 · ${character.role}`,
    traits: character.traits,
    data: {
      age: character.age,
      role: character.role,
      personality: character.personality,
      appearance: character.appearance,
      desireStyle: character.desireStyle
    }
  }
}
