# unified-frontend — 开发流程规范

> 一站式视频生成平台统一前端（Next.js 15 + React 18）。AI 工具启动时自动读取。

---

## 核心原则

1. **Server Component First**：默认无状态渲染，仅在交互需要时用 'use client'
2. **三态 mandatory**：所有 'use client' 组件必须实现 loading / error / empty 三态
3. **API 隔离**：所有后端调用走 `@/lib/api` 封装层，组件不直接 fetch
4. **TDD**：新增功能必须有测试覆盖
5. **先文档再代码**：没有 PRD 不动手，没有架构设计不动手

## AI 角色分工

| 角色 | 阶段 | 产出物 |
|------|------|--------|
| **PM** | 需求分析 | PRD、页面规格、路由设计 |
| **架构师** | 技术设计 | 组件树、数据流、渲染策略（Server/Client） |
| **开发工程师** | 编码实现 | 页面、组件、Hooks + 测试（TDD） |
| **QA** | 质量验证 | 组件测试、E2E 测试、响应式验证 |
| **CTO** | 代码评审 | 安全审查、性能审查、SEO 审查 |

## 7 阶段开发流程

### 阶段 1：想法澄清
确认：新增页面的目标用户、数据来源、渲染策略（SSR/SSG/CSR）

### 阶段 2：PRD（PM）
产出：PRD 或变更说明，包含：
- 功能描述（P0/P1/P2）
- 页面路由和参数
- 验收标准

**批准后才能进入下一阶段。**

### 阶段 3：技术设计（架构师）
产出：方案对比 + 推荐方案
- 组件树设计
- Server/Client Component 拆分
- API 接口定义
- 状态管理策略

**原则：选最简单的方案，Server Component 优先。**

### 阶段 4：开发计划（PM）
拆成 ≤4h 的任务，标注依赖关系。

### 阶段 5：编码实现（开发 + TDD）

#### 新增页面流程
1. 在 `src/app/` 下新建页面路由
2. Server Component 负责数据获取和初始渲染
3. Client Component 负责交互和状态管理
4. API 调用通过 `@/lib/api` 封装
5. 在 `AppLayout` 侧边栏注册导航入口

#### 新增组件流程
1. 在 `src/components/` 下新建组件
2. 判断 Server/Client：有交互 → Client（'use client'）
3. 'use client' 组件必须实现 loading / error / empty 三态
4. finally 块中 setLoading(false) 必须有 redirected 标志守卫
5. 先写测试（vitest），再写组件

### 阶段 6：代码评审（CTO）
必检项：
- 🔴 API Key / Token 是否硬编码（必须环境变量）
- 🔴 Token 过期是否统一走 router.push('/login')
- 🟠 所有 API 调用是否走 @/lib/api 封装
- 🟠 'use client' 组件是否实现三态
- 🟢 新增页面是否注册到 AppLayout 导航
- 🟢 文档是否同步更新

CRITICAL 必须修复才能继续。

### 阶段 7：发布
- 更新 CHANGELOG.md
- `npm run build` 通过（无 TS 错误）
- `npm test` 全部通过
- git 提交并 tag
- 部署后验证 CI 正常

## 质量门禁

**PRD 阶段**：页面规格清晰 / 路由设计完整 / 验收标准可验证
**设计阶段**：最简单方案 / Server Component 优先 / 组件树明确
**开发阶段**：三态实现完整 / 测试全通过 / `npm run build` 通过
**Review 阶段**：CRITICAL 问题已修复 / API 隔离合规
**发布阶段**：CHANGELOG 更新 / 构建测试通过 / CI 正常

## TDD 流程

```
RED   → 在 src/__tests__/ 下写失败测试
         组件测试：vitest + @testing-library/react
         页面测试：vitest + next navigation mock
GREEN → 最小实现让测试通过
REFACTOR → 重构，保持测试通过
```

### 测试组织

```
src/__tests__/
+-- components/          # 组件测试
+-- pages/               # 页面测试
+-- lib/                 # API 封装层测试
+-- utils/               # 工具函数测试
```

### 测试规范

```tsx
// src/__tests__/components/LoginForm.test.tsx
import { render, screen } from '@testing-library/react'
import LoginForm from '@/components/LoginForm'

describe('LoginForm', () => {
  it('shows loading state', () => {
    render(<LoginForm />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
```

## 提交规范

```
feat(settings): 添加订阅用量卡片
fix(login): 修复 token 过期重定向
docs: 更新 API 路由文档
refactor: 统一 API 封装层
```

## 文档清单

| 文件 | 路径 | 说明 |
|------|------|------|
| AGENTS.md | `./AGENTS.md` | 本文件，开发流程规范 |
| CLAUDE.md | `./CLAUDE.md` | 项目上下文和开发命令 |
| ARCHITECTURE.md | `./docs/ARCHITECTURE.md` | 架构设计文档 |
| DESIGN.md | `./docs/DESIGN.md` | 设计决策文档 |

## 开发命令

```bash
npm run dev       # 开发服务器
npm run build     # 生产构建
npm test          # 运行测试
npm run lint      # 代码检查
```

## 版本

**v0.1.0** — Phase 1：统一前端 MVP，集成 orchestrator SSO 认证 + 用户设置
