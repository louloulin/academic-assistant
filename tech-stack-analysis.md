# 论文助手技术栈分析与架构设计

## 执行摘要

基于深入的技术调研和项目需求分析，本报告推荐采用 **混合架构**：以 **Bun + TypeScript** 为主实现核心功能，以 **Rust** 实现高性能MCP服务器。这种混合方案能够在开发效率、性能和可维护性之间取得最佳平衡。

---

## 1. 技术栈对比分析

### 1.1 Bun + TypeScript vs Rust

#### 性能对比

| 维度 | Bun + TypeScript | Rust |
|------|------------------|------|
| **启动速度** | 极快（~10ms）| 快（~50ms）|
| **运行时性能** | 良好（JIT优化）| 优秀（原生编译）|
| **内存占用** | 中等（~50-100MB）| 低（~5-20MB）|
| **并发处理** | 优秀（事件循环）| 卓越（async/await）|
| **CPU密集任务** | 中等 | 卓越 |
| **I/O密集任务** | 优秀 | 优秀 |

#### 开发效率对比

| 维度 | Bun + TypeScript | Rust |
|------|------------------|------|
| **学习曲线** | 低（JS/TS背景）| 高（需要学习所有权、借用等）|
| **开发速度** | 快（快速迭代）| 中等（编译时间长）|
| **调试体验** | 优秀（动态调试）| 良好（需要熟悉工具链）|
| **生态成熟度** | 卓越（npm生态）| 良好（crates.io）|
| **第三方库** | 极多 | 适中 |
| **MCP SDK支持** | 官方SDK（Python/TS）| 官方Rust SDK |

#### Claude Agent SDK集成

**关键发现**：
- **Anthropic于2025年12月收购Bun**，Bun将成为Claude Code和Claude Agent SDK的基础运行时
- Claude Agent SDK官方支持Python和TypeScript
- Rust有官方MCP SDK，但Claude Agent SDK集成需要额外适配

### 1.2 基准测试数据

根据搜索结果的性能测试：

**JWT签名/验证测试（100万次）**：
- Rust: ~1.5秒
- Bun: ~23秒
- 性能差距：**约15倍**

**HTTP服务器性能**：
- Rust框架（如Axum、Actix）：领先
- Bun：竞争性强，接近Node.js但更优
- 结论：Rust在高并发场景下有显著优势

### 1.3 MCP服务器实现成熟度

