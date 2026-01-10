# Plan 2: 高内聚低耦合架构重构计划

## 文档信息

- **创建日期**: 2025-01-10
- **最后更新**: 2025-01-10（新增嵌入向量检索和 RAG 架构）
- **版本**: 2.1.0
- **基于**: Plan 1 真实实现完成后的架构分析
- **目标**: 构建符合 2025 年最佳实践的高内聚低耦合架构，集成智能语义搜索和 RAG 能力

---

## 执行摘要

基于 Plan 1 的真实实现，本文档通过全面分析现有代码、研究最新的 Claude Agent SDK 和 Subagent Skills 文档，制定了一套完整的架构重构计划，旨在构建**高内聚、低耦合**的企业级学术助手系统，并集成了**先进的嵌入向量检索和 RAG（检索增强生成）能力**。

### 核心改进目标

1. **高内聚**: 相关功能聚集在同一模块，职责单一
2. **低耦合**: 模块间依赖最小化，通过接口交互
3. **依赖倒置**: 高层模块不依赖低层模块，都依赖抽象
4. **可测试性**: 所有组件可独立测试
5. **可扩展性**: 新功能可以轻松添加，无需修改现有代码

### 🆕 新增功能（v2.1）

6. **智能语义搜索**: 基于 LibSQL 向量数据库的语义检索
7. **RAG 能力**: 使用 Claude Agent SDK 实现检索增强生成
8. **学术论文数据源集成**: OpenAlex、arXiv、Semantic Scholar 等开源数据
9. **混合检索**: 向量相似度 + BM25 全文搜索
10. **Agentic RAG**: 动态多轮迭代搜索策略

---

## 第一部分：现有架构分析

### 1.1 当前项目结构

```
academic-assistant/
├── packages/
│   ├── core/              # 核心类型和接口
│   ├── skills/            # Skills 实现（8个）
│   ├── agents/            # Agent 实现
│   ├── mcp-client/        # MCP 客户端
│   ├── utils/             # 工具函数
│   └── mcp-servers/       # Rust MCP 服务器
├── apps/
│   ├── web/               # Next.js 前端（未实现）
│   └── api/               # Bun API（未实现）
└── tools/                 # 构建工具
```

**总代码量**: 86 个 TypeScript/MJS 文件，5,765 行代码

### 1.2 已完成的核心功能（Plan 1）

✅ **真实 Claude Agent SDK 集成**
- `@anthropic-ai/claude-agent-sdk` v0.2.3
- 真实的文献搜索 Skill（`real-skill-v2.ts`）
- 6 个专业 Agents（`academic-assistant-real.mjs`）

✅ **MCP 协议实现**
- `RealMCPClient` 类（`real-mcp-client.ts`）
- Academia MCP Server 集成
- 双策略搜索（MCP + WebSearch）

✅ **测试覆盖**
- 20/20 测试通过（`test-real-implementation.test.mjs`）

### 1.3 识别的架构问题

#### 🔴 关键问题 1: 职责混乱（低内聚）

**问题示例**：
```typescript
// literature-search/real-skill-v2.ts (341 行)
export class LiteratureSearchSkill {
  // ❌ 混合了多个职责：
  // 1. MCP 连接管理
  // 2. Claude Agent 调用
  // 3. 结果解析和去重
  // 4. JSON 提取
  // 5. 搜索策略选择
}
```

**违反原则**: 单一职责原则（SRP）

**影响**:
- 难以测试（需要 mock MCP、Claude API、解析器）
- 难以复用（搜索逻辑、解析逻辑耦合在一起）
- 难以维护（修改一个功能可能影响其他功能）

---

#### 🔴 关键问题 2: 紧耦合（高耦合）

**问题示例 1: 直接依赖具体实现**
```typescript
// real-skill-v2.ts:6
import { realMCPClient, connectAcademicServers } from '../../../mcp-client/src/real-mcp-client';

// ❌ 直接导入单例，无法替换为测试 double
await connectAcademicServers(realMCPClient);
```

**违反原则**: 依赖倒置原则（DIP）

**问题示例 2: 硬编码依赖**
```typescript
// real-skill-v2.ts:47-99
const LITERATURE_SEARCH_AGENT: AgentDefinition = {
  description: '...',
  prompt: '...', // ❌ 硬编码 prompt，无法配置
  tools: ['WebSearch', 'WebFetch', 'Bash'], // ❌ 硬编码工具列表
  model: 'sonnet' // ❌ 硬编码模型
};
```

**影响**:
- 无法切换到不同的 MCP 实现
- 无法动态配置 Agent 参数
- 测试时需要真实的 API

---

#### 🔴 关键问题 3: 缺少抽象层

**问题**: 没有定义领域模型和服务接口

```typescript
// 当前：直接使用 Claude SDK 的类型
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

// ❌ 业务逻辑直接绑定到第三方 SDK
// 如果需要切换 SDK，需要修改所有代码
```

**应该有的抽象**:
```typescript
// 领域层接口
interface IAcademicSearchService {
  search(query: SearchQuery): Promise<Paper[]>;
}

interface ICitationService {
  format(paper: Paper, style: CitationStyle): Promise<string>;
}

// 实现层
class ClaudeAcademicSearchService implements IAcademicSearchService {
  // 使用 Claude SDK 实现
}
```

---

#### 🔴 关键问题 4: 配置管理缺失

**问题示例**:
```typescript
// academic-assistant-real.mjs:20-177
const ACADEMIC_AGENTS = {
  'literature-searcher': {
    description: '...',
    prompt: '...', // ❌ 硬编码在代码中
    tools: ['WebSearch', 'WebFetch'],
    model: 'sonnet'
  },
  // ... 6 个 agents，都硬编码
};
```

**应该有的配置**:
```yaml
# config/agents.yaml
agents:
  literature-searcher:
    description: "Expert in academic literature search"
    model: sonnet
    temperature: 0.7
    max_tokens: 4096
    tools:
      - WebSearch
      - WebFetch
      - MCPCall
```

---

#### 🔴 关键问题 5: 错误处理不统一

**问题示例**:
```typescript
// real-skill-v2.ts:168-170
} catch (error) {
  console.warn('⚠️  Academia MCP 搜索失败:', error);
  // ❌ 静默失败，无法区分错误类型
}

// real-skill-v2.ts:276-278
} catch (error) {
  console.warn('⚠️  MCP 搜索失败，尝试备用方案');
  // ❌ 没有错误分类
}
```

**应该有的错误处理**:
```typescript
// 定义领域错误
class MCPConnectionError extends DomainError {}
class SearchStrategyExhaustedError extends DomainError {}

// 统一错误处理
try {
  // ...
} catch (error) {
  if (error instanceof MCPConnectionError) {
    // 降级到备用策略
  } else {
    throw new SearchStrategyExhaustedError(error);
  }
}
```

---

#### 🔴 关键问题 6: 缺少事件驱动机制

**问题**: 各个 Skill 之间没有解耦的通信方式

```typescript
// 当前：直接调用
const papers = await literatureSearchSkill.execute(input);
const review = await literatureReviewSkill.execute({ papers });
// ❌ literatureReview 直接依赖 literatureSearch
```

**应该有的机制**:
```typescript
// 事件驱动
eventBus.publish(new PapersSearchedEvent(papers));

// literature-review 监听事件
eventBus.subscribe(PapersSearchedEvent, async (event) => {
  // 处理搜索结果
});
```

---

#### 🔴 关键问题 7: 测试困难

**问题示例**:
```typescript
// test-real-implementation.test.mjs
// ❌ 测试需要真实的 API key
// ❌ 测试执行网络请求
// ❌ 测试速度慢（285ms）
```

**应该有的测试**:
- 单元测试：无需 API，使用 mock
- 集成测试：使用 test doubles
- E2E 测试：使用真实 API（少量）

---

#### 🟡 次要问题 8: 代码重复

**问题示例**:
```typescript
// literature-search/skill.ts (144 行)
// literature-search/real-skill.ts (266 行)
// literature-search/real-skill-v2.ts (341 行)

// ❌ 3 个版本的 LiteratureSearch，逻辑重复
```

---

#### 🟡 次要问题 9: 类型安全问题

**问题示例**:
```typescript
// real-mcp-client.ts:56
async callTool<T>(serverName: string, toolName: string, args: any = {}): Promise<T> {
  // ❌ 使用 `any`，失去类型检查
}

// real-mcp-client.ts:74
if ('text' in result) {
  return JSON.parse(result.text) as T; // ❌ 强制类型转换
}
```

---

### 1.4 架构问题总结

| 问题类别 | 严重程度 | 违反原则 | 影响范围 |
|---------|---------|---------|---------|
| 职责混乱 | 🔴 高 | SRP | 所有 Skills |
| 紧耦合 | 🔴 高 | DIP, OCP | MCP Client, Skills |
| 缺少抽象 | 🔴 高 | DIP | 整体架构 |
| 配置缺失 | 🔴 高 | OCP | Agents, Skills |
| 错误处理 | 🔴 高 | - | 所有模块 |
| 缺少事件机制 | 🟡 中 | Mediator | Skill 间通信 |
| 测试困难 | 🔴 高 | - | 测试套件 |
| 代码重复 | 🟡 中 | DRY | Skills |
| 类型安全 | 🟡 中 | - | MCP Client |

---

## 第二部分：理论基础和最佳实践

### 2.1 Claude Agent SDK 最新特性（2025）

根据最新文档研究，以下是关键发现：

#### 2.1.1 Subagent Skills 架构

**核心概念**：
- **Skill**: 持久的过程性知识（procedural knowledge）
- **Subagent**: 动态的任务执行单元
- **区别**: Skills 关注"如何做"，Subagents 关注"做什么"

**最佳实践**：
1. **Skills 应该少于 5,000 字（~800 行）**
   - 来源: [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)

