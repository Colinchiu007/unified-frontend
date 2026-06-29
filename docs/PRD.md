# PROJECT-004：统一前端 Unified Frontend — PRD

> **立项日期**: 2026-06-25
> **最后更新**: 2026-06-29
> **当前版本**: v0.4.1（批量生成）
> **产品定位**: 一站式视频生成平台统一 Web 前端，聚合热榜发现、内容管理、视频生成、发布管理、系统设置五大模块
> **目标用户**: 自媒体运营者、内容创作者、MCN 机构
> **技术架构**: Next.js 15 App Router + TypeScript + Tailwind CSS（Standalone 输出）

---

## 一、产品概述

### 1.1 核心价值

视频生成平台原先由多个独立前端组成（TrendScope 前端、Story2Video 界面、Multi-Publish 界面等），用户需要在不同页面和端口间切换，体验割裂且维护成本高。统一前端将全部模块聚合到单一 Next.js 应用中，提供：

1. **统一入口**：一个域名、一个登录态管理所有模块
2. **一致体验**：统一的设计语言、导航结构、组件体系
3. **降低维护成本**：5 个页面共享 UI 组件库、API 封装层、构建配置
4. **全链路闭环**：从热榜发现到视频发布在同一产品内完成

### 1.2 产品边界

| 范围 | 说明 |
|------|------|
| **仪表盘** | 热榜趋势、今日统计数据、快速操作入口 |
| **内容管理** | 已采集/已改写的内容列表，支持搜索和详情查看 |
| **视频生成** | 三步向导：选择内容 → 配置参数 → 确认生成 |
| **发布管理** | 任务列表、状态追踪、筛选过滤、失败重试 |
| **设置** | 用户资料编辑、API Key 管理、服务器配置查看 |
| **不包含** | 内容采集爬虫（由 content-aggregator 后端负责）、视频合成引擎（由 compositor 后端负责）、RPA 发布执行（由 Multi-Publish 桌面端负责）、数据分析报表（规划中） |

---

## 二、页面功能

### 2.1 仪表盘（Dashboard）

路径: `/` （首页）

| 子功能 | 描述 | 状态 |
|--------|------|------|
| 热榜趋势列表 | 展示各平台热门话题，含排名、标题、热度值、平台标签 | ✅ MVP |
| 今日统计卡片 | 生成中、已完成、失败的任务数量概览 | ✅ MVP |
| 用户欢迎语 | 展示当前登录用户名称 | ✅ MVP |
| 快速操作入口 | 通过侧边栏导航跳转到各功能模块 | ✅ MVP |

数据来源: `GET /api/v1/aggregator/dashboard`（一次性返回聚合数据）

### 2.2 内容管理（Content）

路径: `/content`

| 子功能 | 描述 | 状态 |
|--------|------|------|
| 内容列表 | 展示已采集/改写的内容条目（标题、状态、来源、字数、时间） | ✅ MVP |
| 折叠详情 | 点击展开卡片查看文章 ID、原文链接、字数、创建时间 | ✅ MVP |
| 客户端搜索过滤 | 按标题或状态进行实时搜索筛选 | ✅ MVP |
| 状态标签 | 待处理/处理中/已完成/失败 四种状态视觉标识 | ✅ MVP |
| 空态提示 | 内容库为空时的引导文字 | ✅ MVP |

数据来源: `GET /api/v1/aggregator/generate`（获取 content_sources 列表）

### 2.3 视频生成（Generate）

路径: `/generate`

| 子功能 | 描述 | 状态 |
|--------|------|------|
| 三步向导 | 选择内容 → 视频配置 → 确认生成，分步导航 | ✅ MVP |
| 内容选择 | 从内容库列表中选取要生成视频的文章，含状态和字数信息 | ✅ MVP |
| 视频配置 | 选择配音音色、视频比例、图片风格（默认值自动填充） | ✅ MVP |
| 确认摘要 | 提交前展示所有参数摘要 | ✅ MVP |
| 提交与进度追踪 | POST 提交后展示实时进度条和状态轮询（3 秒间隔） | ✅ MVP |
| 批量生成 | 多选文章一次性提交，可折叠多进度追踪 | ✅ v0.4.1 |
| 表单校验 | 选择内容步骤的必填校验，错误提示 | ✅ MVP |
| 文件上传区 | 拖拽上传区域的 UI 骨架（功能待开放） | ✅ MVP |

数据来源: `GET /api/v1/aggregator/generate`（获取选项配置）、`POST /api/v1/aggregator/generate`（提交任务）、`GET /api/jobs/{id}`（轮询状态）

### 2.4 发布管理（Publish）

路径: `/publish`