**Rust MCP生态系统**：
- 官方Rust SDK: [github.com/modelcontextprotocol/rust-sdk](https://github.com/modelcontextprotocol/rust-sdk)
- 主要crates:
  - `mcp-server` - 官方服务器实现
  - `rust-mcp-sdk` - 核心MCP实现
  - `modelcontextprotocol-server` - 替代服务器实现
  - `ultrafast-mcp` - 高性能实现
- 成熟度：高，多个生产级实现

**TypeScript/JavaScript MCP**：
- 官方SDK（Node.js/Bun）
- 社区活跃度高
- 与Claude Agent SDK无缝集成

---

## 2. 混合架构推荐方案

### 2.1 整体架构设计

采用 **模块化单体（Modular Monolith）** 架构，遵循高内聚低耦合原则：

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│              (Bun + TypeScript/React)                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              API Gateway / Orchestrator                  │
│              (Bun + TypeScript)                          │
│        - Claude Agent SDK Integration                    │
│        - Workflow Management                             │
│        - Agent Coordination                              │
└─────┬───────────────┬───────────────┬───────────────────┘
      │               │               │
┌─────┴─────┐   ┌─────┴─────┐   ┌───┴───────────────────┐
│  Skills   │   │  Agents   │   │  MCP Client Layer      │
│  (TS)     │   │  (TS)     │   │  (TS + Rust Bridge)    │
└───────────┘   └───────────┘   └───┬───────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │         MCP Server Layer              │
                    └───────────────────┬───────────────────┘
                                        │
      ┌─────────────────┬───────────────┼───────────────┬──────────────┐
      │                 │               │               │              │
┌─────┴─────┐   ┌──────┴──────┐  ┌─────┴─────┐  ┌─────┴─────┐  ┌───┴──────┐
│Literature │   │  Citation   │  │ Semantic  │  │  Custom   │  │  Shared  │
│  Search   │   │  Manager    │  │ Scholar   │  │   Tools   │  │  State   │
│ (Rust)    │   │  (Rust)     │  │  (Rust)   │  │  (Rust)   │  │ (Rust)   │
└───────────┘   └─────────────┘  └───────────┘  └───────────┘  └──────────┘
```

### 2.2 模块职责划分

#### 核心原则：高内聚低耦合

**高内聚**：
- 每个模块有单一、明确的职责
- 相关功能聚合在同一模块内
- 数据和行为封装在一起

**低耦合**：
- 模块间通过明确的接口通信
- 使用依赖注入而不是直接依赖
- 事件驱动架构减少直接调用

### 2.3 技术栈分层

#### Layer 1: 前端层（Bun + TypeScript）
**职责**：
- 用户界面
- 交互逻辑
- 状态管理

**技术**：
- Bun运行时
- TypeScript
- React/Next.js
- TailwindCSS

#### Layer 2: 编排层（Bun + TypeScript）
**职责**：
- Claude Agent SDK集成
- Agent工作流管理
- Skills调度
- 请求路由

**技术**：
- Bun运行时
- TypeScript
- Claude Agent SDK
- 状态机（XState）

#### Layer 3: Skills层（TypeScript）
**职责**：
- 实现8个核心Skills
- 业务逻辑封装
- Agent能力实现

**技术**：
- TypeScript
- SKILL.md规范
- 工具函数库

#### Layer 4: MCP客户端层（TypeScript + Rust FFI）
**职责**：
- MCP协议通信
- 服务发现
- 负载均衡
- 错误处理

**技术**：
- TypeScript（主要）
- Rust FFI（性能关键路径）
- gRPC/HTTP2

#### Layer 5: MCP服务器层（Rust）
**职责**：
- 学术数据库连接
- PDF解析
- 高性能计算
- 缓存管理

**技术**：
- Rust
- Tokio（异步运行时）
- MCP官方SDK
- 专业库（PDF解析、HTTP客户端等）

---

## 3. 模块化架构设计

### 3.1 Monorepo结构

使用 **Turborepo** + **pnpm** 实现模块化单体：

```
academic-assistant/
├── apps/
│   ├── web/                          # 前端应用
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                          # API服务（Bun + TypeScript）
│       ├── src/
│       │   ├── orchestrator/         # 编排层
│       │   ├── agents/               # Agent实现
│       │   └── routes/               # API路由
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── core/                         # 核心类型和接口
│   │   ├── src/
│   │   │   ├── types/                # 共享类型定义
│   │   │   ├── interfaces/           # 接口定义
│   │   │   └── constants/            # 常量
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── skills/                       # Skills实现
│   │   ├── src/
│   │   │   ├── literature-search/    # 文献搜索Skill
│   │   │   ├── literature-review/    # 文献综述Skill
│   │   │   ├── paper-structure/      # 论文结构Skill
│   │   │   ├── citation-manager/     # 引用管理Skill
│   │   │   ├── writing-quality/      # 写作质量Skill
│   │   │   ├── peer-review/          # 同行评审Skill
│   │   │   ├── data-analysis/        # 数据分析Skill
│   │   │   └── journal-submission/   # 期刊投稿Skill
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── agents/                       # Agent实现
│   │   ├── src/
│   │   │   ├── workflow-manager/     # 工作流管理Agent
│   │   │   ├── research-team/        # 研究团队Agent
│   │   │   └── base/                 # 基础Agent类
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mcp-client/                   # MCP客户端（TypeScript）
│   │   ├── src/
│   │   │   ├── client/               # MCP客户端实现
│   │   │   ├── transport/            # 传输层抽象
│   │   │   └── discovery/            # 服务发现
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mcp-servers/                  # MCP服务器（Rust）
│   │   ├── literature-search/        # 文献搜索服务器
│   │   │   ├── Cargo.toml
│   │   │   └── src/
│   │   ├── citation-manager/         # 引用管理服务器
│   │   │   ├── Cargo.toml
│   │   │   └── src/
│   │   ├── pdf-parser/               # PDF解析服务器
│   │   │   ├── Cargo.toml
│   │   │   └── src/
│   │   └── shared/                   # Rust共享库
│   │       ├── Cargo.toml
│   │       └── src/
│   │
│   └── utils/                        # 工具函数
│       ├── src/
│       │   ├── logger/               # 日志工具
│       │   ├── cache/                # 缓存工具
│       │   └── validation/           # 验证工具
│       ├── package.json
│       └── tsconfig.json
│
├── tools/
│   ├── rust-ffi-bridge/              # Rust FFI桥接
│   │   ├── Cargo.toml
│   │   └── src/
│   │
├── package.json                      # 根package.json
├── pnpm-workspace.yaml               # pnpm工作区配置
├── turbo.json                        # Turborepo配置
└── tsconfig.json                     # 根TypeScript配置
```

### 3.2 模块间通信

#### 3.2.1 同步通信：依赖注入

```typescript
// packages/core/src/interfaces/agent.interface.ts
export interface IAgent {
  id: string;
  type: AgentType;
  execute(task: Task): Promise<Result>;
  getStatus(): AgentStatus;
}

// packages/agents/src/workflow-manager/manager.ts
export class WorkflowManager implements IAgent {
  constructor(
    private skills: Map<string, ISkill>,
    private mcpClient: IMCPClient,
    private eventBus: IEventBus
  ) {}
}
```

#### 3.2.2 异步通信：事件总线

```typescript
// packages/core/src/events/event-bus.ts
export class EventBus {
  private subscribers: Map<string, Set<EventHandler>>;

  subscribe(event: string, handler: EventHandler): void;
  publish(event: string, data: unknown): Promise<void>;
}

// 事件驱动示例
await eventBus.publish('literature.search.completed', {
  query: 'machine learning',
  results: [...]
});
```

#### 3.2.3 MCP通信：协议抽象

```typescript
// packages/mcp-client/src/client/mcp-client.ts
export interface IMCPClient {
  callServer(serverName: string, method: string, params: unknown): Promise<unknown>;
  listServers(): Promise<string[]>;
  getServerInfo(serverName: string): Promise<ServerInfo>;
}

// Rust MCP服务器通过FFI暴露
// tools/rust-ffi-bridge/src/lib.rs
#[no_mangle]
pub extern "C" fn mcp_call_server(
  server_name: *const c_char,
  method: *const c_char,
  params: *const c_char,
) -> *mut c_char {
  // Rust实现
}
```

### 3.3 依赖规则

**依赖方向**（从下到上）：
```
Frontend (Web)
    ↓
API Gateway
    ↓
Agents
    ↓
Skills
    ↓
MCP Client
    ↓
MCP Servers (Rust)
```

**关键规则**：
1. 上层可以依赖下层
2. 下层不能依赖上层
3. 同层之间通过接口通信
4. 使用依赖注入打破具体依赖

### 3.4 边界保护

**TypeScript Project References**：
```json
// tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/skills" },
    { "path": "./packages/agents" },
    { "path": "./packages/mcp-client" }
  ]
}
```

**ESLint Boundaries Plugin**：
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['boundaries'],
  rules: {
    'boundaries/element-types': [
      'error',
      {
        rules: [
          {
            from: 'skills',
            allow: ['core', 'utils']
          },
          {
            from: 'agents',
            allow: ['core', 'skills', 'utils']
          }
        ]
      }
    ]
  }
};
```

