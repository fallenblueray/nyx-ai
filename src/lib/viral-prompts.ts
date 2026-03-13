// 病毒級題材池 - 專為社交傳播設計

export interface ViralPrompt {
  character: string;    // 人物/題材
  scene: string;        // 場景
  opening: string;      // 開場白（懸念）
  tags: string[];       // 標籤
  intensity: number;    // 刺激程度 1-10
}

// 人物題材池
const CHARACTERS = [
  { name: "學妹", tags: ["#校園", "#純愛"], intensity: 6 },
  { name: "女老師", tags: ["#師生", "#禁忌"], intensity: 8 },
  { name: "女上司", tags: ["#職場", "#權力"], intensity: 7 },
  { name: "青梅竹馬", tags: ["#重逢", "#情感"], intensity: 5 },
  { name: "女同事", tags: ["#職場", "#日常"], intensity: 6 },
  { name: "室友", tags: ["#同居", "#日常"], intensity: 7 },
  { name: "空姐", tags: ["#制服", "#旅途"], intensity: 7 },
  { name: "醫生", tags: ["#制服", "#專業"], intensity: 6 },
  { name: "護士", tags: ["#制服", "#照顧"], intensity: 7 },
  { name: "人妻", tags: ["#禁忌", "#NTR"], intensity: 9 },
  { name: "前女友", tags: ["#重逢", "#回憶"], intensity: 6 },
  { name: "家教", tags: ["#師生", "#私密"], intensity: 7 },
  { name: "秘書", tags: ["#職場", "#服從"], intensity: 7 },
  { name: "模特", tags: ["#藝術", "#誘惑"], intensity: 7 },
  { name: "鄰居", tags: ["#日常", "#偶遇"], intensity: 6 },
];

// 場景池
const SCENES = [
  { name: "深夜辦公室", atmosphere: "寂靜,只有兩個人", intensity: 7 },
  { name: "補習教室", atmosphere: "私密,只有師生", intensity: 6 },
  { name: "酒店房間", atmosphere: "封閉,陌生環境", intensity: 8 },
  { name: "停電宿舍", atmosphere: "黑暗,緊張", intensity: 7 },
  { name: "出差酒店", atmosphere: "陌生城市,孤獨", intensity: 7 },
  { name: "電梯", atmosphere: "密閉,短暫獨處", intensity: 6 },
  { name: "社團教室", atmosphere: "放學後,只有兩人", intensity: 6 },
  { name: "更衣室", atmosphere: "私密,脆弱", intensity: 8 },
  { name: "泳池", atmosphere: "清涼,身體接近", intensity: 7 },
  { name: "雨夜車內", atmosphere: "封閉,暧昧", intensity: 7 },
  { name: "溫泉旅館", atmosphere: "放鬆,坦誠相見", intensity: 8 },
  { name: "醫院病房", atmosphere: "脆弱,照顧", intensity: 6 },
];

// 開場白池（懸念型）
const OPENINGS = [
  "她突然鎖上門，轉身看著我。",
  "她靠得很近，我能聞到她身上的香水味。",
  "她說了一句讓我無法理解的話。",
  "她今天的穿著和往常完全不同。",
  "房間裡突然安靜下來，只剩下我們的呼吸聲。",
  "她递給我一杯水，手指有意無意地碰觸我的手。",
  "燈光突然熄滅，我感覺她向我靠近。",
  "她的眼神和昨天不一樣了。",
  "門被反鎖的那一刻，我才意識到事情不對。",
  "她解開了第一顆扣子，說：『你不熱嗎？』",
  "電梯卡在半空中，她笑了。",
  "雨聲很大，但我聽不清她在說什麼。",
  "她突然抓住我的手，放在她的...",
  "『學長，你還記得那天嗎？』",
  "燈光下，她的臉紅得不太正常。",
];

// 生成隨機組合
export function generateRandomPrompt(): ViralPrompt {
  const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  const scene = SCENES[Math.floor(Math.random() * SCENES.length)];
  const opening = OPENINGS[Math.floor(Math.random() * OPENINGS.length)];
  
  return {
    character: character.name,
    scene: scene.name,
    opening: opening,
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
  
  for (const char of CHARACTERS) {
    for (const scene of SCENES) {
      const intensity = Math.round((char.intensity + scene.intensity) / 2);
      if (intensity >= minIntensity) {
        for (const opening of OPENINGS.slice(0, 3)) {
          prompts.push({
            character: char.name,
            scene: scene.name,
            opening,
            tags: char.tags,
            intensity,
          });
        }
      }
    }
  }
  
  return prompts;
}
