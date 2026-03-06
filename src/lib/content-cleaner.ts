/**
 * Content Cleaner - 內容淨化器
 * 
 * 移除 AI 思考內容、分段標記、亂碼
 */

// DeepSeek R1 思考內容標記 (不使用 's' flag，改用替代方案)
const THINK_PATTERNS = [
  /<think>[\s\S]*?<\/think>/gi,     // <think>...</think>
  /【思考[\s\S]*?】/gi,               // 【思考...】
  /\[思考[\s\S]*?\]/gi,               // [思考...]
  /\(思考[\s\S]*?\)/gi,               // (思考...)
];

// 分段標記模式
const SEGMENT_MARKERS = [
  /^第[一二三四五六七八九十\d]+[段幕場章].*?\n+/gim,
  /^(?:Scene|Segment|Chapter|Part)\s*[\d一二三四五六七八九十]+.*?\n+/gim,
  /^===+.*?===+\n+/gm,
  /^---+.*?---+\n+/gm,
  /^\[.*?第[一二三四五六七八九十\d]+段.*?\]\n+/gm,
  /^\([^)]*第[一二三四五六七八九十\d]+段[^)]*\)\n+/gm,
];

/**
 * 清理 AI 生成內容
 */
export function cleanGeneratedContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let cleaned = content;

  // 1. 移除思考內容
  for (const pattern of THINK_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 2. 移除分段標記
  for (const pattern of SEGMENT_MARKERS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 3. 移除亂碼字符
  cleaned = cleaned.replace(/[\uFFFD�\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // 4. 修復明顯重複（50字以上重複3次）
  cleaned = cleaned.replace(/([\s\S]{50,})\1{2,}/gi, '$1');

  // 5. 標準化空白
  cleaned = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\u3000\u2000-\u200B]/g, ' ');

  // 6. 確保段落之間有空行
  const paragraphs = cleaned.split(/\n+/);
  cleaned = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .join('\n\n');

  return cleaned.trim();
}

/**
 * 清理段間過渡內容
 */
export function cleanSegmentTransition(content: string): string {
  if (!content) return '';

  let cleaned = content;

  // 移除常見的段間標記
  const transitionPatterns = [
    /.*?繼續.*?(?:故事|劇情|下文).*?[：:]\n*/gi,
    /.*?承接.*?(?:上文|前文|之前).*?[：:]\n*/gi,
    /第[一二三四五六七八九十\d]+段[：:]?\n+/gi,
    /\n+.*?繼續.*?\n+/gi,
    /\n+.*?以下是.*?\n+/gi,
  ];

  for (const pattern of transitionPatterns) {
    cleaned = cleaned.replace(pattern, '\n\n');
  }

  return cleaned.trim();
}

/**
 * 檢測內容是否有效
 */
export function isValidContent(content: string): boolean {
  if (!content || content.length < 100) {
    return false;
  }

  // 檢查亂碼比例
  const garbledCount = (content.match(/[\uFFFD�\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
  if (garbledCount / content.length > 0.05) {
    return false;
  }

  // 檢查思考內容殘留
  if (/<think>|<\/think>|【思考|思考】/.test(content)) {
    return false;
  }

  return true;
}

/**
 * 提取純故事內容（強力清理）
 */
export function extractPureStoryContent(rawContent: string): string {
  let content = cleanGeneratedContent(rawContent);
  
  // 移除任何非故事內容的行
  const lines = content.split('\n');
  const storyLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳過明顯的非內容行
    if (
      (trimmed.startsWith('【') && trimmed.endsWith('】')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('(') && trimmed.endsWith(')')) ||
      /^[（(【\[].*?[）)】\]]$/.test(trimmed) ||
      /^(?:註解|備註|注意|提示|Note|PS)/.test(trimmed)
    ) {
      continue;
    }
    
    storyLines.push(line);
  }
  
  content = storyLines.join('\n');
  return content.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * 修復段落連接問題
 */
export function fixParagraphConnections(content: string): string {
  const fixed = content.replace(/([^。！？\n])\n([^\n])/g, '$1\n\n$2');
  
  const paragraphs = fixed.split('\n\n');
  const brokenParagraphs: string[] = [];
  
  for (const para of paragraphs) {
    if (para.length > 300 && !para.includes('\n')) {
      const broken = para.replace(/([。！？])([^\n])/g, '$1\n$2');
      brokenParagraphs.push(broken);
    } else {
      brokenParagraphs.push(para);
    }
  }
  
  return brokenParagraphs.join('\n\n');
}

export default {
  cleanGeneratedContent,
  cleanSegmentTransition,
  isValidContent,
  extractPureStoryContent,
  fixParagraphConnections,
};