---

## 4. Rust MCP服务器实现

### 4.1 为什么使用Rust实现MCP服务器

**优势**：
1. **性能**：CPU密集型任务（PDF解析、文本分析）性能提升10-15倍
2. **内存安全**：编译时保证，避免运行时错误
3. **并发**：Tokio运行时提供高效的异步I/O
4. **生态**：成熟的MCP SDK和学术处理库

**适用场景**：
- 文献数据库连接（ArXiv、Semantic Scholar）
- PDF解析和内容提取
- 引用格式化和验证
- 大规模文本处理
- 缓存和状态管理

### 4.2 Rust MCP服务器架构

```rust
// crates/literature-search-mcp/src/main.rs
use rmcp::Server;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let server = Server::new("literature-search")
        .tool("search_arxiv", search_arxiv)
        .tool("search_semantic_scholar", search_semantic_scholar)
        .tool("parse_pdf", parse_pdf)
        .run()
        .await?;

    Ok(())
}

async fn search_arxiv(params: SearchParams) -> Result<Paper, Error> {
    // 高性能实现
    let client = ArXivClient::new();
    let results = client.search(&params.query).await?;

    Ok(results)
}
```

### 4.3 Rust共享库

```rust
// crates/shared/src/lib.rs
pub mod citation;
pub mod pdf;
pub mod cache;

// 提供FFI接口供TypeScript调用
#[no_mangle]
pub extern "C" fn format_citation_apa(
    metadata: *const PaperMetadata,
) -> *mut c_char {
    let metadata = unsafe { &*metadata };
    let citation = citation::format_apa(metadata);
    std::ffi::CString::new(citation)
        .unwrap()
        .into_raw()
}
```

