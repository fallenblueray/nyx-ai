// 病毒級題材池 - 專為社交傳播設計

export interface ViralPrompt {
  character: string;    // 人物/題材
  scene: string;        // 場景
  opening: string;      // 開場白（懸念）
  tags: string[];       // 標籤
  intensity: number;    // 刺激程度 1-10
}

export interface ViralCombination {
  character: string;
  scene: string;
  opening: { text: string; atmosphere: string };
  tags: string[];
  intensity: number;
  characterTrope: string;
  sceneTrope: string;
}

// 人物題材 - 帶標籤和原型
export const viralCharacters = [
  { name: "學妹", tags: ["#校園", "#純愛"], intensity: 6, trope: "senpai-kouhai" },
  { name: "女老師", tags: ["#師生", "#禁忌"], intensity: 8, trope: "teacher-student" },
  { name: "女上司", tags: ["#職場", "#權力"], intensity: 7, trope: "boss-subordinate" },
  { name: "青梅竹馬", tags: ["#重逢", "#情感"], intensity: 5, trope: "childhood-friend" },
  { name: "女同事", tags: ["#職場", "#日常"], intensity: 6, trope: "coworker" },
  { name: "室友", tags: ["#同居", "#日常"], intensity: 7, trope: "roommate" },
  { name: "空姐", tags: ["#制服", "#旅途"], intensity: 7, trope: "uniform" },
  { name: "醫生", tags: ["#制服", "#專業"], intensity: 6, trope: "uniform" },
  { name: "護士", tags: ["#制服", "#照顧"], intensity: 7, trope: "uniform" },
  { name: "人妻", tags: ["#禁忌", "#NTR"], intensity: 9, trope: "married" },
  { name: "前女友", tags: ["#重逢", "#回憶"], intensity: 6, trope: "ex-lover" },
  { name: "家教", tags: ["#師生", "#私密"], intensity: 7, trope: "tutor" },
  { name: "秘書", tags: ["#職場", "#服從"], intensity: 7, trope: "secretary" },
  { name: "模特", tags: ["#藝術", "#誘惑"], intensity: 7, trope: "model" },
  { name: "鄰居", tags: ["#日常", "#偶遇"], intensity: 6, trope: "neighbor" },
];

// 場景池 - 帶氛圍和強度
export const viralScenes = [
  { name: "深夜辦公室", atmosphere: "寂靜,只有兩個人", intensity: 7, trope: "office" },
  { name: "補習教室", atmosphere: "私密,只有師生", intensity: 6, trope: "classroom" },
  { name: "酒店房間", atmosphere: "封閉,陌生環境", intensity: 8, trope: "hotel" },
  { name: "停電宿舍", atmosphere: "黑暗,緊張", intensity: 7, trope: "dormitory" },
  { name: "出差酒店", atmosphere: "陌生城市,孤獨", intensity: 7, trope: "hotel" },
  { name: "電梯", atmosphere: "密閉,短暫獨處", intensity: 6, trope: "elevator" },
  { name: "社團教室", atmosphere: "放學後,只有兩人", intensity: 6, trope: "classroom" },
  { name: "更衣室", atmosphere: "私密,脆弱", intensity: 8, trope: "changing-room" },
  { name: "泳池", atmosphere: "清涼,身體接近", intensity: 7, trope: "pool" },
  { name: "雨夜車內", atmosphere: "封閉,暧昧", intensity: 7, trope: "car" },
  { name: "溫泉旅館", atmosphere: "放鬆,坦誠相見", intensity: 8, trope: "onsen" },
  { name: "醫院病房", atmosphere: "脆弱,照顧", intensity: 6, trope: "hospital" },
];

// 開場白池（懸念型）- 帶氛圍
export const viralOpenings = [
  { text: "她突然鎖上門，轉身看著我。", atmosphere: "緊張,控制" },
  { text: "她靠得很近，我能聞到她身上的香水味。", atmosphere: "暧昧,親密" },
  { text: "她說了一句讓我無法理解的話。", atmosphere: "懸疑,神秘" },
  { text: "她今天的穿著和往常完全不同。", atmosphere: "驚喜,誘惑" },
  { text: "房間裡突然安靜下來，只剩下我們的呼吸聲。", atmosphere: "緊張,亲實" },
  { text: "她遞給我一杯水，手指有意無意地碰觸我的手。", atmosphere: "暧昧,試探" },
  { text: "燈光突然熄滅，我感覺她向我靠近。", atmosphere: "緊張,親密" },
  { text: "她的眼神和昨天不一樣了。", atmosphere: "懸疑,情感" },
  { text: "門被反鎖的那一刻，我才意識到事情不對。", atmosphere: "緊張,危險" },
  { text: "她解開了第一顆扣子，說：『你不熱嗎？』", atmosphere: "誘惑,大胆" },
  { text: "電梯卡在半空中，她笑了。", atmosphere: "緊張,玩味" },
  { text: "雨聲很大，但我聽不清她在說什麼。", atmosphere: "浪漫,模糊" },
  { text: "她突然抓住我的手，放在她的...", atmosphere: "大胆,親密" },
  { text: "『學長，你還記得那天嗎？』", atmosphere: "回憶,情感" },
  { text: "燈光下，她的臉紅得不太正常。", atmosphere: "害羞,情感" },
];