| 子功能 | 描述 | 状态 |
|--------|------|------|
| 任务列表 | 展示所有视频生成任务（含进度条、类型标签、耗时） | ✅ MVP |
| 状态筛选 | 按全部/排队中/生成中/已完成/失败 五个标签筛选 | ✅ MVP |
| 进度条 | 根据任务阶段显示实时进度百分比 | ✅ MVP |
| 自动轮询 | 存在活跃任务时每 5 秒自动刷新 | ✅ MVP |
| 失败重试 | 失败任务一键重试 | ✅ MVP |
| 展开详情 | 查看任务 ID、类型、时间、输出路径、错误信息 | ✅ MVP |
| 空态提示 | 按不同筛选状态显示对应的空态引导 | ✅ MVP |

数据来源: `GET /api/jobs`（任务列表）、`POST /api/jobs/{id}/retry`（重试）

### 2.5 设置（Settings）

路径: `/settings`

| 子功能 | 描述 | 状态 |
|--------|------|------|
| 用户信息展示 | 用户名、邮箱、角色、注册时间 | ✅ MVP |
| 用户信息编辑 | 编辑用户名和邮箱，保存后实时更新 | ✅ MVP |
| 服务器配置 | 显示 API 地址和版本信息（只读） | ✅ MVP |
| API Key 管理 | 新建、复制、显示/隐藏、删除 Key | ✅ MVP |
| 新建 Key 引导 | 创建成功后提示复制 Key（关闭后不可再次查看） | ✅ MVP |

数据来源: `GET /api/auth/profile`、`PUT /api/auth/profile`、`GET /api/auth/keys`、`POST /api/auth/keys`、`DELETE /api/auth/keys/{id}`

### 2.6 登录页面（Login）

路径: `/login`

| 子功能 | 描述 | 状态 |
|--------|------|------|
| 登录表单 | 用户名/邮箱 + 密码 | ✅ MVP |
| 错误提示 | 登录失败时的错误信息展示 | ✅ MVP |
| Token 存储 | 登录成功后 access_token 写入 localStorage | ✅ MVP |
| 自动跳转 | 登录成功后跳转到首页 | ✅ MVP |

数据来源: `POST /api/auth/login`

---

## 三、技术架构

### 3.1 架构图

```
┌──────────────────────────────────────────────────────────┐
│                  用户浏览器 (Port 3000)                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Next.js 15 App Router                  │  │
│  │              TypeScript / React 18                  │  │
│  │                                                      │  │
│  │  ┌─────────────┬──────────┬──────────────────┐      │  │
│  │  │ / (Dashboard)│ /content │ /generate         │      │  │
│  │  │ 热榜趋势列表  │ 内容管理   │ 三步向导           │      │  │
│  │  │ 今日统计     │ 搜索过滤   │ 进度追踪           │      │  │
│  │  ├─────────────┼──────────┼──────────────────┤      │  │
│  │  │ /publish    │ /settings│ /login            │      │  │
│  │  │ 任务列表     │ 用户信息   │ 登录表单           │      │  │
│  │  │ 状态筛选     │ API Key  │ Token 存储        │      │  │
│  │  └─────────────┴──────────┴──────────────────┘      │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │             共享层 Shared Layer                │   │  │
│  │  │  ├─ @/lib/api.ts      统一 API 封装            │   │  │
│  │  │  ├─ @/components/ui   基础 UI 组件             │   │  │
│  │  │  └─ @/components/AppLayout 导航布局            │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                                │
│                    nginx 反向代理                           │
│               /api/* ──→ orchestrator :8000                │
│                          │                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │           orchestrator (FastAPI :8000)              │  │
│  │  ├─ /api/v1/aggregator/dashboard                  │  │
│  │  ├─ /api/v1/aggregator/generate                   │  │
│  │  ├─ /api/auth/*                                   │  │
│  │  ├─ /api/jobs/*                                   │  │
│  │  └─ 转发至各子模块                                   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 3.2 技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 框架 | Next.js 15 (App Router) | 成熟 React 全栈框架，生态完善 |
| 语言 | TypeScript | 类型安全，与后端 shared-models 合约对齐 |
| 样式 | Tailwind CSS 3.4 + tailwindcss-animate | 原子化 CSS，快速迭代 |
| 图标 | lucide-react | 轻量 SVG 图标库，树摇友好 |
| 类合并 | clsx + tailwind-merge + class-variance-authority | 条件样式组合，UI 组件基础设施 |
| 部署 | `next build` → `next start` (standalone) | 零运行时依赖，适用 ECS 部署 |

### 3.3 目录结构

```
unified-frontend/
├── next.config.ts               # 配置：standalone 输出 + API 代理
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .gitignore
├── .clinerules                  # 项目硬约束规则
├── docs/
│   └── PRD.md                   # 本文档
└── src/
    ├── app/
    │   ├── layout.tsx           # 根布局，全局 metadata
    │   ├── globals.css          # 全局样式
    │   ├── page.tsx             # Dashboard 首页
    │   ├── login/page.tsx       # 登录页（无侧边栏）
    │   ├── content/page.tsx     # 内容管理页
    │   ├── generate/page.tsx    # 视频生成页（三步向导）
    │   ├── publish/page.tsx     # 发布管理页
    │   └── settings/page.tsx    # 设置页
    ├── components/
    │   ├── AppLayout.tsx        # 应用布局（侧边栏导航）
    │   └── ui.tsx               # 共享 UI 组件库
    └── lib/
        └── api.ts               # API 封装 + 数据类型定义