### 4.4 性能优化策略

1. **连接池**：数据库和HTTP客户端连接复用
2. **缓存**：使用Redis或内存缓存减少重复计算
3. **并行处理**：Tokio的异步任务并行
4. **零拷贝**：避免不必要的内存分配
5. **SIMD**：文本处理使用向量化指令

---

## 5. TypeScript Skills实现

### 5.1 Skill模板

```typescript
// packages/skills/src/literature-search/skill.ts
import { ISkill } from '@assistant/core';
import { IMCPClient } from '@assistant/mcp-client';

export interface LiteratureSearchSkillConfig {
  mcpClient: IMCPClient;
  maxResults: number;
}

export class LiteratureSearchSkill implements ISkill {
  id = 'literature-search';
  name = 'Literature Search';
  description = 'Search academic papers from multiple sources';

  constructor(private config: LiteratureSearchSkillConfig) {}

  async execute(input: SearchInput): Promise<SearchResult> {
    // 调用Rust MCP服务器
    const arxivResults = await this.config.mcpClient.callServer(
      'literature-search',
      'search_arxiv',
      input
    );

    const semanticResults = await this.config.mcpClient.callServer(
      'literature-search',
      'search_semantic_scholar',
      input
    );

    return this.mergeResults([arxivResults, semanticResults]);
  }

  private mergeResults(results: unknown[]): SearchResult {
    // 实现结果合并逻辑
  }
}
```

### 5.2 Agent实现

```typescript
// packages/agents/src/research-team/researcher.ts
import { IAgent } from '@assistant/core';
import { ISkill } from '@assistant/skills';

export class ResearcherAgent implements IAgent {
  id: string;
  type = AgentType.Researcher;

  constructor(
    private skills: Map<string, ISkill>,
    private expertise: string[]
  ) {}

  async execute(task: ResearchTask): Promise<ResearchResult> {
    // 1. 理解任务
    const plan = await this.planTask(task);

    // 2. 执行技能链
    const results = [];
    for (const step of plan.steps) {
      const skill = this.skills.get(step.skillId);
      if (!skill) continue;

      const result = await skill.execute(step.input);
      results.push(result);
    }

    // 3. 综合结果
    return this.synthesize(results);
  }

  private async planTask(task: ResearchTask): Promise<ExecutionPlan> {
    // 使用Claude Agent SDK规划任务
  }

  private synthesize(results: unknown[]): ResearchResult {
    // 综合多个结果
  }
}
```

### 5.3 Claude Agent SDK集成

