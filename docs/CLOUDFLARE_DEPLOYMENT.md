# Cloudflare 部署方案

## 概述

由于项目使用 Next.js 16 并包含多个 API 路由，直接静态导出会导致 API 路由失效。以下是推荐的 Cloudflare 部署方案：

## 方案一：使用 Vercel + Cloudflare CDN（推荐）

最简单的方法是将 Vercel 部署的站点通过 Cloudflare CDN 代理：

1. 在 Cloudflare Dashboard 中添加域名 `nyx-ai.net`
2. 添加 CNAME 记录指向 Vercel 部署地址
3. 开启 Cloudflare 代理（橙色云）

## 方案二：静态站点 + Cloudflare Workers API

### 步骤 1：构建静态站点（不含 API 路由）

```bash
# 创建一个新的静态构建配置
cp next.config.ts next.config.ts.backup

# 修改 next.config.ts 为静态导出
# 注意：这将禁用 API 路由
cat > next.config.ts << 'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  // 排除 API 路由
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
EOF

# 构建
npm run build
```

### 步骤 2：部署到 Cloudflare Pages

```bash
# 使用 wrangler 部署
npx wrangler pages deploy dist --project-name=nyx-ai
```

### 步骤 3：创建 Cloudflare Workers 处理 API

需要将所有 API 路由重写为 Cloudflare Workers 格式。

## 当前建议

鉴于项目复杂性，建议继续使用 **Vercel** 部署，然后通过 **Cloudflare CDN** 代理：

1. 在 Cloudflare Dashboard 添加域名 `nyx-ai.net`
2. 添加 DNS 记录：
   - 类型：CNAME
   - 名称：@（或 www）
   - 目标：`nyx-ai-woad.vercel.app`
   - 代理状态：已代理（橙色云）

3. 在 Vercel 项目设置中添加自定义域名 `nyx-ai.net`

这样可以利用 Cloudflare 的 CDN 加速和 DDoS 保护，同时保持 Vercel 的 Next.js 完整支持。

## API Keys 配置

如需直接在 Cloudflare Workers 中运行，需要配置以下环境变量：

- `OPENROUTER_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 完整 Cloudflare Workers 迁移

如需完整迁移到 Cloudflare Workers，需要：
1. 将 NextAuth 替换为 Cloudflare Access 或自定义 JWT
2. 将 Supabase 客户端替换为 Cloudflare D1 或直接使用 Supabase REST API
3. 将 Stripe webhook 处理移到 Cloudflare Workers
4. 重写所有 API 路由为 Workers 格式

这是一个较大的工程，建议分阶段进行。
