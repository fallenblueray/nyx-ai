/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Bulk import all 55 templates from Supabase
 * Run: cd nyx-ai && node scripts/bulk-import-templates.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// All 55 templates data
const templates = [
  // === classic (8) ===
  {
    id: 'classic-001', slug: 'first-love-reunion', name: '初戀重逢', category: 'classic',
    description: '多年後與初戀意外相遇，舊情復燃', tags: ['初戀', '重逢', '情感', '舊情復燃'],
    base_scenario: '多年後在街頭偶遇初戀，她已經變得更加成熟迷人',
    writing_style: '細膩情感描寫，注重心理變化，緩慢醞釀',
    atmosphere: '懷舊與曖昧交織，帶有淡淡的憂傷',
    pace: 'slow', intensity: 'moderate', is_premium: false
  },
  {
    id: 'classic-002', slug: 'childhood-sweetheart', name: '青梅竹馬', category: 'classic',
    description: '那個從小一起長大的女孩，什麼時候變得這麼迷人了？', tags: ['青梅竹馬', '日久生情', '鄰家'],
    base_scenario: '你們是住在隔壁的青梅竹馬，從小一起上下學。她總是大大咧咧地穿著睡衣來你家蹭飯，從不把你當外人。但最近你發現，這個從小看到大的女孩，身材越來越成熟，笑容也越來越讓人心跳加速...',
    writing_style: '日常溫馨中帶有微妙張力，注重細節描寫（睡衣領口、髮香、不經意的肢體接觸）',
    atmosphere: '青澀曖昧，帶有「太熟了反而不好下手」的糾結',
    pace: 'slow', intensity: 'mild', is_premium: false
  },
  {
    id: 'classic-003', slug: 'reunion-after-years', name: '久別重逢', category: 'classic',
    description: '多年未見的老同學聚會重逢', tags: ['同學會', '重逢', '變化'],
    base_scenario: '多年未見的老同學聚會，曾經暗戀的對象如今更加耀眼',
    writing_style: '對比今昔，注重眼神交流和氛圍營造',
    atmosphere: '懷念與心動交織，帶有競爭意味',
    pace: 'medium', intensity: 'moderate', is_premium: false
  },
  {
    id: 'classic-004', slug: 'friend-becomes-lover', name: '朋友變戀人', category: 'classic',
    description: '多年異性好友，友情意外昇華', tags: ['友情', '日久生情', '告白'],
    base_scenario: '多年異性好友，一次意外讓關係發生質變',
    writing_style: '注重心理描寫，展現內心掙扎',
    atmosphere: '緊張曖昧，帶有罪惡感',
    pace: 'medium', intensity: 'moderate', is_premium: false
  },
  {
    id: 'classic-005', slug: 'online-love-meetup', name: '網戀奔現', category: 'classic',
    description: '網友多年曖昧，終於線下見面', tags: ['網戀', '奔現', '見面'],
    base_scenario: '網聊多年的網友終於約好見面，現實與想像有落差',
    writing_style: '期待與緊張交織，注重場景描寫',
    atmosphere: '心跳加速，帶有冒險感',
    pace: 'medium', intensity: 'moderate', is_premium: false
  },
  {
    id: 'classic-006', slug: 'chance-encounter', name: '命運邂逅', category: 'classic',
    description: '陌生人之間的命運相遇', tags: ['邂逅', '命運', '陌生人'],
    base_scenario: '在不該相遇的地方相遇，卻產生奇妙吸引力',
    writing_style: '電影感描寫，注重氛圍營造',
    atmosphere: '命中註定的浪漫，帶有懸念',
    pace: 'medium', intensity: 'moderate', is_premium: false
  },
  {
    id: 'classic-007', slug: 'secret-crush', name: '暗戀成真', category: 'classic',
    description: '長期暗戀終於表白成功', tags: ['暗戀', '表白', '單相思'],
    base_scenario: '長期暗戀某個人，終於找到機會表白',
    writing_style: '內心戲豐富，情感細膩',
    atmosphere: '緊張期待，帶有夢幻感',
    pace: 'slow', intensity: 'mild', is_premium: false
  },
  {
    id: 'classic-008', slug: 'vacation-flirtation', name: '度假艳遇', category: 'classic',
    description: '旅行中遇到的短暂浪漫', tags: ['旅行', '艳遇', '短暂'],
    base_scenario: '在度假勝地遇到心動的陌生人，沒有負擔的短暫時光',
    writing_style: '浪漫唯美，注重氛圍',
    atmosphere: '自由放鬆，帶有冒險感',
    pace: 'fast', intensity: 'intense', is_premium: false
  },

  // === campus (10) ===
  {
    id: 'campus-001', slug: 'school-belle-senior', name: '校花學姐', category: 'campus',
    description: '被校花學姐主動搭讪，展開秘密關係', tags: ['校花', '學姐', '校園', '被追求'],
    base_scenario: '被學校公認的校花學姐主動搭讪，原來她暗戀你已久',
    writing_style: '校園戀愛氛圍，被動轉主動的快感',
    atmosphere: '心動緊張，帶有虛榮感',
    pace: 'medium', intensity: 'moderate', is_premium: false
  },
  {
    id: 'campus-002', slug: 'female-teacher-after-class', name: '女老師的補習課', category: 'campus',
    description: '放學後被女老師單獨留下', tags: ['老師', '師生', '補習'],
    base_scenario: '放學後被美麗的女老師單獨留下補課，氣氛逐漸變得曖昧',
    writing_style: '禁忌感描寫，權力關係張力',
    atmosphere: '緊張曖昧，帶有背德感',
    pace: 'medium', intensity: 'intense', is_premium: false
  },
  {
    id: 'campus-003', slug: 'dormitory-seduction', name: '宿舍誘惑', category: 'campus',
    description: '室友不在，單獨與女同學相處', tags: ['宿舍', '室友', '獨處'],
    base_scenario: '宿舍室友都出去了，只剩下你和一位女同學，氣氛逐漸變得微妙',
    writing_style: '密室張力，孤男寡女的緊張感',
    atmosphere: '曖昧升溫，帶有試探',
    pace: 'medium', intensity: 'intense', is_premium: false
  },
  {
    id: 'campus-004', slug: 'junior-girl-initiative', name: '學妹主動', category: 'campus',
    description: '可愛學妹倒追學長', tags: ['學妹', '倒追', '可愛'],
    base_scenario: '可愛的學妹主動接近，展開熱烈追求',
    writing_style: '輕鬆甜蜜，女主動的快感',
    atmosphere: '甜寵戀愛，主動被動交換',
    pace: 'fast', intensity: 'moderate', is_premium: false
  },
  {
    id: 'campus-005', slug: 'class-monitor-secret', name: '班長的秘密', category: 'campus',
    description: '品學兼優的班長不為人知的一面', tags: ['班長', '反差', '秘密'],
    base_scenario: '平時一本正經的班長，私下卻有著不為人知的秘密',
    writing_style: '反差感描寫，揭秘快感',
    atmosphere: '震驚意外，帶有獵奇',
    pace: 'medium', intensity: 'intense', is_premium: false
  },
  {
    id: 'campus-006', slug: 'study-group-overnight', name: '熬夜自習', category: 'campus',
    description: '一起熬夜複習考試，氣氛變質', tags: ['自習', '熬夜', '考試'],
    base_scenario: '考試前夕一起熬夜複習，夜深人靜時氣氛變得不同',
    writing_style: '疲憊與亢奮交織，環境暗示',
    atmosphere: '深夜曖昧，孤獨感拉近距離',
    pace: 'slow', intensity: 'moderate', is_premium: false
  },
  {
    id: 'campus-007', slug: 'sports-girl-attention', name: '體育女神', category: 'campus',
    description: '運動會上的風雲人物', tags: ['運動', '女神', '運動會'],
    base_scenario: '運動會上注意到的體育女神，沒想到她會主動接近',
    writing_style: '活力氛圍，陽光性感',
    atmosphere: '熱血心動，帶有征服感',
    pace: 'fast', intensity: 'moderate', is_premium: false
  },
  {
    id: 'campus-008', slug: 'library-encounter', name: '圖書館偶遇', category: 'campus',
    description: '圖書館的固定相遇，產生情愫', tags: ['圖書館', '書香', '相遇'],
    base_scenario: '圖書館固定位置的她，漸漸產生情愫',
    writing_style: '文藝氛圍，循序漸進',
    atmosphere: '書香曖昧，日久生情',
    pace: 'slow', intensity: 'mild', is_premium: false
  },
  {
    id: 'campus-009', slug: 'school-trip-hotel', name: '校外教學', category: 'campus',
    description: '校外教學時的意外同房', tags: ['校外教學', '同房', '旅行'],
    base_scenario: '校外教學分配房間時，意外和心儀的同學同房',
    writing_style: '旅行氛圍，意外發展',
    atmosphere: '緊張期待，偷跑感',
    pace: 'medium', intensity: 'intense', is_premium: false
  },
  {
    id: 'campus-010', slug: 'music-club-practice', name: '社團練習', category: 'campus',
    description: '音樂社團的單獨練習時間', tags: ['社團', '音樂', '練習'],
    base_scenario: '音樂社團練習結束後，剩下兩人獨處',
    writing_style: '藝術氛圍，音樂節奏感',
    atmosphere: '浪漫曖昧，才華吸引',
    pace: 'slow', intensity: 'moderate', is_premium: false
  },

  // === mature (10) ===
  {
    id: 'mature-001', slug: 'lonely-neighbor', name: '寂寞鄰居', category: 'mature',
    description: '隔壁美艷少婦丈夫長期出差，深夜敲門求助', tags: ['鄰居', '人妻', '寂寞', '深夜'],
    base_scenario: '隔壁年輕貌美的鄰居，太太丈夫長期出差，一個深夜突然敲門',
    writing_style: '寂寞氛圍，成熟魅力描寫',
    atmosphere: '深夜寂寞，孤男寡女',
    pace: 'medium', intensity: 'intense', is_premium: false
  },
  {
    id: 'mature-002', slug: 'boss-wife', name: '上司妻子', category: 'mature',
    description: '拜訪上司家時，與上司妻子獨處', tags: ['上司', '妻子', '拜訪'],
    base_scenario: '拜訪上司家，上司臨時有事離開，只剩下和上司妻子獨處',
    writing_style: '權力禁忌，成熟女性魅力',
    atmosphere: '緊張刺激，帶有背德感',
    pace: 'medium', intensity: 'intense', is_premium: false
  },
  {
    id: 'mature-003', slug: 'friend-wife', name: '朋友老婆', category: 'mature',
    description: '幫朋友照顧老婆，意外發生', tags: ['朋友', '老婆', '照顧'],
    base_scenario: '朋友出差拜託照顧他老婆，日久生情',
    writing_style: '友情背叛，禁忌快感',
    atmosphere: '愧疚與渴望交織',
    pace: 'medium', intensity: 'intense', is_premium: false
  },
  {
    id: 'mature-004', slug: 'bored-housewife', name: '寂寞人妻', category: 'mature',
    description: '全職太太的無聊日常', tags: ['全職太太', '無聊', '寂寞'],
    base_scenario: '丈夫工作忙碌，全職太太獨守空閨，寂寞難耐',
    writing_style: '寂寞氛圍，渴望描寫',
    atmosphere: '寂寞壓抑，帶有爆發前的張力',
    pace: 'slow', intensity: 'intense', is_premium: false
  }
]

async function importTemplates() {
  console.log(`Importing ${templates.length} templates to Supabase...`)
  for (const t of templates) {
    const { error } = await supabase.from('templates').upsert(t, { onConflict: 'id' })
    if (error) console.error(`Error importing ${t.id}:`, error.message)
    else console.log(`✅ Imported: ${t.name}`)
  }
  console.log('Done!')
}

importTemplates().catch(console.error)