```typescript
// apps/api/src/orchestrator/claude-agent.ts
import { Agent } from '@anthropic-ai/claude-agent-sdk';

export class ClaudeOrchestrator {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      apiKey: process.env.ANTHROPIC_API_KEY,
      tools: this.registerTools(),
      skills: this.registerSkills()
    });
  }

  async processUserRequest(request: UserRequest): Promise<Response> {
    const result = await this.agent.run({
      prompt: request.query,
      context: this.buildContext(request)
    });

    return this.formatResponse(result);
  }

  private registerTools() {
    return [
      {
        name: 'search_papers',
        description: 'Search academic papers',
        handler: async (params) => {
          return this.mcpClient.callServer('literature-search', 'search', params);
        }
      },
      // ... 其他工具
    ];
  }

  private registerSkills() {
    return [
      new LiteratureSearchSkill({ mcpClient: this.mcpClient }),
      new CitationManagerSkill({ mcpClient: this.mcpClient }),
      // ... 其他Skills
    ];
  }
}
```

---

## 6. 开发工具链

### 6.1 构建工具

**Turborepo配置**：
```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### 6.2 依赖管理

**pnpm workspace**：
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

**依赖规则**：
```json
// packages.json
{
  "scripts": {
    "check:deps": "npx depcheck",
    "check:circular": "npx madge --circular --extensions ts,tsx"
  }
}
```

### 6.3 代码质量

**ESLint + Prettier**：
```json
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'boundaries'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'boundaries/element-types': 'error'
  }
};
```

**Rust工具链**：
```toml
# .rustfmt.toml
max_width = 100
hard_tabs = false