```

### 3.4 API 调用规范

所有 API 请求通过 `@/lib/api.ts` 中的 `request<T>()` 封装函数：

```typescript
async function request<T>(path: string, options?: RequestInit): Promise<T>
```

- 统一处理 `Authorization: Bearer <token>` 请求头（从 localStorage 读取）
- 统一处理 `Content-Type: application/json`
- 非 2xx 响应抛出 `Error("${status}: ${body}")` 异常
- 所有 API 函数（`getDashboard`、`getGenerateOptions`、`submitGenerate` 等）基于 `request` 封装

TypeScript 类型定义（`DashboardData`、`GenerateOptions`、`GenerateRequest`、`JobStatus`、`UserProfile`、`ApiKey`）与 API 函数共存于 `@/lib/api.ts`。

### 3.5 状态管理

- **无第三方状态管理库**：使用 React useState + useCallback + useEffect
- **组件级别状态**：每个页面独立管理 loading/error/data 三态
- **认证状态**：localStorage token 存储，401 响应自动跳转 `/login`
- **轮询**：Generate 页面 3 秒轮询，Publish 页面 5 秒轮询（存在活跃任务时）

### 3.6 三态渲染模式

每个"use client"页面必须覆盖三种状态：

| 状态 | 渲染方式 |
|------|----------|
| **Loading** | Skeleton 骨架屏（`CardSkeleton`、`ListSkeleton`、`PageSkeleton`） |
| **Error** | `ErrorState` 组件 + 重试按钮 |
| **Empty** | `EmptyState` 组件 + 引导文字/操作按钮 |

此外，使用 `redirected` 标志守卫模式防止 React finally 块竞态问题：

```typescript
let redirected = false;
try {
  // API 调用
} catch (err) {
  if (err.message?.startsWith("401")) { redirected = true; router.push("/login"); return; }
  setError(err);
} finally {
  if (!redirected) setLoading(false);
}
```

### 3.7 共享 UI 组件

位置: `@/components/ui.tsx`

| 组件 | 用途 |
|------|------|
| `CardSkeleton` | 卡片布局骨架屏（可配列数） |
| `ListSkeleton` | 列表布局骨架屏（可配行数） |
| `PageSkeleton` | 完整页面骨架屏（标题 + 卡片 + 列表组合） |
| `EmptyState` | 空态展示（可配图标、标题、描述、操作按钮） |
| `ErrorState` | 错误状态展示（可配错误信息和重试回调） |
| `StatusBadge` | 状态标签（自动映射颜色：done=绿、processing=蓝、pending=黄、failed=红） |

---

## 四、非功能需求

### 4.1 性能

| 指标 | 目标 |
|------|------|
| 首页加载 | TTV < 2s（SSR 首屏） |
| 页面切换 | SPA 级即时切换（Next.js 客户端导航） |
| API 响应 | 聚合接口 < 500ms |
| 轮询间隔 | Generate: 3s / Publish: 5s |
| 构建产物 | standalone 输出 < 50MB |

### 4.2 可用性

| 要求 | 说明 |
|------|------|
| 三态覆盖 | 所有数据加载页面必须实现 loading/error/empty |
| 登录兜底 | token 不存在或 401 时统一跳转 `/login` |
| 重试机制 | 加载失败页面提供重试按钮 |
| 响应式布局 | 侧边栏 + 主内容区适配桌面浏览器 |
| 中文界面 | 全界面中文显示 |

### 4.3 安全性

| 要求 | 说明 |
|------|------|
| Token 存储 | JWT 存储在 localStorage，请求时附加 Authorization 头 |
| 路由保护 | 未登录状态自动跳转登录页 |
| 无敏感信息 | 前端不存储密钥，仅展示 Key 前缀 |
| API 代理 | 所有 `/api/*` 请求通过 nginx 转发，不直接暴露后端端口 |

### 4.4 可维护性

| 要求 | 说明 |
|------|------|
| 组件复用 | 共享 UI 组件统一在 `@/components/ui.tsx` 中 |
| API 封装 | 所有后端请求集中管理在 `@/lib/api.ts` |
| 类型定义 | API 响应类型与函数共存，方便同步更新 |
| 硬约束 | 遵循 `.clinerules` 中的架构纪律（三态覆盖、API 封装、redirected 守卫） |

---

## 五、部署架构

### 5.1 生产环境

```
用户 (HTTPS :443)
    │
    ▼
Nginx (阿里云 ECS, :80 → HTTPS :443)
    │
    ├── /api/*  ──→ 反向代理 ──→ orchestrator (localhost:8000)
    │
    └── /  ──→ 反向代理 ──→ Next.js standalone (localhost:3000)
                       ├── next start（生产模式）
                       ├── systemd 进程保活
                       └── standalone 输出（含 .next/standalone/）
```

### 5.2 构建与部署流程

```bash
# 1. 构建
next build                              # 输出 .next/standalone/

# 2. 部署
rsync .next/standalone/ 服务器:/app/unified-frontend/
cp -r public/ .next/static/ 服务器:/app/unified-frontend/

# 3. 启动
node /app/unified-frontend/server.js    # 监听 :3000
```

### 5.3 运行环境

| 参数 | 值 |
|------|-----|
| Node.js | >= 18.17（推荐 20.x LTS） |
| 监听端口 | 3000 |
| 环境变量 | `NEXT_PUBLIC_API_URL=http://localhost:8000` |
| 进程管理 | systemd service |
| 资源限制 | 内存 < 256MB，磁盘 < 200MB |

### 5.4 Rewrites 配置

`next.config.ts` 中配置开发环境 API 代理：

```typescript
async rewrites() {
  return [{
    source: "/api/:path*",
    destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
  }];
}
```

生产环境由 nginx 统一处理 `/api/*` 的代理，Next.js 仅作为静态/SSR 服务运行。

---

## 六、当前状态和路线图

### 6.1 当前状态 (v0.1.0 MVP)

- [x] 5 个页面完整实现（Dashboard / Content / Generate / Publish / Settings）
- [x] 登录页面 + Token 认证
- [x] 所有页面三态覆盖（loading/error/empty）
- [x] `redirected` 守卫模式修复 React finally 竞态
- [x] 共享 UI 组件库（Skeleton / EmptyState / ErrorState / StatusBadge）
- [x] 统一 API 封装层 + TypeScript 类型定义
- [x] Standalone 构建输出
- [x] Nginx 反向代理配置
- [x] systemd 服务 + 进程保活
- [x] ECS 生产部署已完成

### 6.2 路线图

| 阶段 | 内容 | 状态 |
|------|------|------|
| **v0.1.0 MVP** | 5 页面 + 登录 + 三态覆盖 + 部署上线 | ✅ 已完成 |
| **v0.2.0 体验优化** | 响应式移动端适配、暗色模式、页面过渡动画 | ✅ 已完成 |
| **v0.3.0 功能增强** | Generate 页面文件上传功能开放、批量操作、数据导出 | ✅ 已完成 |
| **v0.4.0 高级功能** | 数据可视化图表（Chart.js）、发布统计报表、历史趋势 | ✅ 已完成 |
| **v0.4.1 批量生成** | 多文章一次性提交 + 多进度追踪 | ✅ 已完成 |
| **v1.0.0 正式版** | 完整测试覆盖、CI/CD 自动化构建、性能优化、国际化 | 📅 规划中 |

### 6.3 已知限制

- 批量生成（多篇文章一次提交）✅ 已实现（v0.4.1）
- 移动端适配未完成（当前优化桌面端体验）
- 无离线支持（PWA 不在此阶段范围）
- 无国际化支持（界面固定简体中文）
- 无端到端测试覆盖

---

## 七、与各模块集成

```
                  unified-frontend (Next.js 3000)
                          │
                    nginx 反向代理
                          │
              ┌───────────┴───────────┐
              │                       │
        orchestrator (8000)      其他微服务
              │
    ┌─────────┼──────────┬────────────┐
    │         │          │            │
  auth    jobs     aggregator    trendscope
  /api/auth  /api/jobs  /api/v1/     /api/v1/
                         aggregator    trending
```

| 模块 | 集成方式 | API 端点 |
|------|----------|----------|
| **orchestrator** | nginx 代理全部 `/api/*` 请求 | 统一入口 |
| **认证系统** | JWT Token，localStorage 存储 | `POST /api/auth/login`、`GET /api/auth/profile` |
| **任务系统** | REST API + 前端轮询 | `GET /api/jobs`、`POST /api/jobs/{id}/retry` |
| **聚合数据** | orchestrator 提供的聚合 API | `GET /api/v1/aggregator/dashboard`、`/generate` |
| **内容采集** | 通过 content-aggregator 间接集成 | 无直接前端 API 调用 |
| **视频合成** | 通过 orchestrator BackgroundTask 异步调用 | `POST /api/v1/aggregator/generate` |
| **多平台发布** | 由 Multi-Publish 桌面端独立完成 | 无浏览器端 API 调用 |