2. **使用命令式语言**
   - ✅ "Analyze code for..."
   - ❌ "You should analyze..."

3. **渐进式披露（Progressive Disclosure）**
   - 先展示核心功能
   - 再提供高级选项

4. **避免深层嵌套引用**
   - 来源: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

#### 2.1.2 Agent 组合模式

**Orchestrator-Worker 模式**：
- 来源: [Claude Code 架构深度解析](https://www.80aj.com/2026/01/04/claude-code-architecture-deepdive/)

```
┌─────────────┐
│ Orchestrator│  ← 协调多个 Workers
└──────┬──────┘
       │
   ┌───┴────┬────────┬────────┐
   ▼        ▼        ▼        ▼
Worker1  Worker2  Worker3  Worker4
```

**优势**：
- Token 效率优化
- 并行执行
- 职责清晰

#### 2.1.3 Claude Agent SDK 使用建议

1. **使用官方 `@anthropic-ai/claude-agent-sdk`**
   - 版本: v0.2.3+
   - 类型安全
   - 流式输出

2. **AgentDefinition 最佳实践**
```typescript
const agent: AgentDefinition = {
  description: 'Clear, concise description', // ✅ 简洁描述
  prompt: 'Specific instructions', // ✅ 具体指令
  tools: ['Tool1', 'Tool2'], // ✅ 最小工具集
  model: 'sonnet' // ✅ 选择合适的模型
};
```

---

### 2.2 SOLID 原则在 TypeScript 中的实现

根据 2025 年最新研究：

#### 2.2.1 单一职责原则（SRP）

**定义**: 一个类应该只有一个改变的理由

**TypeScript 实现**：
```typescript
// ❌ 违反 SRP
class LiteratureSearchSkill {
  async search() { /* ... */ }
  async parseResults() { /* ... */ }
  async deduplicate() { /* ... */ }
  async formatOutput() { /* ... */ }
}

// ✅ 符合 SRP
class LiteratureSearchService {
  constructor(
    private searcher: ISearcher,
    private parser: IResultParser,
    private deduplicator: IDeduplicator
  ) {}

  async search(query: string): Promise<Paper[]> {
    const raw = await this.searcher.search(query);
    const parsed = await this.parser.parse(raw);
    const unique = await this.deduplicator.deduplicate(parsed);
    return unique;
  }
}
```

来源: [SOLID Principles in TypeScript](https://medium.com/@navidbarsalari/solid-principles-in-typescript-a-complete-practical-guide-with-real-examples-83f25e093bdf)

#### 2.2.2 依赖倒置原则（DIP）

**定义**: 高层模块不应依赖低层模块，都应依赖抽象

**TypeScript 实现**：
```typescript
// ❌ 违反 DIP
class LiteratureSearchSkill {
  private mcpClient = new RealMCPClient(); // 直接依赖具体实现
}

// ✅ 符合 DIP
interface IMCPClient {
  connect(serverName: string): Promise<void>;
  callTool<T>(name: string, args: any): Promise<T>;
}

class LiteratureSearchService {
  constructor(private mcpClient: IMCPClient) {} // 依赖抽象
}
```

来源: [Mastering Dependency Injection in TypeScript](https://medium.com/@modos.m98/mastering-dependency-injection-in-typescript-a-practical-guide-f3fcd09009af)

#### 2.2.3 接口隔离原则（ISP）

**定义**: 客户端不应依赖它不使用的接口

**TypeScript 实现**：
```typescript
// ❌ 违反 ISP（臃肿接口）
interface IMCPClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  callTool<T>(): Promise<T>;
  listTools(): Promise<Tool[]>;
  ping(): Promise<boolean>;
  getMetrics(): Promise<Metrics>;
  // ... 20+ methods
}

// ✅ 符合 ISP（分离接口）
interface IMCPConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

interface IMCPToolInvoker {
  callTool<T>(name: string, args: any): Promise<T>;
  listTools(): Promise<Tool[]>;
}
```

---

### 2.3 依赖注入和 IoC 容器

#### 2.3.1 为什么需要 DI？

**问题**：
```typescript
// ❌ 硬编码依赖
class Service {
  private dependency = new Dependency();
}
```

**解决方案**：
```typescript
// ✅ 依赖注入
class Service {
  constructor(private dependency: IDependency) {}
}

// 使用 IoC 容器
container.bind<IDependency>('IDependency').to(Dependency);
container.bind<Service>('Service').to(Service);
```

来源: [Inversion of Control using TypeScript and InversifyJS](https://www.devlane.com/blog/inversion-of-control-ioc-principle-using-typescript-and-inversifyjs)

#### 2.3.2 推荐的 DI 库

**InversifyJS**:
- 最流行的 TypeScript DI 容器
- 装饰器支持
- 类型安全

**TSyringe**:
- 轻量级
- 微软维护
- 无需装饰器

#### 2.3.3 DI 最佳实践

1. **构造函数注入**（推荐）
```typescript
constructor(
  private searchService: ISearchService,
  private parser: IParser
) {}
```

2. **避免属性注入**
```typescript
// ❌ 不推荐
@Inject private dependency: IDependency;
```

3. **限制使用工厂模式**
```typescript
// 仅在需要时使用
constructor(private factory: IServiceFactory) {}
```

---

### 2.4 事件驱动架构（EDA）

#### 2.4.1 为什么需要 EDA？

**解耦 Skill 间通信**：
```typescript
// ❌ 紧耦合
const review = await literatureReview.execute({
  papers: await literatureSearch.execute(query)
});

// ✅ 松耦合
eventBus.publish(new SearchRequestedEvent(query));
eventBus.subscribe(PapersFoundEvent, async (event) => {
  await literatureReview.onPapersFound(event.papers);
});
```

#### 2.4.2 领域事件 vs 集成事件

**领域事件（Domain Events）**:
- 在一个聚合内部
- 事务性
- 同步处理

**集成事件（Integration Events）**:
- 跨聚合/边界
- 最终一致性
- 异步处理

来源: [Domain Events vs Integration Events - Microsoft](https://devblogs.microsoft.com/cesardelatorre/domain-events-vs-integration-events-in-domain-driven-design-and-microservices-architectures/)

#### 2.4.3 事件总线实现

```typescript
interface IEventBus {
  publish<T>(event: T): Promise<void>;
  subscribe<T>(eventClass: Constructor<T>, handler: (event: T) => void): void;
  unsubscribe<T>(eventClass: Constructor<T>, handler: (event: T) => void): void;
}

class InMemoryEventBus implements IEventBus {
  private handlers = new Map<Constructor<any>, Set<Function>>();

  async publish<T>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.constructor) || new Set();
    await Promise.all([...handlers].map(h => h(event)));
  }

  subscribe<T>(eventClass: Constructor<T>, handler: (event: T) => void): void {
    if (!this.handlers.has(eventClass)) {
      this.handlers.set(eventClass, new Set());
    }
    this.handlers.get(eventClass)!.add(handler);
  }
}
```

来源: [Event-Based Architectures in JavaScript](https://www.freecodecamp.org/news/event-based-architectures-in-javascript-a-handbook-for-devs/)

---

### 2.5 领域驱动设计（DDD）

#### 2.5.1 战略设计

**领域模型分层**：
```
┌─────────────────────┐
│  User Interface     │  用户界面
├─────────────────────┤
│  Application        │  应用层（用例）
├─────────────────────┤
│  Domain             │  领域层（核心逻辑）
├─────────────────────┤
│  Infrastructure     │  基础设施层
└─────────────────────┘
```

#### 2.5.2 战术设计

**核心模式**：
1. **Entity（实体）**: 有 ID 的领域对象
2. **Value Object（值对象）**: 不可变的、通过属性比较的对象
3. **Aggregate（聚合）**: 一致性边界
4. **Repository（仓储）**: 持久化抽象
5. **Domain Service（领域服务）**: 无状态的业务逻辑

来源: [Domain-Driven Design in TypeScript](https://ddd.academy/domain-driven-design-in-typescript/)

---

### 2.6 高内聚低耦合检查清单

**高内聚**：
- ✅ 相关功能聚集在同一模块
- ✅ 每个类只有一个改变的理由
- ✅ 相关的代码一起修改

**低耦合**：
- ✅ 模块间通过接口交互
- ✅ 依赖抽象而非具体实现
- ✅ 可以独立测试、部署、替换

来源: [Clean Frontend Architecture: Coupling and Cohesion](https://javascript.plainenglish.io/clean-frontend-architecture-coupling-and-cohesion-d252fe0b6140)

---

## 第三部分：目标架构设计

### 3.1 整体架构（洋葱架构 + DDD + EDA）

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │   CLI App     │  │   Web App     │  │   API App     │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                   Application Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Use Cases   │  │  DTOs        │  │  Mappers     │      │
│  │  (Orchestrators)│              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                      Domain Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Entities    │  │ Value Objects│  │  Domain      │      │
│  │              │  │              │  │  Services    │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ Paper        │  │ SearchQuery  │  │ ISearch      │      │
│  │ Citation     │  │ CitationStyle│  │ IFormat      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Domain      │  │  Domain      │  │  Repositories│      │
│  │  Events      │  │  Errors      │  │  (Interfaces)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Claude SDK  │  │  MCP Client  │  │  Event Bus   │      │
│  │  Impl        │  │  Impl        │  │  Impl        │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │  DB Repo     │  │  File System │  │  HTTP Client │      │
│  │  Impl        │  │  Impl        │  │  Impl        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  DI Container│  │  Logger      │  │  Config      │      │
│  │  (Inversify) │  │  (Pino)      │  │  Loader      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 包结构（Monorepo + Bun Workspaces）

```
academic-assistant/
├── packages/
│   ├── domain/                    # 🆕 领域层（核心业务逻辑）
│   │   ├── src/
│   │   │   ├── entities/          # 实体
│   │   │   │   ├── paper.ts
│   │   │   │   ├── citation.ts
│   │   │   │   └── index.ts
│   │   │   ├── value-objects/     # 值对象
│   │   │   │   ├── search-query.ts
│   │   │   │   ├── citation-style.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/          # 领域服务接口
│   │   │   │   ├── i-search.service.ts
│   │   │   │   ├── i-citation.service.ts
│   │   │   │   ├── i-literature-review.service.ts
│   │   │   │   └── index.ts
│   │   │   ├── events/            # 领域事件
│   │   │   │   ├── papers-searched.event.ts
│   │   │   │   ├── citations-formatted.event.ts
│   │   │   │   └── index.ts
│   │   │   ├── errors/            # 领域错误
│   │   │   │   ├── domain-error.ts
│   │   │   │   ├── search.error.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/      # 仓储接口
│   │   │   │   ├── i-paper.repository.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── application/               # 🆕 应用层（用例编排）
│   │   ├── src/
│   │   │   ├── use-cases/         # 用例（Orchestrators）
│   │   │   │   ├── search-papers.use-case.ts
│   │   │   │   ├── format-citations.use-case.ts
│   │   │   │   ├── conduct-literature-review.use-case.ts
│   │   │   │   └── index.ts
│   │   │   ├── dto/               # 数据传输对象
│   │   │   │   ├── search-request.dto.ts
│   │   │   │   ├── search-response.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── mappers/           # 实体-DTO 映射器
│   │   │   │   ├── paper.mapper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── infrastructure/            # 🆕 基础设施层
│   │   ├── src/
│   │   │   ├── claude/            # Claude SDK 实现
│   │   │   │   ├── agents/
│   │   │   │   │   ├── literature-search.agent.ts
│   │   │   │   │   ├── citation-manager.agent.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── claude-search.service.ts
│   │   │   │   │   ├── claude-citation.service.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── mcp/               # MCP 实现
│   │   │   │   ├── client/
│   │   │   │   │   ├── mcp-client.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── servers/
│   │   │   │   │   ├── academia.server.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── events/            # 事件总线实现
│   │   │   │   ├── in-memory-event-bus.ts
│   │   │   │   ├── redis-event-bus.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── persistence/       # 持久化
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── in-memory-paper.repository.ts
│   │   │   │   │   ├── file-paper.repository.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── logging/           # 日志
│   │   │   │   ├── pino-logger.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── config/            # 配置加载
│   │   │   │   ├── config-loader.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── di/                # 🆕 依赖注入
│   │   │   │   ├── container.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── presentation/              # 🆕 表现层
│   │   ├── src/
│   │   │   ├── cli/               # CLI 应用
│   │   │   │   ├── commands/
│   │   │   │   │   ├── search.command.ts
│   │   │   │   │   ├── cite.command.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── main.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── testing/                   # 🆕 测试工具
│   │   ├── src/
│   │   │   ├── mocks/
│   │   │   │   ├── mock-mcp-client.ts
│   │   │   │   ├── mock-claude-agent.ts
│   │   │   │   └── index.ts
│   │   │   ├── fixtures/
│   │   │   │   ├── paper-fixtures.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── shared/                    # 🆕 共享工具
│   │   ├── src/
│   │   │   ├── utils/
│   │   │   │   ├── text.utils.ts
│   │   │   │   ├── date.utils.ts
│   │   │   │   └── index.ts
│   │   │   ├── constants/
│   │   │   │   ├── citation-styles.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── contracts/                 # 🆕 接口定义
│       ├── src/
│       │   ├── index.ts
│       └── package.json
│
├── apps/
│   ├── cli/                       # 🆕 CLI 应用（重构）
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── api/                       # API 应用（未来）
│       ├── src/
│       │   └── ...
│       └── package.json
│
├── config/                        # 🆕 配置文件
│   ├── agents.yaml                # Agent 配置
│   ├── skills.yaml                # Skill 配置
│   ├── mcp-servers.yaml           # MCP 服务器配置
│   └── default.yaml               # 默认配置
│
├── .claude/                       # Claude Code Skills
│   └── skills/
│       ├── literature-search/
│       │   └── SKILL.md
│       ├── citation-manager/
│       │   └── SKILL.md
│       └── ...
│
├── package.json                   # Root package.json
├── tsconfig.json                  # TypeScript 配置
├── tsconfig.base.json             # 基础配置
└── bun.lockb
```

### 3.3 核心设计原则

#### 3.3.1 依赖方向

```
Presentation → Application → Domain ← Infrastructure
```

**规则**:
- ✅ 所有层都依赖 Domain
- ✅ Application 可以依赖 Domain
- ✅ Presentation 可以依赖 Application
- ✅ Infrastructure 实现 Domain 定义的接口
- ❌ Domain 不依赖任何其他层

#### 3.3.2 依赖注入策略

```typescript
// infrastructure/di/container.ts
const container = new Container();

// Domain Services（绑定接口到实现）
container.bind<ISearchService>('ISearchService').to(ClaudeSearchService);
container.bind<ICitationService>('ICitationService').to(CitationService);
container.bind<IEventBus>('IEventBus').to(InMemoryEventBus);

// Infrastructure Services
container.bind<IMCPClient>('IMCPClient').to(MCPClient);
container.bind<ILogger>('ILogger').to(PinoLogger);

// Repositories
container.bind<IPaperRepository>('IPaperRepository').to(InMemoryPaperRepository);

// Use Cases（应用层）
container.bind<SearchPapersUseCase>('SearchPapersUseCase').to(SearchPapersUseCase);
```

#### 3.3.3 事件驱动流程

```typescript
// 搜索流程示例
async function searchPapers(query: string): Promise<Paper[]> {
  // 1. 发布搜索请求事件
  await eventBus.publish(new SearchRequestedEvent(query));

  // 2. 执行搜索
  const papers = await searchService.search(query);

  // 3. 发布搜索完成事件
  await eventBus.publish(new PapersSearchedEvent(papers));

  return papers;
}

// 其他模块监听事件
eventBus.subscribe(PapersSearchedEvent, async (event) => {
  // 自动保存到缓存
  await cacheRepository.save(event.papers);
});

eventBus.subscribe(PapersSearchedEvent, async (event) => {
  // 触发文献综述分析
  if (event.papers.length >= 5) {
    await literatureReviewService.analyze(event.papers);
  }
});
```

---

## 第四部分：详细实施计划

### 4.1 阶段 1: 基础设施重构（Week 1-2）

#### 目标
建立高内聚低耦合的基础设施

#### 任务

**4.1.1 创建领域层（2 天）**

```bash
mkdir -p packages/domain/src/{entities,value-objects,services,events,errors,repositories}
```

**文件清单**:
- `packages/domain/src/entities/paper.ts`
- `packages/domain/src/entities/citation.ts`
- `packages/domain/src/value-objects/search-query.ts`
- `packages/domain/src/value-objects/citation-style.ts`
- `packages/domain/src/services/i-search.service.ts`
- `packages/domain/src/services/i-citation.service.ts`
- `packages/domain/src/events/papers-searched.event.ts`
- `packages/domain/src/errors/domain-error.ts`
- `packages/domain/src/repositories/i-paper.repository.ts`

**关键代码示例**:

```typescript
// packages/domain/src/entities/paper.ts
export class Paper {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly authors: Author[],
    public readonly abstract: string,
    public readonly year: number,
    public readonly venue?: string,
    public readonly url?: string,
    public readonly doi?: string
  ) {}

  // 值对象语义
  equals(other: Paper): boolean {
    return this.id === other.id;
  }

  // 领域逻辑
  getCitationCount(): number {
    // 从外部服务获取
  }

  isRecent(years: number = 5): boolean {
    return new Date().getFullYear() - this.year <= years;
  }
}
```

```typescript
// packages/domain/src/services/i-search.service.ts
export interface ISearchService {
  search(query: SearchQuery): Promise<Paper[]>;
  searchById(id: string): Promise<Paper | null>;
}
```

---

**4.1.2 实现依赖注入（2 天）**

```bash
mkdir -p packages/infrastructure/src/di
```

**文件清单**:
- `packages/infrastructure/src/di/container.ts`
- `packages/infrastructure/src/di/types.ts`

**关键代码**:

```typescript
// packages/infrastructure/src/di/container.ts
import { Container, injectable } from 'inversify';

export const DI_CONTAINER = new Container({ defaultScope: 'Singleton' });

// 类型标记
export const TYPES = {
  SearchService: Symbol.for('ISearchService'),
  CitationService: Symbol.for('ICitationService'),
  EventBus: Symbol.for('IEventBus'),
  MCPClient: Symbol.for('IMCPClient'),
  Logger: Symbol.for('ILogger'),
  PaperRepository: Symbol.for('IPaperRepository')
};
```

---

**4.1.3 实现事件总线（2 天）**

```bash
mkdir -p packages/infrastructure/src/events
```

**文件清单**:
- `packages/infrastructure/src/events/event-bus.interface.ts`
- `packages/infrastructure/src/events/in-memory-event-bus.ts`
- `packages/infrastructure/src/events/redis-event-bus.ts`（可选）

**关键代码**:

```typescript
// packages/domain/src/events/event-bus.interface.ts（放在 domain）
export interface IEventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventClass: Constructor<T>,
    handler: (event: T) => Promise<void>
  ): void;
  unsubscribe<T extends DomainEvent>(
    eventClass: Constructor<T>,
    handler: (event: T) => Promise<void>
  ): void;
}

export abstract class DomainEvent {
  readonly occurredAt: Date;
  constructor() {
    this.occurredAt = new Date();
  }
}
```

---

**4.1.4 配置管理系统（1 天）**

```bash
mkdir -p config packages/infrastructure/src/config
```

**文件清单**:
- `config/agents.yaml`
- `config/skills.yaml`
- `config/mcp-servers.yaml`
- `packages/infrastructure/src/config/config-loader.ts`

**配置示例**:

```yaml
# config/agents.yaml
agents:
  literature-searcher:
    model: sonnet
    temperature: 0.7
    max_tokens: 4096
    tools:
      - WebSearch
      - WebFetch
      - MCPCall
    prompt: |
      You are an expert academic literature researcher.
      Search for papers about: {{query}}
      Maximum results: {{maxResults}}
```

---

**4.1.5 单元测试基础设施（1 天）**

```bash
mkdir -p packages/testing/src/{mocks,fixtures}
```

**文件清单**:
- `packages/testing/src/mocks/mock-mcp-client.ts`
- `packages/testing/src/mocks/mock-claude-agent.ts`
- `packages/testing/src/fixtures/paper-fixtures.ts`

**关键代码**:

```typescript
// packages/testing/src/mocks/mock-mcp-client.ts
export class MockMCPClient implements IMCPClient {
  async connect(): Promise<void> {
    // Mock implementation
  }

  async callTool<T>(name: string, args: any): Promise<T> {
    // Return test data
    return [] as any;
  }
}
```

---

### 4.2 阶段 2: 应用层重构（Week 3-4）

#### 目标
实现用例编排和业务流程

#### 任务

**4.2.1 创建用例（4 天）**

```bash
mkdir -p packages/application/src/{use-cases,dto,mappers}
```

**文件清单**:
- `packages/application/src/use-cases/search-papers.use-case.ts`
- `packages/application/src/use-cases/format-citations.use-case.ts`
- `packages/application/src/use-cases/conduct-literature-review.use-case.ts`
- `packages/application/src/dto/search-request.dto.ts`
- `packages/application/src/dto/search-response.dto.ts`
- `packages/application/src/mappers/paper.mapper.ts`

**关键代码**:

```typescript
// packages/application/src/use-cases/search-papers.use-case.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '@assistant/infrastructure/di';
import { ISearchService } from '@assistant/domain';
import { SearchRequestDTO, SearchResponseDTO } from '../dto';

@injectable()
export class SearchPapersUseCase {
  constructor(
    @inject(TYPES.SearchService) private searchService: ISearchService
  ) {}

  async execute(request: SearchRequestDTO): Promise<SearchResponseDTO> {
    // DTO → Domain
    const query = SearchQuery.fromDTO(request);

    // 执行业务逻辑
    const papers = await this.searchService.search(query);

    // Domain → DTO
    return SearchResponseDTO.fromDomain(papers);
  }
}
```

---

**4.2.2 实现事件驱动的用例编排（3 天）**

**关键代码**:

```typescript
// packages/application/src/use-cases/conduct-literature-review.use-case.ts
@injectable()
export class ConductLiteratureReviewUseCase {
  constructor(
    @inject(TYPES.SearchService) private searchService: ISearchService,
    @inject(TYPES.ReviewService) private reviewService: IReviewService,
    @inject(TYPES.EventBus) private eventBus: IEventBus
  ) {}

  async execute(request: LiteratureReviewRequestDTO): Promise<LiteratureReviewDTO> {
    // 1. 搜索论文
    const searchResults = await this.searchService.search(request.query);

    // 2. 发布事件（让其他模块响应）
    await this.eventBus.publish(new PapersSearchedEvent(searchResults));

    // 3. 执行文献综述
    const review = await this.reviewService.review(searchResults);

    // 4. 发布完成事件
    await this.eventBus.publish(new LiteratureReviewCompletedEvent(review));

    return LiteratureReviewDTO.fromDomain(review);
  }
}
```

---

### 4.3 阶段 3: 基础设施层实现（Week 5-6）

#### 目标
实现 Claude Agent SDK 和 MCP 的集成

#### 任务

**4.3.1 重构 Claude Agent SDK 集成（3 天）**

```bash
mkdir -p packages/infrastructure/src/claude/{agents,services}
```

**文件清单**:
- `packages/infrastructure/src/claude/agents/literature-search.agent.ts`
- `packages/infrastructure/src/claude/services/claude-search.service.ts`

**关键代码**:

```typescript
// packages/infrastructure/src/claude/services/claude-search.service.ts
import { injectable } from 'inversify';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { ISearchService, SearchQuery, Paper } from '@assistant/domain';
import { AgentConfig } from '../config';

@injectable()
export class ClaudeSearchService implements ISearchService {
  constructor(
    private config: AgentConfig,
    private eventBus: IEventBus
  ) {}

  async search(query: SearchQuery): Promise<Paper[]> {
    const agentQuery = query({
      prompt: this.buildPrompt(query),
      options: {
        agents: this.config.agents,
        allowedTools: this.config.tools
      }
    });

    const papers: Paper[] = [];

    for await (const message of agentQuery) {
      if (message.type === 'assistant') {
        const extracted = this.extractPapers(message);
        papers.push(...extracted);
      }
    }

    // 发布事件
    await this.eventBus.publish(new PapersSearchedEvent(papers));

    return papers;
  }

  private buildPrompt(query: SearchQuery): string {
    // 从配置加载 prompt 模板
    return this.config.promptTemplate
      .replace('{{query}}', query.text)
      .replace('{{maxResults}}', query.maxResults.toString());
  }

  private extractPapers(message: any): Paper[] {
    // 解析逻辑
  }
}
```

---

**4.3.2 重构 MCP 客户端（2 天）**

```bash
mkdir -p packages/infrastructure/src/mcp/{client,servers}
```

**文件清单**:
- `packages/infrastructure/src/mcp/client/mcp-client.ts`（重构 real-mcp-client.ts）

**关键改进**:

```typescript
// packages/infrastructure/src/mcp/client/mcp-client.ts
import { injectable } from 'inversify';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

// 接口在 domain 中定义
@injectable()
export class MCPClient implements IMCPClient {
  private clients: Map<string, Client> = new Map();

  async connect(serverName: string, config: ServerConfig): Promise<void> {
    // 实现连接逻辑
  }

  async callTool<T>(serverName: string, toolName: string, args: unknown): Promise<T> {
    // 类型安全的调用
  }

  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
}
```

---

**4.3.3 实现 Repository（2 天）**

```bash
mkdir -p packages/infrastructure/src/persistence/repositories
```

**文件清单**:
- `packages/infrastructure/src/persistence/repositories/in-memory-paper.repository.ts`
- `packages/infrastructure/src/persistence/repositories/file-paper.repository.ts`

**关键代码**:

```typescript
// packages/infrastructure/src/persistence/repositories/in-memory-paper.repository.ts
import { injectable } from 'inversify';
import { IPaperRepository, Paper } from '@assistant/domain';

@injectable()
export class InMemoryPaperRepository implements IPaperRepository {
  private papers: Map<string, Paper> = new Map();

  async save(paper: Paper): Promise<void> {
    this.papers.set(paper.id, paper);
  }

  async findById(id: string): Promise<Paper | null> {
    return this.papers.get(id) || null;
  }

  async findAll(): Promise<Paper[]> {
    return Array.from(this.papers.values());
  }

  async delete(id: string): Promise<void> {
    this.papers.delete(id);
  }
}
```

---

**4.3.4 日志和监控（1 天）**

**文件清单**:
- `packages/infrastructure/src/logging/pino-logger.ts`

**关键代码**:

```typescript
@injectable()
export class PinoLogger implements ILogger {
  private logger = pino({ level: process.env.LOG_LEVEL || 'info' });

  info(message: string, meta?: any): void {
    this.logger.info(meta, message);
  }

  error(message: string, error?: Error): void {
    this.logger.error({ error }, message);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(meta, message);
  }
}
```

---

### 4.4 阶段 4: 表现层重构（Week 7）

#### 目标
实现用户界面（CLI、API）

#### 任务

**4.4.1 重构 CLI 应用（3 天）**

```bash
mkdir -p apps/cli/src/commands
```

**文件清单**:
- `apps/cli/src/commands/search.command.ts`
- `apps/cli/src/commands/cite.command.ts`
- `apps/cli/src/main.ts`

**关键代码**:

```typescript
// apps/cli/src/commands/search.command.ts
import { inject } from 'inversify';
import { SearchPapersUseCase } from '@assistant/application';
import { TYPES } from '@assistant/infrastructure/di';

export class SearchCommand {
  constructor(
    @inject(TYPES.SearchPapersUseCase) private searchUseCase: SearchPapersUseCase
  ) {}

  async execute(query: string, options: any): Promise<void> {
    const request = new SearchRequestDTO({ query, ...options });
    const response = await this.searchUseCase.execute(request);

    console.log(`Found ${response.papers.length} papers:`);
    response.papers.forEach(paper => {
      console.log(`- ${paper.title} (${paper.year})`);
    });
  }
}
```

---

**4.4.2 API 应用（可选，2 天）**

```bash
mkdir -p apps/api/src/routes
```

**文件清单**:
- `apps/api/src/routes/search.routes.ts`
- `apps/api/src/index.ts`

**关键代码**:

```typescript
// apps/api/src/routes/search.routes.ts
import { Hono } from 'hono';
import { inject } from 'inversify';
import { SearchPapersUseCase } from '@assistant/application';

const searchRoutes = new Hono();

searchRoutes.post('/search', async (c) => {
  const useCase = c.get('SearchPapersUseCase');
  const request = await c.req.json();

  const response = await useCase.execute(SearchRequestDTO.fromPlain(request));

  return c.json(response);
});
```

---

### 4.5 阶段 5: 测试和文档（Week 8）

#### 目标
完整的测试覆盖和文档

#### 任务

**4.5.1 单元测试（2 天）**

- 每个 Domain 类的单元测试
- 每个 Use Case 的单元测试
- 每个 Infrastructure 组件的单元测试

**目标**: 80%+ 代码覆盖率

---

**4.5.2 集成测试（2 天）**

- Use Case 集成测试
- 事件总线集成测试
- DI 容器集成测试

---

**4.5.3 E2E 测试（1 天）**

- CLI 端到端测试
- 完整工作流测试

---

**4.5.4 文档（2 天）**

- README.md 更新
- 架构文档（ARCHITECTURE.md）
- API 文档
- 贡献指南

---

### 4.6 阶段 6: 优化和部署（Week 9-10）

#### 目标
性能优化和生产部署

#### 任务

**4.6.1 性能优化**
- 事件总线优化（Redis）
- 缓存策略
- 并发处理

**4.6.2 安全加固**
- API key 管理
- 环境变量隔离
- 错误信息脱敏

**4.6.3 部署配置**
- Dockerfile
- CI/CD 配置
- 监控和告警

---

## 第五部分：迁移策略

### 5.1 渐进式迁移

**原则**: 不破坏现有功能，渐进式替换

#### 迁移步骤

**Step 1: 并行开发（Week 1-2）**
```bash
# 保留旧代码
packages/skills/real-skill-v2.ts  # 旧代码

# 开发新代码
packages/domain/
packages/application/
packages/infrastructure/
```

**Step 2: Feature Flag（Week 3-4）**
```typescript
// 使用环境变量切换
const USE_NEW_ARCHITECTURE = process.env.USE_NEW_ARCH === 'true';

if (USE_NEW_ARCHITECTURE) {
  // 新架构
  const useCase = container.get<SearchPapersUseCase>('SearchPapersUseCase');
  return await useCase.execute(request);
} else {
  // 旧代码
  return await literatureSearchSkill.execute(input);
}
```

**Step 3: A/B 测试（Week 5-6）**
- 比较新旧实现的性能
- 验证结果一致性
- 收集用户反馈

**Step 4: 完全迁移（Week 7-8）**
- 删除旧代码
- 更新文档
- 发布新版本

---

### 5.2 向后兼容性

**保留的接口**:
```typescript
// 导出兼容层
export { LiteratureSearchSkill } from './legacy/skill';

// 新 API
export { SearchPapersUseCase } from './application';
```

---

### 5.3 数据迁移

如果需要迁移数据：
```bash
scripts/
├── migrate-papers.ts
└── migrate-citations.ts
```

---

## 第六部分：成功指标

### 6.1 代码质量指标

| 指标 | 当前 | 目标 | 测量方法 |
|------|------|------|---------|
| 圈复杂度 | N/A | < 10 | `complexity-report` |
| 代码重复率 | ~20% | < 5% | `jscpd` |
| 测试覆盖率 | ~60% | > 80% | `c8` |
| 类型安全 | ~70% | > 95% | `tsc --noImplicitAny` |
| 最大文件行数 | 567 行 | < 300 行 | `cloc` |

---

### 6.2 架构质量指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 高内聚模块 | ~30% | > 80% |
| 低耦合模块 | ~40% | > 80% |
| 依赖抽象比例 | ~20% | > 80% |
| 可独立测试模块 | ~50% | > 90% |

---

### 6.3 性能指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 平均响应时间 | ~2s | < 1s |
| 95th 响应时间 | ~5s | < 2s |
| 内存使用 | ~200MB | < 150MB |
| 启动时间 | ~1s | < 500ms |

---

## 第七部分：风险和缓解

### 7.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| DI 容器学习曲线 | 中 | 中 | 提供培训和文档 |
| 事件总线调试困难 | 高 | 高 | 详细的日志和追踪 |
| 性能退化 | 低 | 高 | 性能基准测试 |
| 迁移过程中的 Bug | 高 | 中 | Feature flags 和回滚计划 |

---

### 7.2 项目风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 时间超期 | 中 | 中 | 分阶段交付 |
| 资源不足 | 低 | 高 | 优先级排序 |
| 需求变更 | 中 | 中 | 敏捷迭代 |

---

## 第八部分：参考资源

### 8.1 Claude Agent SDK 和 Skills

1. **[Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)** (Sep 29, 2025)
   - Official Anthropic documentation

2. **[Claude Skills vs Sub-agents: Architecture, Use Cases, and Effective Patterns](https://medium.com/@SandeepTnvs/claude-skills-vs-sub-agents-architecture-use-cases-and-effective-patterns-3e535c9e0122)**
   - Architecture patterns

3. **[Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)** (Oct 26, 2025)
   - Best practices: Keep prompts under 5,000 words

4. **[Skill authoring best practices - Claude Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)**
   - Progressive disclosure patterns

5. **[Claude Code 架构深度解析：Commands、Skills、Agents](https://www.80aj.com/2026/01/04/claude-code-architecture-deepdive/)** (Jan 4, 2026)
   - Orchestrator-Worker pattern

### 8.2 TypeScript 和架构

6. **[Effective TypeScript Principles in 2025](https://blog.dennisokeeffe.com/blog/2025-03-16-effective-typescript-principles-in-2025)** (March 16, 2025)
   - Current best practices

7. **[SOLID Design Principles Guide for JavaScript and TypeScript](https://strapi.io/blog/solid-design-principles-javascript-typescript-guide)** (Oct 10, 2025)
   - Practical SOLID implementation

8. **[Clean Frontend Architecture: Coupling and Cohesion](https://javascript.plainenglish.io/clean-frontend-architecture-coupling-and-cohesion-d252fe0b6140)** (Nov 2025)
   - Coupling and cohesion principles

9. **[Mastering Dependency Injection in TypeScript: A Practical Guide](https://medium.com/@modos.m98/mastering-dependency-injection-in-typescript-a-practical-guide-f3fcd09009af)**
   - DI patterns and best practices

10. **[Loosely Coupled Monolith - Software Architecture 2025](https://codeopinion.com/loosely-coupled-monolith-software-architecture-2025-edition/)** (Aug 2025)
    - Monolith architecture patterns

### 8.3 DDD 和 EDA

11. **[Domain-Driven Design in TypeScript](https://ddd.academy/domain-driven-design-in-typescript/)**
    - DDD training for TypeScript

12. **[Event-Based Architectures in JavaScript: A Handbook for Devs](https://www.freecodecamp.org/news/event-based-architectures-in-javascript-a-handbook-for-devs/)** (Nov 2025)
    - EDA patterns in JavaScript

13. **[Microservices, Event-Driven Design, Domain-Driven Design](https://medium.com/@nima.shokofar/microservices-event-driven-design-domain-driven-design-plugin-system-ep1-5ae1f08ef7a7)**
    - Combining DDD and EDA

14. **[Domain Events vs Integration Events in DDD](https://devblogs.microsoft.com/cesardelatorre/domain-events-vs-integration-events-in-domain-driven-design-and-microservices-architectures/)** (Microsoft)
    - Event patterns

15. **[How to write DDD, scalable and type-safe NodeJS backends](https://itnext.io/how-to-write-ddd-scalable-and-type-safe-nodejs-backends-e0711403a755)** (ITNEXT)
    - TypeScript DDD implementation

---

## 附录

### A. 术语表

- **DDD**: Domain-Driven Design（领域驱动设计）
- **EDA**: Event-Driven Architecture（事件驱动架构）
- **DI**: Dependency Injection（依赖注入）
- **IoC**: Inversion of Control（控制反转）
- **SRP**: Single Responsibility Principle（单一职责原则）
- **DIP**: Dependency Inversion Principle（依赖倒置原则）
- **ISP**: Interface Segregation Principle（接口隔离原则）

---

### B. 检查清单

#### 架构设计检查清单

- [ ] 所有依赖指向 inward（依赖倒置）
- [ ] 每个类只有一个改变的理由（单一职责）
- [ ] 使用接口而非具体实现
- [ ] 事件驱动解耦模块间通信
- [ ] 配置外部化
- [ ] 错误处理统一

#### 代码质量检查清单

- [ ] 所有公共方法有 JSDoc
- [ ] 没有 `any` 类型（除了明确的场景）
- [ ] 没有 `console.log`（使用 logger）
- [ ] 每个类有单元测试
- [ ] 每个 use case 有集成测试
- [ ] 最大文件行数 < 300

---

### C. 示例代码仓库

完整的重构示例代码将在以下仓库中实现：

```
https://github.com/your-org/academic-assistant-refactor
```

分支结构:
- `main`: 稳定的当前代码
- `refactor/domain`: 领域层实现
- `refactor/application`: 应用层实现
- `refactor/infrastructure`: 基础设施层实现
- `refactor/presentation`: 表现层实现

---

## 第九部分：嵌入模式与向量检索架构（新增）

### 9.1 概述

基于最新的学术研究和技术调研，本部分详细阐述如何将**嵌入向量检索（Embedding-based Semantic Search）** 和 **LibSQL 向量数据库** 集成到学术助手架构中，实现智能语义搜索和 RAG（检索增强生成）能力。

### 9.2 核心技术栈

#### 9.2.1 向量数据库选择：LibSQL (Turso)

**为什么选择 LibSQL？**

根据最新研究，[Turso 已为 SQLite 原生添加向量相似性搜索](https://turso.tech/blog/turso-brings-native-vector-search-to-sqlite)，这是基于以下优势：

1. **原生向量支持**
   - 使用 SQLite BLOB 存储向量
   - 内置 HNSW（Hierarchical Navigable Small World）索引
   - 无需额外依赖

2. **零配置部署**
   - 基于 libSQL（SQLite 的开源分支）
   - 支持 Edge 部署
   - 无需独立向量数据库服务器

3. **性能优势**
   - 近似最近邻（ANN）搜索优化
   - 向量索引加速查询
   - 支持大规模向量存储

4. **开发友好**
   - 熟悉的 SQL 接口
   - TypeScript/JavaScript SDK
   - LangChain 集成支持

**官方资源**:
- [Turso AI & Embeddings 文档](https://docs.turso.tech/features/ai-and-embeddings)
- [LibSQL LangChain 集成](https://docs.langchain.com/oss/javascript/integrations/vectorstores/libsql)

---

#### 9.2.2 嵌入模型选择

**学术论文专用嵌入模型**:

根据 [VectorSearch 研究](https://arxiv.org/html/2409.17383v1) 和 [学术论文语义搜索实践](https://medium.com/@cocoindex.io/how-to-build-a-semantic-search-engine-for-academic-papers-with-python-and-vector-embeddings-542a57aeb0bd)，推荐以下模型：

1. **SPECTER** (学术文献专用)
   - 专为科学论文设计
   - 考虑论文结构（标题、摘要、引用）
   - 预训练在学术语料库

2. **OpenAI Embeddings** (通用)
   - `text-embedding-3-small` / `text-embedding-3-large`
   - 高质量语义表示
   - Claude SDK 兼容

3. **Cohere Embeddings** (多语言)
   - 支持 100+ 语言
   - 适合国际化学术文献

---

### 9.3 架构设计

#### 9.3.1 嵌入模式整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ CLI Command  │  │ Web UI       │  │ API Endpoint │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────┐
│                   Application Layer                          │
│  ┌──────────────────────────────────────────────────┐       │
│  │   Semantic Search Use Case                       │       │
│  │   - 查询向量化                                    │       │
│  │   - 向量相似性搜索                                │       │
│  │   - 混合检索（向量 + BM25）                       │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │   RAG Orchestration Use Case                     │       │
│  │   - 上下文检索                                    │       │
│  │   - 提示词增强                                    │       │
│  │   - 答案生成                                      │       │
│  └──────────────────────────────────────────────────┘       │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────┐
│                      Domain Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Paper        │  │ Embedding    │  │ SearchQuery  │      │
│  │ Entity       │  │ Value Object │  │ Value Object │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ - id         │  │ - vector     │  │ - text       │      │
│  │ - content    │  │ - model      │  │ - vector     │      │
│  │ - metadata   │  │ - dimension  │  │ - filters    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │   Domain Services (Interfaces)                   │       │
│  ├──────────────────────────────────────────────────┤       │
│  │ IEmbeddingService   - 生成/管理嵌入向量            │       │
│  │ IVectorSearchService - 向量相似性搜索              │       │
│  │ IHybridSearchService - 混合检索（向量+关键词）     │       │
│  │ IRAGService          - RAG 编排                   │       │
│  └──────────────────────────────────────────────────┘       │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────┐
│                Infrastructure Layer                          │
│  ┌──────────────────────────────────────────────────┐       │
│  │   LibSQL Vector Store                            │       │
│  ├──────────────────────────────────────────────────┤       │
│  │ - Vector storage (BLOB)                          │       │
│  │ - HNSW index                                     │       │
│  │ - Similarity search (cosine/inner product)       │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │   Embedding Providers                            │       │
│  ├──────────────────────────────────────────────────┤       │
│  │ - OpenAI Embeddings API                          │       │
│  │ - Cohere Embeddings API                          │       │
│  │ - Local SPECTER model                            │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │   Claude SDK Integration                          │       │
│  ├──────────────────────────────────────────────────┤       │
│  │ - RAG mode (automatic context retrieval)          │       │
│  │ - Agentic RAG (dynamic search refinement)         │       │
│  └──────────────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────────────┘
```

---

#### 9.3.2 LibSQL 向量存储实现

**数据库 Schema 设计**:

```sql
-- LibSQL 向量存储表
CREATE TABLE papers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,  -- JSON array
  abstract TEXT,
  year INTEGER,
  venue TEXT,
  doi TEXT UNIQUE,
  url TEXT,

  -- 向量嵌入（BLOB 存储 float32 数组）
  embedding BLOB,  -- 768 维向量（SPECTER）

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 全文搜索（BM25）
  fts_title TEXT,
  fts_abstract TEXT
);

-- 虚拟表用于全文搜索
CREATE VIRTUAL TABLE papers_fts USING fts5(
  title, abstract,
  content='papers'
);

-- HNSW 向量索引（LibSQL 扩展）
CREATE INDEX papers_embedding_idx
ON papers
USING hnsw (embedding vector_cosine_ops)
WITH (M = 16, ef_construction = 64);
```

**TypeScript 接口**:

```typescript
// packages/domain/src/entities/paper.entity.ts
export class Paper {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly authors: Author[],
    public readonly abstract: string,
    public readonly year: number,
    public readonly venue?: string,
    public readonly doi?: string,
    public readonly url?: string,
    public readonly embedding?: Float32Array  // 🆕 向量嵌入
  ) {}

  // 计算与另一篇论文的相似度
  similarity(other: Paper, metric: 'cosine' | 'dot' = 'cosine'): number {
    if (!this.embedding || !other.embedding) {
      return 0;
    }

    switch (metric) {
      case 'cosine':
        return this.cosineSimilarity(this.embedding, other.embedding);
      case 'dot':
        return this.dotProduct(this.embedding, other.embedding);
    }
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    // 余弦相似度计算
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  }

  private dotProduct(a: Float32Array, b: Float32Array): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }
}
```

---

#### 9.3.3 嵌入服务实现

```typescript
// packages/infrastructure/src/embeddings/openai-embedding.service.ts
import { injectable } from 'inversify';
import { OpenAI } from 'openai';
import { IEmbeddingService, Embedding } from '@assistant/domain';

@injectable()
export class OpenAIEmbeddingService implements IEmbeddingService {
  private client: OpenAI;

  constructor(
    private apiKey: string,
    private model: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-small'
  ) {
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  async embed(text: string): Promise<Embedding> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
      encoding_format: 'float'  // 返回浮点数
    });

    const vector = new Float32Array(response.data[0].embedding);

    return new Embedding({
      vector,
      model: this.model,
      dimension: vector.length,
      text
    });
  }

  async embedBatch(texts: string[]): Promise<Embedding[]> {
    // 批量嵌入（优化 API 调用）
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
      encoding_format: 'float'
    });

    return response.data.map(item => {
      const vector = new Float32Array(item.embedding);
      return new Embedding({
        vector,
        model: this.model,
        dimension: vector.length,
        text: texts[item.index]
      });
    });
  }
}
```

```typescript
// packages/infrastructure/src/embeddings/libsql-vector-store.ts
import { injectable } from 'inversify';
import { LibSQL } from '@libsql/client';
import { IVectorSearchService, Paper, Embedding } from '@assistant/domain';

@injectable()
export class LibSQLVectorStore implements IVectorSearchService {
  private db: LibSQL;

  constructor(connectionString: string) {
    this.db = new LibSQL(connectionString);
  }

  async insert(paper: Paper, embedding: Embedding): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO papers
      (id, title, authors, abstract, year, venue, doi, url, embedding, fts_title, fts_abstract)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      paper.id,
      paper.title,
      JSON.stringify(paper.authors),
      paper.abstract,
      paper.year,
      paper.venue || null,
      paper.doi || null,
      paper.url || null,
      Buffer.from(embedding.vector.buffer),  // Float32Array → BLOB
      paper.title,
      paper.abstract
    ).run();
  }

  async similaritySearch(
    queryEmbedding: Embedding,
    limit: number = 10,
    filters?: {
      yearFrom?: number;
      yearTo?: number;
      venue?: string[];
    }
  ): Promise<Array<{ paper: Paper; score: number }>> {
    // LibSQL 向量相似性搜索
    const query = `
      SELECT
        id,
        title,
        authors,
        abstract,
        year,
        venue,
        doi,
        url,
        vector_distance_cosine(embedding, ?) AS distance
      FROM papers
      WHERE 1=1
        ${filters?.yearFrom ? 'AND year >= ?' : ''}
        ${filters?.yearTo ? 'AND year <= ?' : ''}
        ${filters?.venue ? `AND venue IN (${filters.venue.map(() => '?').join(',')})` : ''}
      ORDER BY distance
      LIMIT ?
    `;

    const params: any[] = [Buffer.from(queryEmbedding.vector.buffer)];

    if (filters?.yearFrom) params.push(filters.yearFrom);
    if (filters?.yearTo) params.push(filters.yearTo);
    if (filters?.venue) params.push(...filters.venue);

    params.push(limit);

    const results = await this.db.execute(query, params);

    return results.rows.map(row => ({
      paper: new Paper(
        row.id as string,
        row.title as string,
        JSON.parse(row.authors as string),
        row.abstract as string,
        row.year as number,
        row.venue as string | undefined,
        row.doi as string | undefined,
        row.url as string | undefined
      ),
      score: 1 - (row.distance as number)  // 距离 → 相似度
    }));
  }

  async hybridSearch(
    queryText: string,
    queryEmbedding: Embedding,
    limit: number = 10,
    alpha: number = 0.5  // 向量/关键词权重
  ): Promise<Array<{ paper: Paper; score: number }>> {
    // 混合检索：向量相似度 + BM25 全文搜索
    const vectorQuery = `
      SELECT
        id,
        vector_distance_cosine(embedding, ?) AS vector_score
      FROM papers
      ORDER BY vector_score
      LIMIT 100
    `;

    const ftsQuery = `
      SELECT
        id,
        bm25(papers_fts) AS fts_score
      FROM papers_fts
      WHERE papers_fts MATCH ?
      ORDER BY fts_score
      LIMIT 100
    `;

    const [vectorResults, ftsResults] = await Promise.all([
      this.db.execute(vectorQuery, [Buffer.from(queryEmbedding.vector.buffer)]),
      this.db.execute(ftsQuery, [queryText])
    ]);

    // 合并结果（Reciprocal Rank Fusion）
    const scores = new Map<string, { vectorScore: number; ftsScore: number }>();

    vectorResults.rows.forEach((row, i) => {
      const id = row.id as string;
      const score = 1 / (i + 1);  // RRF
      scores.set(id, { vectorScore: score, ftsScore: 0 });
    });

    ftsResults.rows.forEach((row, i) => {
      const id = row.id as string;
      const score = 1 / (i + 1);  // RRF
      const existing = scores.get(id);
      if (existing) {
        existing.ftsScore = score;
      } else {
        scores.set(id, { vectorScore: 0, ftsScore: score });
      }
    });

    // 计算混合分数
    const results = Array.from(scores.entries())
      .map(([id, { vectorScore, ftsScore }]) => ({
        id,
        score: alpha * vectorScore + (1 - alpha) * ftsScore
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 获取完整论文信息
    const papers = await Promise.all(
      results.map(async ({ id }) => {
        const row = await this.db.execute('SELECT * FROM papers WHERE id = ?', [id]);
        return { ...results.find(r => r.id === id), paper: /* parse Paper */ };
      })
    );

    return papers;
  }
}
```

---

#### 9.3.4 RAG 服务实现

```typescript
// packages/infrastructure/src/claude/claude-rag.service.ts
import { injectable, inject } from 'inversify';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { IRAGService, IEmbeddingService, IVectorSearchService } from '@assistant/domain';
import { TYPES } from '../di';

@injectable()
export class ClaudeRAGService implements IRAGService {
  constructor(
    @inject(TYPES.EmbeddingService) private embeddingService: IEmbeddingService,
    @inject(TYPES.VectorSearchService) private vectorSearch: IVectorSearchService,
    private apiKey: string
  ) {}

  async query(
    question: string,
    options: {
      maxContext?: number;
      retrievalLimit?: number;
      model?: 'claude-3-5-sonnet' | 'claude-3-opus';
    } = {}
  ): Promise<{ answer: string; sources: string[] }> {
    const {
      maxContext = 5,
      retrievalLimit = 20,
      model = 'claude-3-5-sonnet'
    } = options;

    // 1. 将查询向量化
    const queryEmbedding = await this.embeddingService.embed(question);

    // 2. 检索相关论文
    const relevantPapers = await this.vectorSearch.similaritySearch(
      queryEmbedding,
      retrievalLimit
    );

    // 3. 选择最相关的上下文（RRF 重排序）
    const contextPapers = relevantPapers.slice(0, maxContext);

    // 4. 构建增强提示词
    const context = contextPapers
      .map(({ paper, score }) => `
【论文 ${score.toFixed(3)}】
标题: ${paper.title}
作者: ${paper.authors.map(a => a.name).join(', ')}
年份: ${paper.year}
摘要: ${paper.abstract}
      `.trim())
      .join('\n\n');

    const augmentedPrompt = `
你是一位学术研究助手。请基于以下论文内容回答用户的问题。

=== 相关论文 ===
${context}

=== 用户问题 ===
${question}

请提供准确、有据可循的答案，并引用相关论文。
    `;

    // 5. 使用 Claude Agent SDK 生成答案
    const agentQuery = query({
      prompt: augmentedPrompt,
      options: {
        agents: {
          'academic-assistant': {
            description: 'Expert academic research assistant with RAG',
            prompt: 'You are an expert academic research assistant.',
            tools: ['WebSearch', 'WebFetch'],
            model
          }
        },
        allowedTools: ['WebSearch', 'WebFetch'],
        permissionMode: 'bypassPermissions'
      }
    });

    let answer = '';
    for await (const message of agentQuery) {
      if (message.type === 'assistant') {
        for (const block of message.content) {
          if (block.type === 'text') {
            answer += block.text;
          }
        }
      } else if (message.type === 'result') {
        break;
      }
    }

    return {
      answer,
      sources: contextPapers.map(({ paper }) => paper.id)
    };
  }

  async agenticQuery(
    question: string,
    options: {
      maxIterations?: number;
      retrievalLimit?: number;
    } = {}
  ): Promise<{ answer: string; sources: string[]; iterations: number }> {
    // Agentic RAG：动态调整搜索策略
    // 参考: [Agentic RAG](https://wandb.ai/byyoung3/Generative-AI/reports/Agentic-RAG-Enhancing-retrieval-augmented-generation-with-AI-agents--VmlldzoxMTcyNjQ5Ng)
    const { maxIterations = 3, retrievalLimit = 20 } = options;

    let currentQuery = question;
    let allSources: string[] = [];
    let iterations = 0;

    for (let i = 0; i < maxIterations; i++) {
      iterations++;

      // 执行标准 RAG
      const result = await this.query(currentQuery, {
        retrievalLimit,
        maxContext: Math.max(5, 10 - iterations * 2)
      });

      allSources.push(...result.sources);

      // 检查是否需要进一步搜索
      const needsMoreInfo = await this.assessCompleteness(result.answer);

      if (!needsMoreInfo || i === maxIterations - 1) {
        return {
          answer: result.answer,
          sources: [...new Set(allSources)],
          iterations
        };
      }

      // 生成后续查询
      currentQuery = await this.generateFollowUpQuery(result.answer, question);
    }

    throw new Error('Agentic RAG failed to converge');
  }

  private async assessCompleteness(answer: string): Promise<boolean> {
    // 使用 Claude 评估答案完整性
    const assessment = await query({
      prompt: `
评估以下答案是否完整地回答了用户问题：

答案: ${answer}

如果答案完整、有据可循，返回 "COMPLETE"。
如果答案不完整、需要更多信息，返回 "INCOMPLETE"。

只返回 "COMPLETE" 或 "INCOMPLETE"。
      `,
      options: {
        agents: {},
        allowedTools: [],
        permissionMode: 'bypassPermissions'
      }
    });

    let result = '';
    for await (const message of assessment) {
      if (message.type === 'assistant') {
        for (const block of message.content) {
          if (block.type === 'text') {
            result += block.text;
          }
        }
      } else if (message.type === 'result') {
        break;
      }
    }

    return !result.includes('INCOMPLETE');
  }

  private async generateFollowUpQuery(answer: string, originalQuestion: string): Promise<string> {
    // 生成后续搜索查询
    const queryGen = await query({
      prompt: `
基于当前答案，生成一个后续搜索查询以获得更多信息。

原始问题: ${originalQuestion}

当前答案: ${answer}

请生成一个具体的后续搜索查询（返回查询文本）。
      `,
      options: {
        agents: {},
        allowedTools: [],
        permissionMode: 'bypassPermissions'
      }
    });

    let query = '';
    for await (const message of queryGen) {
      if (message.type === 'assistant') {
        for (const block of message.content) {
          if (block.type === 'text') {
            query += block.text;
          }
        }
      } else if (message.type === 'result') {
        break;
      }
    }

    return query.trim();
  }
}
```

---

### 9.4 学术论文数据源集成

#### 9.4.1 开源学术数据库

根据 [学术文献搜索研究](https://www.cheme.engineering.cmu.edu/news/2025/02/20-kitchin-litdb.html)，推荐以下数据源：

1. **OpenAlex** (完全免费)
   - 2.5 亿+ 论文
   - 完整的引用网络
   - API: https://api.openalex.org

2. **Semantic Scholar**
   - 2 亿+ 论文
   - AI 增强的语义搜索
   - API: https://api.semanticscholar.org

3. **arXiv**
   - 200 万+ 预印本
   - STEM 领域
   - OAI-PMH 接口

4. **PubMed Central**
   - 生物医学
   - 全文开放获取
   - Entrez API

#### 9.4.2 数据摄取管道

```typescript
// packages/infrastructure/src/ingestion/openalex-ingestion.service.ts
import { injectable } from 'inversify';
import { IEmbeddingService, IVectorSearchService } from '@assistant/domain';

@injectable()
export class OpenAlexIngestionService {
  constructor(
    private embeddingService: IEmbeddingService,
    private vectorStore: IVectorSearchService
  ) {}

  async ingestFromOpenAlex(query: string, limit: number = 100): Promise<void> {
    // 从 OpenAlex API 获取论文
    const apiUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${limit}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    const papers = data.results;

    // 批量生成嵌入
    const texts = papers.map(p => `${p.title}\n\n${p.abstract || ''}`);
    const embeddings = await this.embeddingService.embedBatch(texts);

    // 批量插入向量数据库
    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      const embedding = embeddings[i];

      const paperEntity = new Paper(
        paper.id,
        paper.title,
        paper.authorships.map((a: any) => new Author(a.author.display_name)),
        paper.abstract || '',
        paper.publication_year,
        paper.primary_location?.source?.display_name,
        paper.doi,
        paper.id
      );

      await this.vectorStore.insert(paperEntity, embedding);
    }
  }

  async ingestFromArXiv(category: string, limit: number = 100): Promise<void> {
    // 从 arXiv OAI-PMH 获取论文
    const oaiUrl = `https://export.arxiv.org/oai2?verb=ListRecords&metadataPrefix=oai_dc&set=${category}`;

    // 解析 OAI-PMH XML
    // 生成嵌入
    // 插入向量数据库
  }
}
```

---

### 9.5 集成到现有架构

#### 9.5.1 更新包结构

```
packages/
├── domain/
│   └── src/
│       ├── entities/
│       │   └── paper.ts  # 添加 embedding 字段
│       ├── value-objects/
│       │   ├── embedding.ts  # 🆕
│       │   └── similarity-result.ts  # 🆕
│       └── services/
│           ├── i-embedding.service.ts  # 🆕
│           ├── i-vector-search.service.ts  # 🆕
│           ├── i-hybrid-search.service.ts  # 🆕
│           └── i-rag.service.ts  # 🆕
│
├── infrastructure/
│   └── src/
│       ├── libsql/  # 🆕
│       │   ├── libsql-vector-store.ts
│       │   ├── libsql-client.ts
│       │   └── index.ts
│       │
│       ├── embeddings/  # 🆕
│       │   ├── openai-embedding.service.ts
│       │   ├── cohere-embedding.service.ts
│       │   └── index.ts
│       │
│       ├── claude/  # 更新
│       │   ├── services/
│       │   │   ├── claude-rag.service.ts  # 🆕
│       │   │   └── claude-agentic-rag.service.ts  # 🆕
│       │   └── agents/
│       │
│       └── ingestion/  # 🆕
│           ├── openalex-ingestion.service.ts
│           ├── arxiv-ingestion.service.ts
│           └── index.ts
│
└── application/
    └── src/
        └── use-cases/
            ├── semantic-search.use-case.ts  # 🆕
            ├── rag-query.use-case.ts  # 🆕
            └── ingest-papers.use-case.ts  # 🆕
```

#### 9.5.2 依赖注入配置

```typescript
// infrastructure/di/container.ts（更新）
import { Container } from 'inversify';
import {
  OpenAIEmbeddingService,
  LibSQLVectorStore,
  ClaudeRAGService,
  OpenAlexIngestionService
} from '@assistant/infrastructure';

export const DI_CONTAINER = new Container({ defaultScope: 'Singleton' });

export const TYPES = {
  // ... 现有类型

  // 🆕 Embedding & Vector Search
  EmbeddingService: Symbol.for('IEmbeddingService'),
  VectorSearchService: Symbol.for('IVectorSearchService'),
  HybridSearchService: Symbol.for('IHybridSearchService'),
  RAGService: Symbol.for('IRAGService'),

  // 🆕 Ingestion
  OpenAlexIngestion: Symbol.for('IOpenAlexIngestion'),
  ArXivIngestion: Symbol.for('IArXivIngestion')
};

// 绑定实现
DI_CONTAINER.bind(TYPES.EmbeddingService).to(OpenAIEmbeddingService);
DI_CONTAINER.bind(TYPES.VectorSearchService).to(LibSQLVectorStore);
DI_CONTAINER.bind(TYPES.RAGService).to(ClaudeRAGService);
DI_CONTAINER.bind(TYPES.OpenAlexIngestion).to(OpenAlexIngestionService);
```

---

### 9.6 更新实施计划

#### 新增任务（插入到现有计划中）

**阶段 2a: 向量检索基础（Week 3，并行进行）**

1. **LibSQL 数据库设置**（1 天）
   - 安装 LibSQL/Turso
   - 创建向量表和索引
   - 配置连接

2. **嵌入服务实现**（2 天）
   - OpenAI Embeddings 集成
   - 批量嵌入优化
   - 本地 SPECTER 模型（可选）

3. **向量存储实现**（2 天）
   - LibSQL Vector Store
   - 相似性搜索 API
   - 混合检索（向量 + BM25）

**阶段 3a: RAG 集成（Week 5-6，并行进行）**

4. **RAG 服务实现**（3 天）
   - 标准 RAG 流程
   - Claude SDK 集成
   - 上下文优化

5. **Agentic RAG 实现**（2 天）
   - 动态搜索策略
   - 多轮迭代优化
   - 收敛检测

**阶段 4a: 数据摄取（Week 6，并行进行）**

6. **OpenAlex 集成**（2 天）
   - API 客户端
   - 数据解析
   - 批量摄取

7. **arXiv/Semantic Scholar 集成**（2 天）
   - OAI-PMH 客户端
   - 增量更新
   - 错误处理

**阶段 5a: 测试和优化（Week 8）**

8. **向量检索测试**（2 天）
   - 准确性测试
   - 性能基准
   - 召回率评估

9. **RAG 质量评估**（2 天）
   - 答案质量评估
   - 幻觉检测
   - 引用准确性

---

### 9.7 性能优化策略

#### 9.7.1 向量索引优化

```sql
-- 调整 HNSW 参数（根据数据规模）
CREATE INDEX papers_embedding_idx_optimized
ON papers
USING hnsw (embedding vector_cosine_ops)
WITH (
  M = 32,              -- 增加连接数（提高召回率）
  ef_construction = 128  -- 增加构建时搜索宽度（提高精度）
);

-- 查询时参数调整
SET hnsw.ef_search = 200;  -- 提高搜索精度（降低速度）
```

#### 9.7.2 嵌入缓存

```typescript
// packages/infrastructure/src/embeddings/cached-embedding.service.ts
import { LRUCache } from 'lru-cache';

@injectable()
export class CachedEmbeddingService implements IEmbeddingService {
  private cache = new LRUCache<string, Embedding>({
    max: 10_000,  // 缓存 10k 个嵌入
    ttl: 1000 * 60 * 60 * 24 * 7  // 7 天过期
  });

  constructor(
    private underlying: IEmbeddingService
  ) {}

  async embed(text: string): Promise<Embedding> {
    const cached = this.cache.get(text);
    if (cached) {
      return cached;
    }

    const embedding = await this.underlying.embed(text);
    this.cache.set(text, embedding);
    return embedding;
  }
}
```

#### 9.7.3 批处理优化

```typescript
// 批量摄取（减少 API 调用）
async batchIngest(papers: Paper[], batchSize: number = 100): Promise<void> {
  for (let i = 0; i < papers.length; i += batchSize) {
    const batch = papers.slice(i, i + batchSize);
    const texts = batch.map(p => `${p.title}\n\n${p.abstract || ''}`);
    const embeddings = await this.embeddingService.embedBatch(texts);

    await Promise.all(
      batch.map((paper, j) => this.vectorStore.insert(paper, embeddings[j]))
    );
  }
}
```

---

### 9.8 参考资源（新增）

#### 向量数据库和检索

1. **[Turso brings Native Vector Search to SQLite](https://turso.tech/blog/turso-brings-native-vector-search-to-sqlite)** (June 2024)
   - LibSQL 向量搜索官方发布

2. **[AI & Embeddings - Turso Docs](https://docs.turso.tech/features/ai-and-embeddings)**
   - LibSQL 嵌入和向量功能文档

3. **[A Comprehensive Survey on Vector Database](https://arxiv.org/html/2310.11703v2)** (June 2025)
   - 向量数据库技术综述

4. **[VectorSearch: Enhancing Document Retrieval](https://arxiv.org/html/2409.17383v1)** (Sep 2024)
   - 向量检索增强文档检索

#### 学术搜索和 RAG

5. **[Claude Cookbook - RAG & Retrieval](https://platform.claude.com/cookbook/)**
   - Claude 官方 RAG 指南

6. **[Mastering RAG in Agent SDK](https://medium.com/@innolyze/mastering-rag-in-agent-sdk-supercharge-your-ai-agents-with-retrieval-augmented-generation-fab776c491d5)**
   - Agent SDK RAG 实践

7. **[Contextual Retrieval in AI Systems](https://www.anthropic.com/news/contextual-retrieval)**
   - Anthropic 上下文检索研究

8. **[Agentic RAG: Enhancing retrieval](https://wandb.ai/byyoung3/Generative-AI/reports/Agentic-RAG-Enhancing-retrieval-augmented-generation-with-AI-agents--VmlldzoxMTcyNjQ5Ng)**
   - Agentic RAG 研究

#### 学术论文数据源

9. **[How to Build a Semantic Search Engine for Academic Papers](https://medium.com/@cocoindex.io/how-to-build-a-semantic-search-engine-for-academic-papers-with-python-and-vector-embeddings-542a57aeb0bd)**
   - 学术论文语义搜索实践

10. **[New tool brings vector search to scientific literature](https://www.cheme.engineering.cmu.edu/news/2025/02/20-kitchin-litdb.html)**
    - LitDB 科学文献搜索工具

11. **[Vector Search, Approximate Nearest Neighbor Papers](https://github.com/matchyc/vector-search-papers)**
    - 向量搜索论文集合

#### LibSQL 集成

12. **[LibSQL - LangChain Docs](https://docs.langchain.com/oss/javascript/integrations/vectorstores/libsql)**
    - LangChain LibSQL 集成

13. **[Using SQLite as your LLM Vector Database](https://turso.tech/blog/using-sqlite-as-your-llm-vector-database)**
    - SQLite 作为 LLM 向量数据库

---

### 9.9 成功指标（新增）

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| **检索准确性** | Top-10 召回率 > 80% | 人工评估测试集 |
| **查询延迟** | P95 < 500ms | 性能基准测试 |
| **RAG 答案质量** | 幻觉率 < 5% | 专家评估 |
| **向量索引大小** | < 原始文本的 50% | 存储统计 |
| **嵌入缓存命中率** | > 60% | 缓存监控 |

---

## 结论

本计划提供了一个全面的重构路线图，将现有的学术助手从紧耦合、低内聚的架构转变为符合 2025 年最佳实践的高内聚低耦合架构，并集成了**先进的嵌入向量检索和 RAG 能力**。

**核心改进**:
1. ✅ **洋葱架构** + DDD 分层
2. ✅ **依赖注入**（InversifyJS）
3. ✅ **事件驱动**（解耦通信）
4. ✅ **配置外部化**（YAML）
5. ✅ **完整的测试**（单元 + 集成 + E2E）

**预期收益**:
- 🚀 更快的开发速度（新功能更容易添加）
- 🐛 更少的 Bug（更好的测试覆盖）
- 📚 更易维护（清晰的职责划分）
- 🔧 更易扩展（插件化架构）

**下一步**: 开始执行阶段 1（基础设施重构）

---

*文档创建时间: 2025-01-10*
*版本: 2.0.0*
*作者: AI Research Assistant*
*基于: Plan 1 和最新架构研究*