# Clippy（默认）
# cargo clippy -- -D warnings
```

### 6.4 测试策略

**TypeScript测试**：
- 单元测试：Jest + ts-jest
- 集成测试：Vitest
- E2E测试：Playwright

**Rust测试**：
- 单元测试：内置 `cargo test`
- 集成测试：`tests/` 目录
- 基准测试：`criterion`

---

## 7. 部署策略

### 7.1 容器化

**Docker Compose开发环境**：
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./apps/api:/app
    depends_on:
      - redis
      - mcp-servers

  mcp-servers:
    build:
      context: .
      dockerfile: packages/mcp-servers/Dockerfile
    ports:
      - "8080:8080"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### 7.2 生产部署

**推荐方案**：
1. **前端**：Vercel/Netlify
2. **API**：Railway/Fly.io（Bun支持）
3. **MCP服务器**：AWS Lambda/Fly.io（Rust编译为WASM或原生）
4. **数据库**：PostgreSQL（Supabase）
5. **缓存**：Redis（Upstash）

---

## 8. 性能优化策略

### 8.1 TypeScript层

1. **代码分割**：动态导入减少初始包大小
2. **缓存**：React Query服务端状态缓存
3. **虚拟化**：react-window处理大列表
4. **Web Workers**：CPU密集任务移出主线程

### 8.2 Rust层

1. **异步I/O**：Tokio处理所有网络请求
2. **零拷贝**：避免不必要的数据复制
3. **连接池**：数据库和HTTP客户端连接复用
4. **编译优化**：release模式启用LTO

### 8.3 跨层优化

1. **FFI优化**：减少TypeScript-Rust边界调用
2. **批量处理**：聚合请求减少往返
3. **流式处理**：大数据集使用流式传输
4. **CDN**：静态资源全球分发

---

## 9. 风险评估与缓解

### 9.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Bun生态不成熟 | 中 | 低 | Anthropic收购后快速成熟，有Node.js后备 |
| Rust学习曲线 | 高 | 中 | 团队培训，渐进式采用 |
| TypeScript-Rust FFI复杂度 | 中 | 中 | 使用成熟库（napi-rs、neon）|
| MCP协议变更 | 中 | 低 | 使用官方SDK，关注更新 |

### 9.2 缓解策略

1. **渐进式迁移**：先用TypeScript实现核心功能，逐步将性能关键部分迁移到Rust
2. **抽象层**：使用接口隔离具体实现，便于切换
3. **监控**：全面的性能监控和错误追踪
4. **文档**：详细的架构文档和API文档

---

## 10. 实施路线图

### 阶段1：基础设施（2周）
- [ ] 设置Turborepo + pnpm monorepo
- [ ] 配置TypeScript Project References
- [ ] 实现核心类型和接口
- [ ] 设置CI/CD pipeline

### 阶段2：TypeScript核心（4周）
- [ ] 实现Claude Agent SDK集成
- [ ] 实现事件总线
- [ ] 实现基础Agent框架
- [ ] 实现2-3个核心Skills

### 阶段3：Rust MCP服务器（4周）
- [ ] 实现Rust MCP服务器框架
- [ ] 实现文献搜索服务器
- [ ] 实现PDF解析服务器
- [ ] 实现TypeScript-Rust FFI

### 阶段4：完整Skills（4周）
- [ ] 实现剩余5个Skills
- [ ] Agent工作流管理
- [ ] Artifact生成
- [ ] 前端界面

### 阶段5：优化与测试（2周）
- [ ] 性能优化
- [ ] 端到端测试
- [ ] 文档完善
- [ ] 生产部署

---

## 11. 总结

### 11.1 推荐方案

**混合架构：Bun + TypeScript (主要) + Rust (性能关键)**

**理由**：
1. **开发效率**：TypeScript快速迭代，Rust专注性能
2. **生态支持**：Claude Agent SDK官方支持TypeScript
3. **性能保障**：Rust处理CPU密集任务
4. **未来兼容**：Anthropic收购Bun，长期支持有保障

### 11.2 关键成功因素

1. **严格模块边界**：高内聚低耦合
2. **接口驱动**：依赖注入而非具体实现
3. **渐进式优化**：先实现功能，后优化性能
4. **团队协作**：TypeScript和Rust开发者协作

### 11.3 下一步行动

1. 确认技术栈选型
2. 搭建monorepo基础框架
3. 实现核心接口和类型
4. 开发第一个MCP服务器原型（Rust）
5. 集成Claude Agent SDK（TypeScript）

---

## 参考资料

### 技术栈对比
- [Bun vs Rust Performance](https://medium.com/deno-the-complete-reference/bun-vs-rust-how-faster-is-machine-code-compared-to-interpreted-code-for-jwt-sign-verify-3e870e458528)
- [Official Rust MCP SDK](https://github.com/modelcontextprotocol/rust-sdk)
- [Anthropic Acquires Bun](https://www.infoq.cn/article/swqprhlpohcxjx9dkj6u)

### 架构设计
- [Mastering Microservices Architecture 2025](https://medium.com/@shahriarhasan0_57376/mastering-microservices-architecture-in-2025-the-ultimate-guide-for-developers-0edf79c8be4b)
- [Loosely Coupled Monolith 2025](https://codeopinion.com/loosely-coupled-monolith-software-architecture-2025-edition/)
- [High Cohesion Low Coupling](https://levelup.gitconnected.com/high-cohesion-low-coupling-what-they-really-mean-in-system-design-991329e932b0)

### Monorepo实践
- [The Ultimate Guide to TypeScript Monorepos](https://dev.to/mxro/the-ultimate-guide-to-typescript-monorepos-5ap7)
- [Monorepo Architecture: The Ultimate Guide for 2025](https://feature-sliced.design/blog/frontend-monorepo-explained)
- [Best Practices for TypeScript Monorepo](https://atrociousblog.hashnode.dev/best-practices-for-typescript-monorepo)

### Rust MCP实现
- [MCP in Rust: A Practical Guide](https://hackmd.io/@Hamze/SytKkZP01l)
- [How to Build an MCP Server in Rust](https://oneuptime.com/blog/post/2026-01-07-rust-mcp-server/view)
- [UltraFast MCP Rust Implementation](https://docs.rs/ultrafast-mcp)

---

*文档创建时间: 2025-01-10*
*版本: 1.0*
*作者: AI Research Assistant*
