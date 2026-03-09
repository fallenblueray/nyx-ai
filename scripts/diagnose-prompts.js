#!/usr/bin/env node
/**
 * 诊断脚本：检查 admin_prompts 表中的实际内容
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  console.log('请确保环境变量已设置：');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY 或 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnose() {
  console.log('🔍 诊断 admin_prompts 表...\n');
  
  // 1. 列出所有提示词
  const { data: prompts, error } = await supabase
    .from('admin_prompts')
    .select('*')
    .order('key');
  
  if (error) {
    console.error('❌ 查询失败:', error.message);
    return;
  }
  
  console.log(`📊 找到 ${prompts.length} 条记录\n`);
  
  for (const p of prompts) {
    console.log(`─`.repeat(60));
    console.log(`📝 Key: ${p.key}`);
    console.log(`📛 Name: ${p.name}`);
    console.log(`🔢 Version: ${p.version}`);
    console.log(`✅ is_active: ${p.is_active}`);
    console.log(`🔄 is_auto_sync: ${p.is_auto_sync}`);
    console.log(`#️⃣ source_code_hash: ${p.source_code_hash || 'null'}`);
    console.log(`📅 Updated: ${p.updated_at}`);
    
    // 检查内容是否包含旧格式
    const hasOldFormat = p.content.includes('===') || 
                         p.content.includes('角色1') && p.content.includes('===');
    const hasNewFormat = p.content.includes('自然語言描述');
    
    console.log(`\n📄 内容预览（前200字）:`);
    console.log(p.content.slice(0, 200).replace(/\n/g, '\\n'));
    
    if (hasOldFormat) {
      console.log(`\n⚠️  检测到旧格式（包含 === 标记）`);
    } else if (hasNewFormat) {
      console.log(`\n✅ 已是最新 V6 格式`);
    } else {
      console.log(`\n❓ 格式无法识别`);
    }
    
    console.log(`\n`);
  }
  
  // 2. 检查 deployment_hooks 表
  console.log(`\n🔍 检查 deployment_hooks 表...\n`);
  const { data: hooks, error: hookError } = await supabase
    .from('deployment_hooks')
    .select('*')
    .order('deployed_at', { ascending: false })
    .limit(5);
  
  if (hookError) {
    console.error('❌ deployment_hooks 查询失败:', hookError.message);
  } else {
    console.log(`📊 最近 ${hooks.length} 次部署记录:\n`);
    for (const h of hooks) {
      console.log(`  - ${h.version} @ ${h.deployed_at} (synced: ${h.prompts_synced})`);
    }
  }
  
  // 3. 修复建议
  console.log(`\n` + `─`.repeat(60));
  console.log(`💡 修复建议:\n`);
  
  const needsUpdate = prompts.filter(p => 
    p.content.includes('===') || !p.is_auto_sync
  );
  
  if (needsUpdate.length > 0) {
    console.log(`需要更新的提示词: ${needsUpdate.map(p => p.key).join(', ')}`);
    console.log(`\n执行以下 SQL 强制更新:\n`);
    console.log(`UPDATE admin_prompts SET is_auto_sync = true WHERE key IN ('${needsUpdate.map(p => p.key).join("','")}');`);
    console.log(`\n然后重新部署以触发同步。`);
  } else {
    console.log(`✅ 所有提示词已是最新格式`);
  }
}

diagnose().catch(console.error);
