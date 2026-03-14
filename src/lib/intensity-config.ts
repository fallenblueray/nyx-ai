// 刺激度配置與工具函數

// 刺激度 1-10 的詳細描述映射
export const INTENSITY_DESCRIPTIONS: Record<number, { 
  label: string; 
  shortDesc: string;
  promptModifier: string;
  color: string;
}> = {
  1: {
    label: "純愛",
    shortDesc: "含蓄委婉，情感為主",
    promptModifier: "極度含蓄委婉，以情感交流和心理描寫為主，僅有輕微的曖昧暗示，完全無任何露骨或身體親密描寫，如同純愛電影般的清新風格",
    color: "from-pink-400 to-rose-300",
  },
  2: {
    label: "清新",
    shortDesc: "含蓄婉轉，氣氛營造",
    promptModifier: "含蓄婉轉，以氣氛營造和情感鋪墊為主，僅有極少數含蓄的親密暗示，用詞優美詩意，避免任何直白的身體描寫",
    color: "from-pink-400 to-purple-300",
  },
  3: {
    label: "溫柔",
    shortDesc: "輕度曖昧，情感鋪墊",
    promptModifier: "輕度曖昧，側重情感鋪墊和心靈交流，親密場景使用隱晦詩意描寫，著重氛圍營造而非具體行為",
    color: "from-purple-400 to-indigo-300",
  },
  4: {
    label: "浪漫",
    shortDesc: "溫和浪漫，適度親密",
    promptModifier: "溫和浪漫，有適度的親密描寫但用詞優雅含蓄，平衡情感深度與身體接觸，節奏緩慢優雅",
    color: "from-purple-400 to-blue-300",
  },
  5: {
    label: "均衡",
    shortDesc: "中等強度，平衡描寫",
    promptModifier: "中等強度，親密場景描寫具體但不過度，平衡情感與身體描寫，節奏適中自然流暢",
    color: "from-indigo-400 to-cyan-300",
  },
  6: {
    label: "熱烈",
    shortDesc: "較為大膽，節奏較快",
    promptModifier: "較為大膽，親密場景描寫較為詳細具體，身體感受描述增加，節奏加快但仍保持一定鋪墊",
    color: "from-blue-400 to-teal-300",
  },
  7: {
    label: "激情",
    shortDesc: "高度熱烈，場景頻繁",
    promptModifier: "高度熱烈，親密場景頻繁且描寫具體直白，感官體驗描寫豐富，節奏較快場景轉換流暢",
    color: "from-teal-400 to-green-300",
  },
  8: {
    label: "激烈",
    shortDesc: "非常激烈，直白描寫",
    promptModifier: "非常激烈，高強度親密場景為主，使用直白的感官描寫和身體細節，情節急促轉折多",
    color: "from-green-400 to-yellow-300",
  },
  9: {
    label: "狂野",
    shortDesc: "極度激烈，感官主導",
    promptModifier: "極度激烈親密互動，身體體驗的詳細直白描寫佔主導，節奏急促刺激，場景多變",
    color: "from-yellow-400 to-orange-300",
  },
  10: {
    label: "極限",
    shortDesc: "最大化強度，重口味",
    promptModifier: "最大化強度處理，重口味特殊偏好場景，極限感官描寫，節奏極快場景跳躍，各種邊緣題材皆可呈現",
    color: "from-orange-400 to-red-400",
  },
};

// 獲取刺激度描述
export function getIntensityDescription(level: number) {
  return INTENSITY_DESCRIPTIONS[level] || INTENSITY_DESCRIPTIONS[5];
}

// 獲取刺激度顯示標籤
export function getIntensityLabel(level: number): string {
  return getIntensityDescription(level).label;
}

// 獲取用於 Prompt 的修飾符
export function getIntensityModifier(level: number): string {
  return getIntensityDescription(level).promptModifier;
}

// 獲取刺激度顏色 (for CSS gradient)
export function getIntensityColor(level: number): string {
  return getIntensityDescription(level).color;
}

// 默認刺激度
export const DEFAULT_INTENSITY = 5;

// 刺激度範圍驗證
export function validateIntensity(level: number): number {
  return Math.max(1, Math.min(10, Math.round(level)));
}

// 從模板 pace + intensity 計算默認刺激度
export function calculateIntensityFromTemplate(
  pace: 'slow' | 'medium' | 'fast',
  intensity: 'mild' | 'moderate' | 'intense'
): number {
  const paceMap = { slow: 3, medium: 5, fast: 7 };
  const intensityMap = { mild: 3, moderate: 6, intense: 9 };
  
  const paceValue = paceMap[pace] || 5;
  const intensityValue = intensityMap[intensity] || 6;
  
  // 取平均並限制在 1-10
  return Math.round((paceValue + intensityValue) / 2);
}
