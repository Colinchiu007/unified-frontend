# CLAUDE.md

## 项目概述

一站式视频生成平台的统一前端（Next.js 15 + React 18）。

## 目录结构

```
unified-frontend/
+-- src/
|   +-- app/              # Next.js App Router 页面
|   |   +-- layout.tsx    # 根布局 + AppLayout 侧边栏
|   |   +-- page.tsx      # 首页（Dashboard 重定向）
|   |   +-- login/        # 登录页
|   |   +-- settings/     # 设置页
|   |   +-- trending/     # 热榜展示
|   |   +-- user/         # 用户中心
|   +-- components/       # 共享组件
|   |   +-- ui/           # 基础 UI 组件
|   +-- lib/              # 工具库
|   |   +-- api.ts        # API 封装层
|   |   +-- auth.ts       # 认证工具
|   +-- __tests__/        # 测试
+-- public/               # 静态资源
+-- docs/                 # 文档
|   +-- ARCHITECTURE.md   # 架构设计
|   +-- DESIGN.md         # 设计决策
```

## 开发命令

```bash
npm run dev       # 开发服务器
npm run build     # 生产构建
npm test          # 运行测试
npm run lint      # 代码检查
```

## 路由设计

| 路由 | 页面 | 渲染策略 |
|------|------|---------|
| `/` | 首页 | SSR → redirect /trending |
| `/login` | 登录 | Client |
| `/settings` | 设置 | Client |
| `/trending/[platform]` | 热榜详情 | SSR |
| `/user/profile` | 个人资料 | Client |
| `/user/favorites` | 收藏 | Client |
| `/user/subscriptions` | 订阅管理 | Client |

## 技术栈

- Next.js 15 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- Vitest + Testing Library

## 认证

- 通过 orchestrator SSO 登录
- JWT token 存储在 localStorage
- token 过期自动跳转 /login
