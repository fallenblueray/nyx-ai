/**
 * NyxAI 故事風格主題系統
 * 基於 theme-factory 設計模式
 */

export interface StoryTheme {
  id: string
  name: string
  nameZh: string
  description: string
  colorPalette: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    gradient: string
  }
  writingStyle: {
    tone: string
    pacing: 'slow' | 'moderate' | 'fast'
    vocabulary: 'poetic' | 'direct' | 'explicit' | 'mixed'
    atmosphere: string
    intensity: 1 | 2 | 3 | 4 | 5 // 1=含蓄, 5=露骨
  }
  systemPromptAddon: string
  icon: string // Lucide icon name
}

export const storyThemes: StoryTheme[] = [
  {
    id: 'midnight-passion',
    name: 'Midnight Passion',
    nameZh: '午夜激情',
    description: '深沉而充滿激情，神秘的午夜氛圍',
    colorPalette: {
      primary: '#1E2761',
      secondary: '#CADCFC',
      accent: '#d97757',
      background: '#0f172a',
      text: '#f8fafc',
      gradient: 'linear-gradient(135deg, #1E2761 0%, #3b82f6 50%, #7c3aed 100%)'
    },
    writingStyle: {
      tone: '深沉富有詩意，情節走向有張力，描寫細膩而有層次感',
      pacing: 'moderate',
      vocabulary: 'poetic',
      atmosphere: '神秘的午夜氛圍，月光下的親密',
      intensity: 3
    },
    systemPromptAddon: '文筆要深沉富有詩意，多使用隱喻和象徵，情節走向要有張力，人物內心描寫要細膩而有層次感。場景營造神秘的午夜氛圍，月光下的親密時刻。',
    icon: 'Moon'
  },
  {
    id: 'cherry-romance',
    name: 'Cherry Romance',
    nameZh: '櫻桃浪漫',
    description: '甜蜜溫柔，如櫻花般純美的愛情',
    colorPalette: {
      primary: '#990011',
      secondary: '#FCF6F5',
      accent: '#F96167',
      background: '#fff5f5',
      text: '#1f2937',
      gradient: 'linear-gradient(135deg, #990011 0%, #F96167 50%, #F9E795 100%)'
    },
    writingStyle: {
      tone: '甜蜜溫柔，如櫻花般純美的愛情故事',
      pacing: 'slow',
      vocabulary: 'poetic',
      atmosphere: '春日暖陽，花辫飛舞的浪漫',
      intensity: 2
    },
    systemPromptAddon: '文筆要甜蜜溫柔，多描寫情感交流和心動瞬間，如櫻花般純美的愛情故事。場景營造春日暖陽，花辫飛舞的浪漫氛圍。',
    icon: 'Heart'
  },
  {
    id: 'ocean-erotica',
    name: 'Ocean Erotica',
    nameZh: '海洋情色',
    description: '冷豔神秘，如深海般的慾望探索',
    colorPalette: {
      primary: '#065A82',
      secondary: '#1C7293',
      accent: '#02C39A',
      background: '#0c4a6e',
      text: '#e0f2fe',
      gradient: 'linear-gradient(180deg, #065A82 0%, #028090 50%, #02C39A 100%)'
    },
    writingStyle: {
      tone: '冷豔神秘，如深海般的慾望探索',
      pacing: 'moderate',
      vocabulary: 'explicit',
      atmosphere: '深海般的神秘與未知',
      intensity: 4
    },
    systemPromptAddon: '文筆要冷豔神秘，多使用海洋相關的隱喻，描寫要深入到感官層面。場景營造深海般的神秘與未知感，探索慾望的深處。',
    icon: 'Waves'
  },
  {
    id: 'forest-fantasy',
    name: 'Forest Fantasy',
    nameZh: '森林奇幻',
    description: '原始自然，如森林深處的野性呼喚',
    colorPalette: {
      primary: '#2C5F2D',
      secondary: '#97BC62',
      accent: '#D4E157',
      background: '#14532d',
      text: '#ecfccb',
      gradient: 'linear-gradient(135deg, #2C5F2D 0%, #4ade80 50%, #97BC62 100%)'
    },
    writingStyle: {
      tone: '原始自然，如森林深處的野性呼喚',
      pacing: 'fast',
      vocabulary: 'direct',
      atmosphere: '原始森林的神秘與野性',
      intensity: 4
    },
    systemPromptAddon: '文筆要原始直接，充滿生命力，多描寫大自然的元素融入親密場景。場景營造原始森林的神秘與野性，月光穿過樹葉的斑孀。',
    icon: 'TreePine'
  },
  {
    id: 'tech-domination',
    name: 'Tech Domination',
    nameZh: '科技支配',
    description: '科幻未來，冰冷科技與熱烈情感的碰撞',
    colorPalette: {
      primary: '#36454F',
      secondary: '#00A896',
      accent: '#02C39A',
      background: '#111827',
      text: '#22d3ee',
      gradient: 'linear-gradient(135deg, #36454F 0%, #0891b2 50%, #02C39A 100%)'
    },
    writingStyle: {
      tone: '科幻未來，冰冷科技與熱烈情感的碰撞',
      pacing: 'moderate',
      vocabulary: 'mixed',
      atmosphere: '高科技實驗室或太空站的冷峻',
      intensity: 3
    },
    systemPromptAddon: '文筆要有科幻感，適當融入科技元素和未來設定，冰冷科技感與熱烈情感形成對比。場景營造高科技實驗室或太空站的冷峻氛圍，金屬與玻璃的反光。',
    icon: 'Cpu'
  },
  {
    id: 'berry-seduction',
    name: 'Berry Seduction',
    nameZh: '莓果誘惑',
    description: '甜美誘人，如初夏果實的成熟慾望',
    colorPalette: {
      primary: '#6D2E46',
      secondary: '#A26769',
      accent: '#ECE2D0',
      background: '#fce7f3',
      text: '#831843',
      gradient: 'linear-gradient(135deg, #6D2E46 0%, #db2777 50%, #f9a8d4 100%)'
    },
    writingStyle: {
      tone: '甜美誘人，如初夏果實的成熟慾望',
      pacing: 'moderate',
      vocabulary: 'explicit',
      atmosphere: '甜美而誘人的果香氛圍',
      intensity: 3
    },
    systemPromptAddon: '文筆要甜美誘人，多使用水果、花辫等自然元素的隱喻，如初夏果實的成熟慾望。場景營造甜美而誘人的氛圍，可能是在花園或果園中。',
    icon: 'Cherry'
  },
  {
    id: 'golden-lust',
    name: 'Golden Lust',
    nameZh: '金色慾望',
    description: '奢華狂熱，如黃金般閃耀的激情',
    colorPalette: {
      primary: '#F96167',
      secondary: '#F9E795',
      accent: '#FFD700',
      background: '#fef3c7',
      text: '#78350f',
      gradient: 'linear-gradient(135deg, #F96167 0%, #F9E795 50%, #FFD700 100%)'
    },
    writingStyle: {
      tone: '奢華狂熱，如黃金般閃耀的激情',
      pacing: 'fast',
      vocabulary: 'explicit',
      atmosphere: '奢華宮殿或高級場所的華麗',
      intensity: 5
    },
    systemPromptAddon: '文筆要奢華狂熱，多使用金、光、熱等元素的描寫，如黃金般閃耀的激情。場景營造奢華宮殿或高級場所的華麗氛圍，水晶吊燈的光影。',
    icon: 'Crown'
  },
  {
    id: 'sage-calmness',
    name: 'Sage Calmness',
    nameZh: '禪意平靜',
    description: '寧靜禪意，如茶室般的從容親密',
    colorPalette: {
      primary: '#84B59F',
      secondary: '#69A297',
      accent: '#50808E',
      background: '#ecfdf5',
      text: '#064e3b',
      gradient: 'linear-gradient(135deg, #84B59F 0%, #34d399 50%, #69A297 100%)'
    },
    writingStyle: {
      tone: '寧靜禪意，如茶室般的從容親密',
      pacing: 'slow',
      vocabulary: 'poetic',
      atmosphere: '日式或中式茶室的寧靜',
      intensity: 1
    },
    systemPromptAddon: '文筆要寧靜禪意，節奏緩慢從容，多描寫細微的感受和氛圍。場景營造日式或中式茶室的寧靜，茶香繚繞，細雨綿綿的午後。',
    icon: 'Leaf'
  },
  {
    id: 'terracotta-heat',
    name: 'Terracotta Heat',
    nameZh: '陶土熱情',
    description: '原始熱烈，如沙漠艶陽的熾熱',
    colorPalette: {
      primary: '#B85042',
      secondary: '#E7E8D1',
      accent: '#A7BEAE',
      background: '#7c2d12',
      text: '#ffedd5',
      gradient: 'linear-gradient(135deg, #B85042 0%, #ea580c 50%, #fb923c 100%)'
    },
    writingStyle: {
      tone: '原始熱烈，如沙漠艶陽的熾熱',
      pacing: 'fast',
      vocabulary: 'direct',
      atmosphere: '沙漠或火山的熾熱原始',
      intensity: 5
    },
    systemPromptAddon: '文筆要原始熱烈，節奏快速直接，充滿力量感和熱度，如沙漠艶陽的熾熱。場景營造沙漠或火山的熾熱原始氛圍，汗水和熱浪的交織。',
    icon: 'Flame'
  },
  {
    id: 'teal-temptation',
    name: 'Teal Temptation',
    nameZh: '青色誘惑',
    description: '清新優雅，如青瓷般的精緻慾望',
    colorPalette: {
      primary: '#028090',
      secondary: '#00A896',
      accent: '#02C39A',
      background: '#ecfeff',
      text: '#0e7490',
      gradient: 'linear-gradient(135deg, #028090 0%, #06b6d4 50%, #22d3ee 100%)'
    },
    writingStyle: {
      tone: '清新優雅，如青瓷般的精緻慾望',
      pacing: 'moderate',
      vocabulary: 'mixed',
      atmosphere: '現代藝術空間或設計酒店的精緻',
      intensity: 3
    },
    systemPromptAddon: '文筆要清新優雅，多使用水、陶瓷、玻璃等元素的描寫，如青瓷般的精緻慾望。場景營造現代藝術空間或設計酒店的精緻氛圍，光影和材質的細膩。',
    icon: 'Gem'
  }
]

// 獲取主題
export function getThemeById(id: string): StoryTheme | undefined {
  return storyThemes.find(theme => theme.id === id)
}

// 獲取主題列表
export function getAllThemes(): StoryTheme[] {
  return storyThemes
}

// 獲取預設主題
export function getDefaultTheme(): StoryTheme {
  return storyThemes[0] // Midnight Passion as default
}

// 根據強度排序
export function getThemesByIntensity(intensity: number): StoryTheme[] {
  return storyThemes.filter(theme => theme.writingStyle.intensity === intensity)
}

// 根據節奏排序
export function getThemesByPacing(pacing: 'slow' | 'moderate' | 'fast'): StoryTheme[] {
  return storyThemes.filter(theme => theme.writingStyle.pacing === pacing)
}
