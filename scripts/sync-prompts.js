#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// 載入 .env.local 環境變量
require("dotenv").config({ path: ".env.local" });

/**
 * V1.068: Deploy Hook - Auto-sync prompts on deployment
 * 
 * 此脚本在 Vercel 部署时自动运行，将代码中的默认提示词同步到数据库
 * 使用方法：在 vercel.json 的 buildCommand 中添加 "node scripts/sync-prompts.js"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Sync Prompts] Missing Supabase credentials');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 代码中的默认提示词（从 prompt-engine.ts 提取）
const DEFAULT_PROMPTS = {
  character: {
    name: '角色生成提示詞',
    description: '控制 AI 如何生成角色配對',
    content: `根據以下世界設定，創建兩個角色，用自然語言描述：

世界設定：{{templateWorld}}

要求：
1. 角色之間要有張力和戲劇衝突
2. 描述要吸引人，有代入感
3. 包含年齡、身份、性格、外貌等基本信息

輸出格式（直接輸出兩段描述，無需標題或符號）：

角色1：[女主角名字]，[年齡]歲，[身份]。她[性格特點]，[外貌描述]，[欲望風格]。

角色2：[男主角名字]，[年齡]歲，[身份]。他[性格特點]，[外貌描述]，[欲望風格]。`
  },
  outline: {
    name: '大綱生成提示詞',
    description: '控制 AI 如何生成故事大綱',
    content: `根據以下世界設定和角色配對，創建一個完整的故事大綱：

世界設定：{{templateWorld}}

角色配對：
{{characterPair}}

張力類型：{{tensionType}}

要求：
1. 大綱要包含開端、發展、高潮三個階段
2. 每個階段簡要描述主要情節
3. 突出角色之間的互動和衝突
4. 保持與世界設定的一致性

輸出格式（純文本描述，不使用標記符號）：

開端：[簡要描述故事的開始]

發展：[描述情節如何推進]

高潮：[描述最緊張的場景]`
  },
  story: {
    name: '故事生成提示詞',
    description: '控制 AI 如何生成故事段落',
    content: `你是一位專業的網路小說作家，擅長撰寫成人浪漫小說。

根據以下信息繼續創作故事：

故事背景：{{context}}

當前進度：{{progress}}

角色狀態：{{characters}}

風格參考：
{{styleSamples}}

要求：
1. 字數：約 {{wordCount}} 字
2. 延續上文風格和節奏
3. 保持角色性格一致性
4. 推動情節發展，增加戲劇張力
5. 結尾要製造懸念，引導讀者繼續閱讀

直接輸出故事內容，無需標題或說明。`
  }
};

// 计算内容哈希（用于检测变更）
function computeHash(content) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 16);
}

// 同步单个提示词
async function syncPrompt(key, defaultData) {
  try {
    // 检查数据库中是否存在
    const { data: existing, error: checkError } = await supabase
      .from('admin_prompts')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (checkError) {
      console.error(`[Sync Prompts] Error checking ${key}:`, checkError.message);
      return false;
    }

    const newHash = computeHash(defaultData.content);

    if (!existing) {
      // 插入新记录
      console.log(`[Sync Prompts] Creating new prompt: ${key}`);
      const { error: insertError } = await supabase
        .from('admin_prompts')
        .insert({
          key,
          name: defaultData.name,
          description: defaultData.description,
          content: defaultData.content,
          version: 1,
          is_auto_sync: true,
          source_code_hash: newHash,
          is_active: true
        });

      if (insertError) {
        console.error(`[Sync Prompts] Error inserting ${key}:`, insertError.message);
        return false;
      }
      console.log(`[Sync Prompts] Created: ${key} (hash: ${newHash})`);
      return true;
    }

    // 检查是否需要更新（只有 auto_sync 的提示词才会更新）
    if (existing.is_auto_sync === false) {
      console.log(`[Sync Prompts] Skipping ${key} (manual mode)`);
      return false;
    }

    // 检查内容是否变更
    if (existing.source_code_hash === newHash) {
      console.log(`[Sync Prompts] No changes for ${key}`);
      return false;
    }

    // 更新现有记录
    console.log(`[Sync Prompts] Updating ${key} (version ${existing.version + 1})`);
    const { error: updateError } = await supabase
      .from('admin_prompts')
      .update({
        content: defaultData.content,
        version: (existing.version || 0) + 1,
        source_code_hash: newHash,
        updated_at: new Date().toISOString()
      })
      .eq('key', key);

    if (updateError) {
      console.error(`[Sync Prompts] Error updating ${key}:`, updateError.message);
      return false;
    }

    console.log(`[Sync Prompts] Updated: ${key} (hash: ${newHash})`);
    return true;

  } catch (error) {
    console.error(`[Sync Prompts] Unexpected error for ${key}:`, error);
    return false;
  }
}

// 主函数
async function main() {
  console.log('[Sync Prompts] Starting deployment sync...');
  console.log(`[Sync Prompts] Version: ${process.env.npm_package_version || 'v1.068'}`);
  console.log(`[Sync Prompts] Timestamp: ${new Date().toISOString()}`);

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const [key, data] of Object.entries(DEFAULT_PROMPTS)) {
    const result = await syncPrompt(key, data);
    if (result) {
      synced++;
    } else {
      skipped++;
    }
  }

  // 记录部署历史
  const { error: logError } = await supabase
    .from('deployment_hooks')
    .insert({
      version: process.env.npm_package_version || 'v1.068',
      prompts_synced: synced > 0,
      git_commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 'unknown',
      build_timestamp: new Date().toISOString()
    });

  if (logError) {
    console.error('[Sync Prompts] Error logging deployment:', logError.message);
  }

  console.log('[Sync Prompts] Sync complete:');
  console.log(`  - Synced: ${synced}`);
  console.log(`  - Skipped: ${skipped}`);
  console.log(`  - Errors: ${errors}`);
  
  process.exit(0);
}

// 运行
main().catch(error => {
  console.error('[Sync Prompts] Fatal error:', error);
  process.exit(1);
});