// 熱門標籤池
export const viralTags = [
  "#校園", "#禁忌", "#職場", "#制服", "#純愛",
  "#懸疑", "#浪漫", "#NTR", "#重逢", "#同居"
];

// 獲取隨機標籤
export function getRandomTags(min: number = 2, max: number = 4): string[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...viralTags].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 計算刺激度
export function calculateIntensity(charTrope: string, sceneTrope: string): number {
  const intensityMap: Record<string, number> = {
    "teacher-student": 8,
    "married": 9,
    "boss-subordinate": 7,
    "uniform": 7,
    "hotel": 8,
    "changing-room": 8,
    "onsen": 8,
    "senpai-kouhai": 6,
    "childhood-friend": 5,
    "coworker": 6,
    "roommate": 7,
    "ex-lover": 6,
    "tutor": 7,
    "secretary": 7,
    "model": 7,
    "neighbor": 6,
    "elevator": 6,
    "classroom": 6,
    "dormitory": 7,
    "car": 7,
    "pool": 7,
    "hospital": 6,
  };

  const charIntensity = intensityMap[charTrope] || 5;
  const sceneIntensity = intensityMap[sceneTrope] || 5;

  return Math.round((charIntensity + sceneIntensity) / 2);
}

// 生成隨機組合（新 API）
export function generateViralCombination(): ViralCombination {
  const character = viralCharacters[Math.floor(Math.random() * viralCharacters.length)];
  const scene = viralScenes[Math.floor(Math.random() * viralScenes.length)];
  const opening = viralOpenings[Math.floor(Math.random() * viralOpenings.length)];
  const tags = getRandomTags(2, 4);
  const intensity = calculateIntensity(character.trope, scene.trope);

  return {
    character: character.name,
    scene: scene.name,
    opening,
    tags,
    intensity,
    characterTrope: character.trope,
    sceneTrope: scene.trope,
  };
}

// 兼容性：舊 API 保持不變
export function generateRandomPrompt(): ViralPrompt {
  const character = viralCharacters[Math.floor(Math.random() * viralCharacters.length)];
  const scene = viralScenes[Math.floor(Math.random() * viralScenes.length)];
  const opening = viralOpenings[Math.floor(Math.random() * viralOpenings.length)];

  return {
    character: character.name,
    scene: scene.name,
    opening: opening.text,
    tags: character.tags,
    intensity: Math.round((character.intensity + scene.intensity) / 2),
  };
}

// 生成完整的故事起點描述
export function generateStorySetup(prompt: ViralPrompt): string {
  return `${prompt.scene}，${prompt.opening}

${prompt.character}和我獨處一室，氣氛變得有些微妙...`;
}

// 獲取多個不重複的隨機組合
export function generateMultiplePrompts(count: number = 3): ViralPrompt[] {
  const prompts: ViralPrompt[] = [];
  const used = new Set<string>();

  while (prompts.length < count) {
    const prompt = generateRandomPrompt();
    const key = `${prompt.character}-${prompt.scene}`;

    if (!used.has(key)) {
      used.add(key);
      prompts.push(prompt);
    }
  }

  return prompts;
}

// 根據強度篩選
export function getPromptsByIntensity(minIntensity: number): ViralPrompt[] {
  const prompts: ViralPrompt[] = [];

  for (const char of viralCharacters) {
    for (const scene of viralScenes) {
      const intensity = Math.round((char.intensity + scene.intensity) / 2);
      if (intensity >= minIntensity) {
        const opening = viralOpenings[Math.floor(Math.random() * viralOpenings.length)];
        prompts.push({
          character: char.name,
          scene: scene.name,
          opening: opening.text,
          tags: char.tags,
          intensity,
        });
      }
    }
  }

  return prompts;
}
