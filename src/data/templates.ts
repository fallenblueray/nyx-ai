/**
 * NyxAI 初始模板數據
 * Phase 1: 模板數據架構
 * 目標：上線版本 50 個模板
 */

import { Template, CategoryConfig } from '@/types/template';

// 重新導出類型
export type { Template, CategoryConfig };

// 分類配置
export const CATEGORY_CONFIG: CategoryConfig[] = [
  { id: 'classic', name: '經典', emoji: '💫', description: '初戀重逢、青梅竹馬', order: 1 },
  { id: 'campus', name: '校園', emoji: '🏫', description: '校花學姐、女老師', order: 2 },
  { id: 'mature', name: '人妻', emoji: '💋', description: '鄰居太太、寂寞少婦', order: 3 },
  { id: 'career', name: '職場', emoji: '💼', description: '女上司、女秘書', order: 4 },
  { id: 'taboo', name: '禁忌', emoji: '🔞', description: '年齡差、秘密戀情', order: 5 },
  { id: 'ntr', name: 'NTR', emoji: '⚡', description: '出軌、復仇、綠帽', order: 6 },
  { id: 'extreme', name: '高級', emoji: '👑', description: '特殊幻想、Premium', order: 7 },
];

// 初始模板數據
export const officialTemplates: Template[] = [
  // === 經典題材 (8個) ===
  {
    id: 'classic-001',
    slug: 'first-love-reunion',
    name: '初戀重逢',
    description: '多年後與初戀意外相遇，舊情復燃',
    category: 'classic',
    tags: ['初戀', '重逢', '情感', '舊情復燃'],
    promptBuilder: {
      baseScenario: '多年後在街頭偶遇初戀，她已經變得更加成熟迷人',
      writingStyle: '細膩情感描寫，注重心理變化，緩慢醞釀',
      atmosphere: '懷舊與曖昧交織，帶有淡淡的憂傷',
      pace: 'slow',
      intensity: 'moderate',
      perspective: 'first'
    },
        isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'classic-002',
    slug: 'childhood-sweetheart',
    name: '青梅竹馬',
    description: '從小一起長大的鄰家女孩，友情逐漸變質',
    category: 'classic',
    tags: ['青梅竹馬', '日久生情', '鄰家'],
    promptBuilder: {
      baseScenario: '從小一起長大的鄰家女孩，隨著年齡增長，關係發生微妙變化',
      writingStyle: '溫馨日常描寫，逐步展現情感變化',
      atmosphere: '青澀曖昧，帶有初戀的甜美',
      pace: 'slow',
      intensity: 'mild',
      perspective: 'first'
    },
        isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'classic-003',
    slug: 'reunion-after-years',
    name: '久別重逢',
    description: '多年未見的老同學聚會重逢',
    category: 'classic',
    tags: ['同學會', '重逢', '變化'],
    promptBuilder: {
      baseScenario: '多年未見的老同學聚會，曾經暗戀的對象如今更加耀眼',
      writingStyle: '對比今昔，注重眼神交流和氛圍營造',
      atmosphere: '懷念與心動交織，帶有競爭意味',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'classic-004',
    slug: 'friend-becomes-lover',
    name: '朋友變戀人',
    description: '多年異性好友，友情意外昇華',
    category: 'classic',
    tags: ['友情', '日久生情', '告白'],
    promptBuilder: {
      baseScenario: '多年異性好友，一次意外讓關係發生質變',
      writingStyle: '注重心理描寫，展現內心掙扎',
      atmosphere: '緊張曖昧，帶有罪惡感',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'classic-005',
    slug: 'online-love-meetup',
    name: '網戀奔現',
    description: '網友多年曖昧，終於線下見面',
    category: 'classic',
    tags: ['網戀', '奔現', '見面'],
    promptBuilder: {
      baseScenario: '網聊多年的網友終於約好見面，現實與想像有落差',
      writingStyle: '期待與緊張交織，注重場景描寫',
      atmosphere: '心跳加速，帶有冒險感',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'classic-006',
    slug: 'chance-encounter',
    name: '命運邂逅',
    description: '陌生人之間的命運相遇',
    category: 'classic',
    tags: ['邂逅', '命運', '陌生人'],
    promptBuilder: {
      baseScenario: '在不該相遇的地方相遇，卻產生奇妙吸引力',
      writingStyle: '電影感描寫，注重氛圍營造',
      atmosphere: '命中註定的浪漫，帶有懸念',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'classic-007',
    slug: 'secret-crush',
    name: '暗戀成真',
    description: '長期暗戀終於表白成功',
    category: 'classic',
    tags: ['暗戀', '表白', '單相思'],
    promptBuilder: {
      baseScenario: '長期暗戀某個人，終於找到機會表白',
      writingStyle: '內心戲豐富，情感細膩',
      atmosphere: '緊張期待，帶有夢幻感',
      pace: 'slow',
      intensity: 'mild',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'classic-008',
    slug: 'vacation-flirtation',
    name: '度假艳遇',
    description: '旅行中遇到的短暂浪漫',
    category: 'classic',
    tags: ['旅行', '艳遇', '短暂'],
    promptBuilder: {
      baseScenario: '在度假勝地遇到心動的陌生人，沒有負擔的短暫時光',
      writingStyle: '浪漫唯美，注重氛圍',
      atmosphere: '自由放鬆，帶有冒險感',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },

  // === 校園幻想 (10個) ===
  {
    id: 'campus-001',
    slug: 'school-belle-senior',
    name: '校花學姐',
    description: '被校花學姐主動搭讪，展開秘密關係',
    category: 'campus',
    tags: ['校花', '學姐', '校園', '被追求'],
    promptBuilder: {
      baseScenario: '被學校公認的校花學姐主動搭讪，原來她暗戀你已久',
      writingStyle: '校園戀愛氛圍，被動轉主動的快感',
      atmosphere: '心動緊張，帶有虛榮感',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
        isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'campus-002',
    slug: 'female-teacher-after-class',
    name: '女老師的補習課',
    description: '放學後被女老師單獨留下',
    category: 'campus',
    tags: ['老師', '師生', '補習'],
    promptBuilder: {
      baseScenario: '放學後被美麗的女老師單獨留下補課，氣氛逐漸變得曖昧',
      writingStyle: '禁忌感描寫，權力關係張力',
      atmosphere: '緊張曖昧，帶有背德感',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
        isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'campus-003',
    slug: 'dormitory-seduction',
    name: '宿舍誘惑',
    description: '室友不在，單獨與女同學相處',
    category: 'campus',
    tags: ['宿舍', '室友', '獨處'],
    promptBuilder: {
      baseScenario: '宿舍室友都出去了，只剩下你和一位女同學，氣氛逐漸變得微妙',
      writingStyle: '密室張力，孤男寡女的緊張感',
      atmosphere: '曖昧升溫，帶有試探',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'campus-004',
    slug: 'junior-girl-initiative',
    name: '學妹主動',
    description: '可愛學妹倒追學長',
    category: 'campus',
    tags: ['學妹', '倒追', '可愛'],
    promptBuilder: {
      baseScenario: '可愛的學妹主動接近，展開熱烈追求',
      writingStyle: '輕鬆甜蜜，女主動的快感',
      atmosphere: '甜寵戀愛，主動被動交換',
      pace: 'fast',
      intensity: 'moderate',
      perspective: 'first'
    },
        isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'campus-005',
    slug: 'class-monitor-secret',
    name: '班長的秘密',
    description: '品學兼優的班長不為人知的一面',
    category: 'campus',
    tags: ['班長', '反差', '秘密'],
    promptBuilder: {
      baseScenario: '平時一本正經的班長，私下卻有著不為人知的秘密',
      writingStyle: '反差感描寫，揭秘快感',
      atmosphere: '震驚意外，帶有獵奇',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'campus-006',
    slug: 'study-group-overnight',
    name: '熬夜自習',
    description: '一起熬夜複習考試，氣氛變質',
    category: 'campus',
    tags: ['自習', '熬夜', '考試'],
    promptBuilder: {
      baseScenario: '考試前夕一起熬夜複習，夜深人靜時氣氛變得不同',
      writingStyle: '疲憊與亢奮交織，環境暗示',
      atmosphere: '深夜曖昧，孤獨感拉近距離',
      pace: 'slow',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'campus-007',
    slug: 'sports-girl-attention',
    name: '體育女神',
    description: '運動會上的風雲人物',
    category: 'campus',
    tags: ['運動', '女神', '運動會'],
    promptBuilder: {
      baseScenario: '運動會上注意到的體育女神，沒想到她會主動接近',
      writingStyle: '活力氛圍，陽光性感',
      atmosphere: '熱血心動，帶有征服感',
      pace: 'fast',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'campus-008',
    slug: 'library-encounter',
    name: '圖書館偶遇',
    description: '圖書館的固定相遇，產生情愫',
    category: 'campus',
    tags: ['圖書館', '書香', '相遇'],
    promptBuilder: {
      baseScenario: '圖書館固定位置的她，漸漸產生情愫',
      writingStyle: '文藝氛圍，循序漸進',
      atmosphere: '書香曖昧，日久生情',
      pace: 'slow',
      intensity: 'mild',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'campus-009',
    slug: 'school-trip-hotel',
    name: '校外教學',
    description: '校外教學時的意外同房',
    category: 'campus',
    tags: ['校外教學', '同房', '旅行'],
    promptBuilder: {
      baseScenario: '校外教學分配房間時，意外和心儀的同學同房',
      writingStyle: '旅行氛圍，意外發展',
      atmosphere: '緊張期待，偷跑感',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'campus-010',
    slug: 'music-club-practice',
    name: '社團練習',
    description: '音樂社團的單獨練習時間',
    category: 'campus',
    tags: ['社團', '音樂', '練習'],
    promptBuilder: {
      baseScenario: '音樂社團練習結束後，剩下兩人獨處',
      writingStyle: '藝術氛圍，音樂節奏感',
      atmosphere: '浪漫曖昧，才華吸引',
      pace: 'slow',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },

  // === 人妻幻想 (10個) ===
  {
    id: 'mature-001',
    slug: 'lonely-neighbor',
    name: '寂寞鄰居',
    description: '隔壁美艷少婦丈夫長期出差，深夜敲門求助',
    category: 'mature',
    tags: ['鄰居', '人妻', '寂寞', '深夜'],
    promptBuilder: {
      baseScenario: '隔壁年輕貌美的鄰居，太太丈夫長期出差，一個深夜突然敲門',
      writingStyle: '寂寞氛圍，成熟魅力描寫',
      atmosphere: '深夜寂寞，孤男寡女',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
        isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'mature-002',
    slug: 'boss-wife',
    name: '上司妻子',
    description: '拜訪上司家時，與上司妻子獨處',
    category: 'mature',
    tags: ['上司', '妻子', '拜訪'],
    promptBuilder: {
      baseScenario: '拜訪上司家，上司臨時有事離開，只剩下和上司妻子獨處',
      writingStyle: '權力禁忌，成熟女性魅力',
      atmosphere: '緊張刺激，帶有背德感',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'mature-003',
    slug: 'friend-wife',
    name: '朋友老婆',
    description: '幫朋友照顧老婆，意外發生',
    category: 'mature',
    tags: ['朋友', '老婆', '照顧'],
    promptBuilder: {
      baseScenario: '朋友出差拜託照顧他老婆，日久生情',
      writingStyle: '友情背叛，禁忌快感',
      atmosphere: '愧疚與渴望交織',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'mature-004',
    slug: 'bored-housewife',
    name: '寂寞人妻',
    description: '全職太太的無聊日常',
    category: 'mature',
    tags: ['全職太太', '無聊', '寂寞'],
    promptBuilder: {
      baseScenario: '丈夫工作忙碌，全職太太獨守空閨，寂寞難耐',
      writingStyle: '寂寞氛圍，渴望描寫',
      atmosphere: '空虛孤獨，需要填補',
      pace: 'slow',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'mature-005',
    slug: 'divorced-beauty',
    name: '離婚少婦',
    description: '剛離婚的年輕美麗少婦',
    category: 'mature',
    tags: ['離婚', '少婦', '失婚'],
    promptBuilder: {
      baseScenario: '剛剛結束失敗婚姻的年輕少婦，重新開始新生活',
      writingStyle: '重新開始，釋放自我',
      atmosphere: '解脫與新生，帶有報復性',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'mature-006',
    slug: 'aunt-visits',
    name: '表姐來訪',
    description: '遠方表姐來家裡借住',
    category: 'mature',
    tags: ['表姐', '親戚', '借住'],
    promptBuilder: {
      baseScenario: '遠方親戚家的漂亮表姐來家裡借住幾天',
      writingStyle: '親戚關係，日久生情',
      atmosphere: '禁忌與好奇',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'mature-007',
    slug: 'wife-friend',
    name: '老婆閨蜜',
    description: '老婆的閨蜜經常來家裡',
    category: 'mature',
    tags: ['閨蜜', '老婆', '閨蜜'],
    promptBuilder: {
      baseScenario: '老婆的閨蜜經常來家裡玩，逐漸產生吸引力',
      writingStyle: '朋友妻不可戲，掙扎描寫',
      atmosphere: '禁忌快感，內心掙扎',
      pace: 'slow',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'mature-008',
    slug: 'single-mom',
    name: '單親媽媽',
    description: '獨自撫養孩子的單親媽媽',
    category: 'mature',
    tags: ['單親', '媽媽', '堅強'],
    promptBuilder: {
      baseScenario: '認識一位堅強的單親媽媽，被她的魅力打動',
      writingStyle: '成熟韻味，母性光輝',
      atmosphere: '心疼與心動',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'mature-009',
    slug: 'mother-friend',
    name: '媽媽的朋友',
    description: '媽媽的年輕女性朋友',
    category: 'mature',
    tags: ['長輩', '朋友', '阿姨'],
    promptBuilder: {
      baseScenario: '媽媽年輕的朋友來家裡，風韻猶存',
      writingStyle: '成熟魅力，鄰家阿姨感',
      atmosphere: '親切但心動',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'mature-010',
    slug: 'cooking-class-teacher',
    name: '烹飪班老師',
    description: '興趣班的成熟女老師',
    category: 'mature',
    tags: ['烹飪', '興趣班', '老師'],
    promptBuilder: {
      baseScenario: '烹飪興趣班的年輕女老師，溫柔賢惠',
      writingStyle: '生活氛圍，煙火氣息',
      atmosphere: '日常親密，日久生情',
      pace: 'slow',
      intensity: 'mild',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },

  // === 職業幻想 (10個) ===
  {
    id: 'career-001',
    slug: 'cold-boss-overtime',
    name: '冷艷女上司',
    description: '加班時與高冷女上司單獨相處',
    category: 'career',
    tags: ['上司', '職場', '加班', '高冷'],
    promptBuilder: {
      baseScenario: '深夜加班，只剩下和冷艷的女上司獨處',
      writingStyle: '權力張力，职场氛围',
      atmosphere: '緊張曖昧，冰山融化',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
        isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'career-002',
    slug: 'sexy-secretary',
    name: '性感女秘書',
    description: '總裁身邊的性感女秘書',
    category: 'career',
    tags: ['秘書', '總裁', '性感'],
    promptBuilder: {
      baseScenario: '總裁身邊的性感女秘書，總是對你特別照顧',
      writingStyle: 'OL風格，職業裝誘惑',
      atmosphere: '權力與性感',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'career-003',
    slug: 'nurse-care',
    name: '護士的溫柔',
    description: '醫院裡的溫柔女護士',
    category: 'career',
    tags: ['護士', '醫院', '溫柔'],
    promptBuilder: {
      baseScenario: '住院期間照顧你的溫柔女護士',
      writingStyle: '醫療場所，溫柔呵護',
      atmosphere: '脆弱與依賴',
      pace: 'slow',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'career-004',
    slug: 'flight-attendant',
    name: '美艷空姐',
    description: '飛機上的美麗空姐',
    category: 'career',
    tags: ['空姐', '飛機', '邂逅'],
    promptBuilder: {
      baseScenario: '長途航班上，美麗的空姐對你特別關照',
      writingStyle: '旅行氛圍，制服誘惑',
      atmosphere: '高空浪漫，萍水相逢',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'career-005',
    slug: 'female-cop',
    name: '英姿女警',
    description: '意外被捕後與女警的邂逅',
    category: 'career',
    tags: ['警察', '制服', '逮捕'],
    promptBuilder: {
      baseScenario: '意外被拘留，英姿颯爽的女警負責審訊',
      writingStyle: '權力不对等，制服诱惑',
      atmosphere: '緊張刺激，權力遊戲',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'career-006',
    slug: 'female-trainer',
    name: '健身教練',
    description: '健身房裡的性感女教練',
    category: 'career',
    tags: ['健身', '教練', '身材'],
    promptBuilder: {
      baseScenario: '聘請的私人健身教練，身材火辣',
      writingStyle: '運動氛圍，汗水誘惑',
      atmosphere: '贴身指导，亲密接触',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'career-007',
    slug: 'female-lawyer',
    name: '女律師',
    description: '專業美艷的女律師',
    category: 'career',
    tags: ['律師', '專業', 'OL'],
    promptBuilder: {
      baseScenario: '聘請的離婚律師，既專業又美艷',
      writingStyle: '專業氣場，智慧魅力',
      atmosphere: '精英氛圍，事業女性',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'career-008',
    slug: 'receptionist',
    name: '公司前台',
    description: '公司的性感前台小姐',
    category: 'career',
    tags: ['前台', '公司', '接待'],
    promptBuilder: {
      baseScenario: '公司的前台的美丽小姐，对你似乎有意思',
      writingStyle: '日常接触，暧昧升级',
      atmosphere: '办公室恋情萌芽',
      pace: 'slow',
      intensity: 'mild',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'career-009',
    slug: 'female-boss',
    name: '年輕女老闆',
    description: '公司的年輕女繼承人',
    category: 'career',
    tags: ['老闆', '繼承人', '富二代'],
    promptBuilder: {
      baseScenario: '公司新上任的年輕女老闆，對你特別關注',
      writingStyle: '權力與戀情，麻雀變鳳凰',
      atmosphere: '地位懸殊，禁忌快感',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'career-010',
    slug: 'tour-guide',
    name: '導遊小姐',
    description: '旅行團裡的年輕導遊',
    category: 'career',
    tags: ['導遊', '旅行', '團體'],
    promptBuilder: {
      baseScenario: '旅行團裡的年輕導遊，對你照顧有加',
      writingStyle: '旅行氛圍，異地浪漫',
      atmosphere: '萍水相逢，旅途艳遇',
      pace: 'fast',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },

  // === 禁忌幻想 (6個) ===
  {
    id: 'taboo-001',
    slug: 'age-gap-love',
    name: '年齡差戀情',
    description: '相差十歲以上的戀情',
    category: 'taboo',
    tags: ['年齡差', '忘年戀', '禁忌'],
    promptBuilder: {
      baseScenario: '相差十歲以上的戀情，來自不同世代的兩人',
      writingStyle: '年齡差距帶來的新鮮感與衝突',
      atmosphere: '社會眼光，內心掙扎',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'taboo-002',
    slug: 'secret-relationship',
    name: '秘密戀情',
    description: '不能公開的地下戀情',
    category: 'taboo',
    tags: ['秘密', '地下戀情', '隱瞞'],
    promptBuilder: {
      baseScenario: '因為各種原因不能公開的戀情，只能偷偷見面',
      writingStyle: '偷偷摸摸的刺激感',
      atmosphere: '緊張刺激，禁忌快感',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'taboo-003',
    slug: 'fake-identity',
    name: '身份隱瞞',
    description: '隱藏真實身份的相遇',
    category: 'taboo',
    tags: ['身份', '隱瞞', '欺騙'],
    promptBuilder: {
      baseScenario: '隱藏真實身份相遇，發現真相後的糾葛',
      writingStyle: '身份揭露的反轉',
      atmosphere: '震驚與掙扎',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'taboo-004',
    slug: 'married-man',
    name: '已婚男人',
    description: '與已婚男性的禁忌戀情',
    category: 'taboo',
    tags: ['已婚', '出轨', '背德'],
    promptBuilder: {
      baseScenario: '明知對方已婚，卻無法自拔',
      writingStyle: '背德感，罪惡感',
      atmosphere: '糾結與沉淪',
      pace: 'slow',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'taboo-005',
    slug: 'forbidden-love',
    name: '禁忌之戀',
    description: '不被祝福的愛情',
    category: 'taboo',
    tags: ['禁忌', '不被祝福', '掙扎'],
    promptBuilder: {
      baseScenario: '來自家庭或社會反對的戀情',
      writingStyle: '抗爭與妥協',
      atmosphere: '痛苦與甜蜜',
      pace: 'slow',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'taboo-006',
    slug: 'boss-employee',
    name: '上司下屬',
    description: '職場權力不對等的關係',
    category: 'taboo',
    tags: ['上司', '下屬', '權力'],
    promptBuilder: {
      baseScenario: '上司對下屬的追求，權力不對等',
      writingStyle: '權力壓迫與屈服',
      atmosphere: '職場潛規則',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },

  // === NTR題材 (5個) ===
  {
    id: 'ntr-001',
    slug: 'wife-cheating',
    name: '老婆出軌',
    description: '發現老婆出軌的震驚故事',
    category: 'ntr',
    tags: ['出軌', '老婆', '發現'],
    promptBuilder: {
      baseScenario: '無意中發現老婆出軌的證據',
      writingStyle: '憤怒、屈辱、報復',
      atmosphere: '晴天霹靂',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'ntr-002',
    slug: 'girlfriend-chased',
    name: '女友被追',
    description: '女神被其他男人追求',
    category: 'ntr',
    tags: ['女友', '追求', '競爭'],
    promptBuilder: {
      baseScenario: '心愛的女友被其他男人猛烈追求',
      writingStyle: '危機感，佔有欲',
      atmosphere: '吃醋與競爭',
      pace: 'medium',
      intensity: 'moderate',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'ntr-003',
    slug: 'revenge-ntr',
    name: '復仇NTR',
    description: '發現被背叛後的復仇',
    category: 'ntr',
    tags: ['復仇', '報復', '報應'],
    promptBuilder: {
      baseScenario: '被背叛後，展開瘋狂報復',
      writingStyle: '報復的快感',
      atmosphere: '復仇火焰',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'ntr-004',
    slug: 'cuckold',
    name: '屈服現實',
    description: '無奈接受現實的無力感',
    category: 'ntr',
    tags: ['無奈', '屈服', '現實'],
    promptBuilder: {
      baseScenario: '面對現實的無奈選擇',
      writingStyle: '窩囊感，無力感',
      atmosphere: '抑鬱無奈',
      pace: 'slow',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: false,
    wordCostMultiplier: 1,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'ntr-005',
    slug: 'wife-joins',
    name: '三人關係',
    description: '複雜的多人關係',
    category: 'ntr',
    tags: ['三人', '多角', '複雜'],
    promptBuilder: {
      baseScenario: '意外發展成三人關係',
      writingStyle: '混亂與瘋狂',
      atmosphere: '極度混亂',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: true,
    wordCostMultiplier: 1.5,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },

  // === 高級/Premium (6個) ===
  {
    id: 'extreme-001',
    slug: 'dominant-game',
    name: '支配遊戲',
    description: '權力交換的極致體驗',
    category: 'extreme',
    tags: ['支配', '控制', '調教'],
    promptBuilder: {
      baseScenario: '一方完全支配另一方的關係',
      writingStyle: '支配與屈服，權力張力',
      atmosphere: '極度緊張',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
        isPremium: true,
    wordCostMultiplier: 1.5,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'extreme-002',
    slug: 'multi-relationship',
    name: '修羅場',
    description: '多女同時存在的複雜關係',
    category: 'extreme',
    tags: ['修羅場', '多女', '後宮'],
    promptBuilder: {
      baseScenario: '多個女性同時喜歡主角的修羅場景',
      writingStyle: '選擇困難，後宮生活',
      atmosphere: '熱鬧混亂',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: true,
    wordCostMultiplier: 2,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'extreme-003',
    slug: 'yandere-girl',
    name: '病嬌學妹',
    description: '為愛瘋狂的病嬌屬性',
    category: 'extreme',
    tags: ['病嬌', '跟蹤', '偏執'],
    promptBuilder: {
      baseScenario: '外表可愛的學妹，內心卻無比偏執',
      writingStyle: '反差萌，恐怖氛圍',
      atmosphere: '甜蜜恐怖',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: true,
    wordCostMultiplier: 1.5,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'extreme-004',
    slug: 'vice-president-secret',
    name: '副總的秘密',
    description: '公司副總的隱藏身份',
    category: 'extreme',
    tags: ['副總', '秘密', '雙面'],
    promptBuilder: {
      baseScenario: '公司副總有著不為人知的秘密愛好',
      writingStyle: '震驚反轉，禁忌快感',
      atmosphere: '震驚意外',
      pace: 'medium',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: true,
    wordCostMultiplier: 1.5,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'extreme-005',
    slug: 'rival-love',
    name: '競爭對手',
    description: '商場對手變床伴',
    category: 'extreme',
    tags: ['競爭', '對手', '和解'],
    promptBuilder: {
      baseScenario: '商業競爭對手，從敵人到床伴的轉變',
      writingStyle: '張力拉滿，戰鬥與親密',
      atmosphere: '對抗與吸引',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: true,
    wordCostMultiplier: 1.5,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
  {
    id: 'extreme-006',
    slug: 'ceo-romance',
    name: '總裁的秘密寵愛',
    description: '被霸道總裁看中',
    category: 'extreme',
    tags: ['總裁', '霸道', '寵愛'],
    promptBuilder: {
      baseScenario: '被霸道總裁看中，展開強制寵愛',
      writingStyle: '霸道總裁文風，強制寵溺',
      atmosphere: '少女心爆棚',
      pace: 'fast',
      intensity: 'intense',
      perspective: 'first'
    },
    isPremium: true,
    wordCostMultiplier: 2,
    isActive: true,
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    usageCount: 0,
    rating: 0
  },
];

// 導出模板總數
export const TEMPLATE_COUNT = officialTemplates.length;

// 獲取分類統計
export const getCategoryStats = () => {
  const stats: Record<string, number> = {};
  officialTemplates.forEach(t => {
    stats[t.category] = (stats[t.category] || 0) + 1;
  });
  return stats;
};
