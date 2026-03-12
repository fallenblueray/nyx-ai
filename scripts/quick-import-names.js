/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Quick import: only ID and name
 * Run: cd nyx-ai && node scripts/quick-import-names.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Template names only
const templates = [
  { id: 'classic-001', name: '初戀重逢', category: 'classic' },
  { id: 'classic-002', name: '青梅竹馬', category: 'classic' },
  { id: 'classic-003', name: '久別重逢', category: 'classic' },
  { id: 'classic-004', name: '朋友變戀人', category: 'classic' },
  { id: 'classic-005', name: '網戀奔現', category: 'classic' },
  { id: 'classic-006', name: '命運邂逅', category: 'classic' },
  { id: 'classic-007', name: '暗戀成真', category: 'classic' },
  { id: 'classic-008', name: '度假艳遇', category: 'classic' },
  { id: 'campus-001', name: '校花學姐', category: 'campus' },
  { id: 'campus-002', name: '女老師的補習課', category: 'campus' },
  { id: 'campus-003', name: '宿舍誘惑', category: 'campus' },
  { id: 'campus-004', name: '學妹主動', category: 'campus' },
  { id: 'campus-005', name: '班長的秘密', category: 'campus' },
  { id: 'campus-006', name: '熬夜自習', category: 'campus' },
  { id: 'campus-007', name: '體育女神', category: 'campus' },
  { id: 'campus-008', name: '圖書館偶遇', category: 'campus' },
  { id: 'campus-009', name: '校外教學', category: 'campus' },
  { id: 'campus-010', name: '社團練習', category: 'campus' },
  { id: 'mature-001', name: '寂寞鄰居', category: 'mature' },
  { id: 'mature-002', name: '上司妻子', category: 'mature' },
  { id: 'mature-003', name: '朋友老婆', category: 'mature' },
  { id: 'mature-004', name: '寂寞人妻', category: 'mature' },
  { id: 'mature-005', name: '離婚少婦', category: 'mature' },
  { id: 'mature-006', name: '表姐來訪', category: 'mature' },
  { id: 'mature-007', name: '老婆閨蜜', category: 'mature' },
  { id: 'mature-008', name: '單親媽媽', category: 'mature' },
  { id: 'mature-009', name: '媽媽的朋友', category: 'mature' },
  { id: 'mature-010', name: '烹飪班老師', category: 'mature' },
  { id: 'career-001', name: '冷艷女上司', category: 'career' },
  { id: 'career-002', name: '性感女秘書', category: 'career' },
  { id: 'career-003', name: '護士的溫柔', category: 'career' },
  { id: 'career-004', name: '美艷空姐', category: 'career' },
  { id: 'career-005', name: '英姿女警', category: 'career' },
  { id: 'career-006', name: '健身教練', category: 'career' },
  { id: 'career-007', name: '女律師', category: 'career' },
  { id: 'career-008', name: '公司前台', category: 'career' },
  { id: 'career-009', name: '年輕女老闆', category: 'career' },
  { id: 'career-010', name: '導遊小姐', category: 'career' },
  { id: 'taboo-001', name: '年齡差戀情', category: 'taboo' },
  { id: 'taboo-002', name: '秘密戀情', category: 'taboo' },
  { id: 'taboo-003', name: '身份隱瞞', category: 'taboo' },
  { id: 'taboo-004', name: '已婚男人', category: 'taboo' },
  { id: 'taboo-005', name: '禁忌之戀', category: 'taboo' },
  { id: 'taboo-006', name: '上司下屬', category: 'taboo' },
  { id: 'ntr-001', name: '老婆出軌', category: 'ntr' },
  { id: 'ntr-002', name: '女友被追', category: 'ntr' },
  { id: 'ntr-003', name: '復仇NTR', category: 'ntr' },
  { id: 'ntr-004', name: '屈服現實', category: 'ntr' },
  { id: 'ntr-005', name: '三人關係', category: 'ntr' },
  { id: 'extreme-001', name: '支配遊戲', category: 'extreme' },
  { id: 'extreme-002', name: '修羅場', category: 'extreme' },
  { id: 'extreme-003', name: '病嬌學妹', category: 'extreme' },
  { id: 'extreme-004', name: '副總的秘密', category: 'extreme' },
  { id: 'extreme-005', name: '競爭對手', category: 'extreme' },
  { id: 'extreme-006', name: '總裁的秘密寵愛', category: 'extreme' }
];

async function importTemplates() {
  console.log(`[Import] Starting import of ${templates.length} templates...`);

  const dbTemplates = templates.map(t => ({
    id: t.id,
    slug: t.id.replace(/-/g, '_'),
    name: t.name,
    category: t.category,
    description: '',
    base_scenario: '',
    writing_style: '',
    atmosphere: '',
    pace: 'medium',
    intensity: 'moderate',
    is_premium: false,
    is_active: true,
    tags: [],
    word_cost_multiplier: 1.0
  }));

  const { error } = await supabase
    .from('templates')
    .upsert(dbTemplates, { onConflict: 'id' });

  if (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully imported ${templates.length} templates!`);
  console.log('\nYou can now edit them at: https://www.nyx-ai.net/admin/templates');
}

importTemplates();
