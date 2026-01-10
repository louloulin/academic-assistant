# Academic Assistant - 项目架构说明

## 🏗️ Bun Workspaces 架构

本项目使用 **Bun Workspaces** 进行 Monorepo 管理，具有以下优势：

- ⚡ **极速安装**: Bun 的包管理器比 pnpm/npm 快 10-100 倍
- 🔗 **Workspace协议**: 通过 `workspace:*` 引用内部包
- 📦 **统一依赖**: 所有包共享 node_modules
- 🔄 **热重载**: Bun 的原生 watch 模式

## 📂 目录结构详解

```
academic-assistant/
├── 📄 package.json              # 根配置（workspaces定义）
├── 📄 bun.lockb                 # Bun lock文件
├── 📄 tsconfig.json             # TypeScript根配置
├── 📄 prettier.config.js        # 代码格式化配置
├── 📄 .gitignore                # Git忽略文件
│
├── 📂 apps/                     # 应用层
│   ├── 📂 web/                  # Next.js 前端应用
│   │   ├── package.json         # 依赖: next, react, @assistant/*
│   │   ├── next.config.js       # Next.js 配置
│   │   ├── tailwind.config.ts   # Tailwind CSS 配置
│   │   └── src/
│   │       ├── app/             # App Router 页面
│   │       ├── components/      # React 组件
│   │       └── lib/             # 前端工具函数
│   │
│   └── 📂 api/                  # Bun API 服务
│       ├── package.json         # 依赖: hono, @assistant/*
│       └── src/
│           ├── routes/          # API 路由
│           ├── services/        # 业务逻辑
│           └── middleware/      # 中间件
│
├── 📂 packages/                 # 核心包层
│   ├── 📂 core/                 # 核心类型和接口
│   │   ├── package.json         # 依赖: zod
│   │   └── src/
│   │       ├── types/           # Agent, Skill, Task, MCP 类型
│   │       ├── interfaces/      # IAgent, ISkill, IMCPClient
│   │       ├── constants/       # Agent类型、常量
│   │       └── utils/           # 验证工具
│   │
│   ├── 📂 utils/                # 工具函数
│   │   ├── package.json         # 依赖: pino, ioredis, @assistant/core
│   │   └── src/
│   │       ├── logger/          # Pino 日志封装
│   │       ├── cache/           # Redis/Memory 缓存
│   │       └── validation/      # 验证函数
│   │
│   ├── 📂 skills/               # 8个核心 Skills
│   │   ├── package.json         # 依赖: @assistant/core, mcp-client, utils
│   │   └── src/
│   │       ├── literature-search/      # 文献搜索 Skill
│   │       ├── literature-review/       # 文献综述 Skill
│   │       ├── paper-structure/         # 论文结构 Skill
│   │       ├── citation-manager/        # 引用管理 Skill
│   │       ├── writing-quality/         # 写作质量 Skill
│   │       ├── peer-review/             # 同行评审 Skill
│   │       ├── data-analysis/           # 数据分析 Skill
│   │       └── journal-submission/      # 期刊投稿 Skill
│   │
│   ├── 📂 agents/               # Agent 系统
│   │   ├── package.json         # 依赖: @assistant/core, skills, mcp-client, utils
│   │   └── src/
│   │       ├── base/            # BaseAgent 抽象类
│   │       ├── workflow-manager/ # 工作流管理 Agent
│   │       └── research-team/   # 研究团队 Agent
│   │
│   └── 📂 mcp-client/           # MCP 客户端
│       ├── package.json         # 依赖: @modelcontextprotocol/sdk, @assistant/core
│       └── src/
│           ├── client/          # MCPClient 实现
│           ├── transport/       # 传输层抽象
│           └── discovery/       # 服务发现
│
├── 📂 packages/mcp-servers/     # Rust MCP 服务器（Cargo Workspace）
│   ├── Cargo.toml               # Workspace 配置
│   ├── 📂 shared/               # 共享库
│   │   ├── Cargo.toml
│   │   └── src/lib.rs           # 类型、工具函数
│   ├── 📂 literature-search/    # 文献搜索服务器
│   │   ├── Cargo.toml
│   │   └── src/main.rs
│   └── 📂 citation-manager/     # 引用管理服务器
│       ├── Cargo.toml
│       └── src/main.rs
│
└── 📂 tools/                   # 工具
    └── 📂 rust-ffi-bridge/      # Rust FFI 桥接
        └── package.json         # 依赖: @assistant/core
```

## 🔄 包依赖关系

```
依赖方向（从上到下）:

┌─────────────────────────────────────────┐
│  apps/web (Next.js)                     │
│  ↓ depends on                           │
├─────────────────────────────────────────┤
│  apps/api (Bun + Hono)                  │
│  ↓ depends on                           │
├─────────────────────────────────────────┤
│  packages/agents                        │
│  ↓ depends on                           │
├─────────────────────────────────────────┤
│  packages/skills                        │
│  ↓ depends on                           │
├─────────────────────────────────────────┤
│  packages/mcp-client + packages/utils   │
│  ↓ depends on                           │
├─────────────────────────────────────────┤
│  packages/core                          │
└─────────────────────────────────────────┘

独立模块:
├── packages/mcp-servers (Rust - 独立编译)
└── tools/rust-ffi-bridge (TypeScript-Rust 桥接)
```

## 🚀 开发命令

### 根目录命令

```bash
# 安装所有依赖
bun install

# 开发模式（启动所有服务）
bun run dev

# 构建所有包
bun run build

# 运行测试
bun run test

# 代码检查
bun run lint

# 代码格式化
bun run format

# 清理构建产物
bun run clean
```

### 单独包命令

```bash
# 开发特定包
bun run --filter @assistant/web dev
bun run --filter @assistant/api dev
bun run --filter @assistant/core build

# 添加依赖到特定包
bun add <package> --filter @assistant/web
bun add <package> --filter @assistant/api
```

## 📦 Workspace 依赖引用

在 `package.json` 中引用其他 workspace 包：

```json
{
  "dependencies": {
    "@assistant/core": "workspace:*",
    "@assistant/utils": "workspace:*",
    "@assistant/skills": "workspace:*"
  }
}
```

Bun 会自动解析 `workspace:*` 为正确的版本号。

## 🦀 Rust Workspace 配置

```toml
# packages/mcp-servers/Cargo.toml
[workspace]
resolver = "2"
members = [
    "shared",
    "literature-search",
    "citation-manager"
]

[workspace.dependencies]
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
# ... 共享依赖
```

每个成员包可以引用 workspace 依赖：

```toml
[dependencies]
academic-assistant-shared = { path = "../shared" }
tokio = { workspace = true }
```

## 🎯 下一步

1. **实现 Core 包类型定义**
   ```bash
   cd packages/core
   # 创建 src/types/agent.ts, skill.ts 等
   ```

2. **实现第一个 Skill**
   ```bash
   cd packages/skills/src/literature-search
   # 创建 skill.ts
   ```

3. **构建 Rust MCP 服务器**
   ```bash
   cd packages/mcp-servers
   cargo build --release
   ```

4. **启动开发环境**
   ```bash
   bun run dev
   ```

---

**最后更新**: 2025-01-10
**版本**: 1.0.0
**状态**: ✅ 架构搭建完成
