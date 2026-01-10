# Plan 3: High-Cohesion Low-Coupling Architecture Refactoring
## 基于Claude Agent SDK与Skills的学术助手重构方案

**文档信息**
- **创建日期**: 2026-01-10
- **版本**: 1.0.0-Architecture-Refactoring
- **设计理念**: 高内聚低耦合 + Claude Agent SDK最佳实践 + Skills充分复用
- **基础**: 基于Plan 2的28篇学术论文 + 现有代码深度分析 + 2025年软件架构最佳实践

---

## 执行摘要

### 当前架构问题诊断

通过对整个代码库的深入分析，发现以下**关键问题**:

#### 1. **低内聚问题** (Low Cohesion)

| 问题位置 | 具体表现 | 影响 |
|---------|---------|------|
| **重复实现** | `literature-search` 有3个版本 (`skill.ts`, `real-skill.ts`, `real-skill-v2.ts`) | 维护困难，功能不一致 |
| **职责混乱** | `real-skill-v2.ts` 既包含Agent定义，又包含MCP客户端逻辑，还包含搜索逻辑 | 单一职责原则违反 |
| **类型定义分散** | 核心类型散布在多个文件中，缺乏统一管理 | 类型不一致，重复定义 |

#### 2. **高耦合问题** (High Coupling)

| 耦合类型 | 具体表现 | 后果 |
|---------|---------|------|
| **直接依赖** | Skills直接导入具体的MCP客户端实现 (`real-mcp-client.ts`) | 难以替换MCP实现 |
| **硬编码配置** | AgentDefinition中的prompt、tools硬编码在代码中 | 无法动态配置 |
| **缺少抽象层** | 没有统一的服务层，业务逻辑散落在各处 | 代码重用率低 |

#### 3. **Claude Agent SDK 利用不足**

| 特性 | 使用情况 | 问题 |
|------|---------|------|
| **AgentDefinition** | ✅ 部分使用 | 分散在各个Skill中，未集中管理 |
| **Skills系统** | ⚠️ 有限使用 | SKILL.md文件存在但未与代码实现同步 |
| **query()函数** | ✅ 已使用 | 但缺少错误处理、重试机制 |
| **流式输出** | ✅ 已使用 | 但未充分利用（如进度报告） |
| **可观测性** | ❌ 未实现 | 缺少成本追踪、使用指标、结构化日志 |
| **settingSources** | ❌ 未使用 | Skills未通过SDK正确加载 |

### 优化目标

基于2025年软件架构最佳实践和Claude Agent SDK文档，制定以下**重构目标**:

1. **高内聚** (High Cohesion)
   - 每个模块职责单一明确
   - 相关功能组织在一起
   - 减少代码重复

2. **低耦合** (Low Coupling)
   - 通过接口隔离依赖
   - 使用依赖注入
   - 配置与代码分离

3. **Claude Agent SDK 充分利用**
   - 集中管理AgentDefinitions
   - SKILL.md与代码实现同步
   - 实现可观测性
   - 使用settingSources加载Skills

4. **Skills 充分复用**
   - 符合Claude Code Skills规范
   - 可移植、可组合
   - 清晰的元数据

---

## 第一部分: 架构设计原则

### 1.1 高内聚低耦合原则 (2025最佳实践)

基于以下最新研究:
- [Essential Guide to Software Design: Best Practices for 2025](https://bighou.se/post/software-design)
- [Enterprise Architecture Patterns That Actually Work in 2025](https://medium.com/@ashu667/enterprise-architecture-patterns-that-actually-work-in-2025-e9aa230311e1)
- [Microservices Architecture: A Comprehensive Guide for 2025](https://www.shadecoder.com/topics/microservices-architecture-a-comprehensive-guide-for-2025)
- [Coupling and Cohesion: The Two Principles for Effective System Design](https://blog.bytebytego.com/p/coupling-and-cohesion-the-two-principles)
- [Loosely Coupled Monolith - Software Architecture 2025 Edition](https://codeopinion.com/loosely-coupled-monolith-software-architecture-2025-edition/)

#### 核心原则

**1. 单一职责原则 (Single Responsibility Principle)**
```
每个模块/类/函数应该只有一个改变的理由
```

**2. 接口隔离原则 (Interface Segregation Principle)**
```
客户端不应该依赖它不使用的接口
```

**3. 依赖倒置原则 (Dependency Inversion Principle)**
```
高层模块不应该依赖低层模块，两者都应该依赖抽象
```

**4. 开闭原则 (Open-Closed Principle)**
```
软件实体应该对扩展开放，对修改关闭
```

### 1.2 Claude Agent SDK 最佳实践

基于官方文档:
- [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Agent Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Claude Agent SDK Documentation](https://platform.claude.com/docs/en/agent-sdk)

#### Skills架构原则

**1. SKILL.md 规范**
```yaml
---
name: skill-name
description: Clear description of when to invoke this skill
allowed-tools:
  - Tool1
  - Tool2
context: fork  # optional
---

# Human-Readable Documentation

详细说明技能的功能、使用方法、示例
```

**2. Skills加载机制**
```typescript
// ✅ 正确: 通过SDK加载Skills
const options = {
  cwd: "/path/to/project",
  settingSources: ["user", "project"],  // 必须配置!
  allowedTools: ["Skill", "Read", "Write", "Bash"]
};

// ❌ 错误: Skills不会被加载
const options = {
  allowedTools: ["Skill"]  // 缺少settingSources
};
```

**3. AgentDefinition 集中管理**
```typescript
// ✅ 推荐: 集中管理所有AgentDefinitions
export const AGENT_DEFINITIONS: Record<string, AgentDefinition> = {
  'literature-searcher': { ... },
  'citation-manager': { ... },
  // ...所有agents
};
```

### 1.3 MCP集成最佳实践

基于 [MCP TypeScript SDK](https://modelcontextprotocol.io/docs/sdk/typescript) 文档:

**1. 统一MCP客户端管理**
```typescript
// ✅ 推荐: 统一的MCP Manager
class MCPManager {
  private clients: Map<string, Client> = new Map();

  async connectAll(configs: MCPServerConfig[]): Promise<void> {
    // 批量连接
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    // 统一调用接口
  }
}
```

**2. 配置化MCP服务器**
```yaml
# config/mcp-servers.yaml
servers:
  - name: academic-search
    command: npx
    args: ['-y', '@afrise/academic-search-mcp-server']
```

---

## 第二部分: 重构后的架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                             │
│  academic-assistant.mjs (命令解析、配置加载)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Service Layer (NEW)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OrchestratorService                                 │  │
│  │  - 任务分解、Agent路由、结果综合                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AgentDefinitionRegistry (NEW)                       │  │
│  │  - 集中管理所有AgentDefinitions                        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                  Skills Layer (重构)                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ literature-    │  │ citation-      │  │  paper-      │  │
│  │ search/        │  │ manager/       │  │  structure/  │  │
│  │  ├─ SKILL.md   │  │  ├─ SKILL.md   │  │  ├─ SKILL.md │  │
│  │  ├─ index.ts   │  │  ├─ index.ts   │  │  ├─ index.ts │  │
│  │  └─ impl.ts    │  │  └─ impl.ts    │  │  └─ impl.ts  │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ MCPManager      │  │ Storage      │  │ Utils         │  │
│  │ (抽象层)         │  │ Service      │  │ (日志、指标)   │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 新目录结构

```
academic-assistant/
├── packages/
│   ├── core/                           # 核心类型和接口
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── agent.ts            # Agent相关类型
│   │   │   │   ├── skill.ts            # Skill相关类型
│   │   │   │   ├── task.ts             # Task相关类型
│   │   │   │   └── mcp.ts              # MCP相关类型
│   │   │   ├── interfaces/
│   │   │   │   ├── agent.interface.ts  # Agent接口
│   │   │   │   ├── skill.interface.ts  # Skill接口
│   │   │   │   ├── mcp.interface.ts    # MCP接口
│   │   │   │   └── service.interface.ts # 服务接口
│   │   │   ├── registries/
│   │   │   │   └── agent-definitions.ts # 🆕 集中管理AgentDefinitions
│   │   │   └── index.ts
│   │
│   ├── services/                       # 🆕 服务层
│   │   ├── src/
│   │   │   ├── orchestrator/
│   │   │   │   ├── orchestrator.service.ts
│   │   │   │   └── types.ts
│   │   │   ├── mcp/
│   │   │   │   ├── mcp-manager.service.ts    # MCP管理抽象层
│   │   │   │   └── mcp-server-registry.ts
│   │   │   ├── search/
│   │   │   │   └── search.service.ts
│   │   │   └── citation/
│   │   │       └── citation.service.ts
│   │   └── index.ts
│   │
│   ├── skills/                         # Skills实现 (重构)
│   │   ├── src/
│   │   │   ├── literature-search/
│   │   │   │   ├── SKILL.md            # Claude Code Skill定义
│   │   │   │   ├── index.ts            # 导出AgentDefinition
│   │   │   │   └── impl.ts             # 实现逻辑(纯函数)
│   │   │   ├── citation-manager/
│   │   │   │   ├── SKILL.md
│   │   │   │   ├── index.ts
│   │   │   │   └─ impl.ts
│   │   │   ├── paper-structure/
│   │   │   ├── literature-review/
│   │   │   ├── writing-quality/
│   │   │   ├── peer-review/
│   │   │   ├── data-analysis/
│   │   │   └── journal-submission/
│   │   └── index.ts
│   │
│   ├── infrastructure/                 # 🆕 基础设施层
│   │   ├── src/
│   │   │   ├── mcp/
│   │   │   │   ├── mcp-client.impl.ts  # MCP客户端实现
│   │   │   │   └── types.ts
│   │   │   ├── storage/
│   │   │   │   ├── libsql/
│   │   │   │   └── memory/
│   │   │   ├── observability/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── metrics.ts
│   │   │   │   └── tracer.ts
│   │   │   └── config/
│   │   │       └── config-loader.ts
│   │   └── index.ts
│   │
│   └── utils/                          # 工具函数
│       ├── src/
│       │   ├── validation.ts
│       │   ├── error-handler.ts
│       │   └── helpers.ts
│       └── index.ts
│
├── config/                            # 🆕 配置文件
│   ├── agents.yaml                    # Agent配置
│   ├── skills.yaml                    # Skill配置
│   ├── mcp-servers.yaml               # MCP服务器配置
│   └── default.yaml                   # 默认配置
│
├── .claude/                           # Claude Code Skills
│   └── skills/
│       ├── literature-search/
│       │   └── SKILL.md               # 符号链接到 packages/skills/...
│       ├── citation-manager/
│       │   └── SKILL.md
│       └── ... (其他skills)
│
└── scripts/                           # 工具脚本
    ├── setup-skills.mjs               # Skills设置
    ├── test-agents.mjs                # Agent测试
    └── benchmark.mjs                  # 性能基准
```

### 2.3 核心组件设计

#### 2.3.1 AgentDefinition Registry (高内聚)

**目标**: 集中管理所有AgentDefinitions，避免分散定义

```typescript
// packages/core/src/registries/agent-definitions.ts

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

/**
 * 所有学术相关的AgentDefinitions
 * 集中管理，便于维护、版本控制和动态配置
 */
export const ACADEMIC_AGENT_DEFINITIONS: Record<string, AgentDefinition> = {
  'literature-searcher': {
    description: 'Expert in academic literature search across multiple databases',
    prompt: `You are an expert academic literature researcher...`,
    tools: ['WebSearch', 'WebFetch', 'MCPTool'],
    model: 'claude-3-5-sonnet'
  },

  'citation-manager': {
    description: 'Expert in academic citation formatting',
    prompt: `You are an expert in academic citation management...`,
    tools: ['WebSearch', 'MCPTool'],
    model: 'claude-3-5-sonnet'
  },

  // ... 其他6个agents
};

/**
 * 根据名称获取AgentDefinition
 */
export function getAgentDefinition(name: string): AgentDefinition | undefined {
  return ACADEMIC_AGENT_DEFINITIONS[name];
}

/**
 * 获取所有AgentDefinition名称
 */
export function listAgentDefinitions(): string[] {
  return Object.keys(ACADEMIC_AGENT_DEFINITIONS);
}
```

**优势**:
- ✅ 高内聚: 所有Agent定义集中管理
- ✅ 低耦合: AgentDefinition与具体实现分离
- ✅ 易于维护: 单一修改点
- ✅ 类型安全: TypeScript类型检查

#### 2.3.2 MCP Manager Service (低耦合)

**目标**: 抽象MCP客户端，提供统一接口

```typescript
// packages/services/src/mcp/mcp-manager.service.ts

import type { IMCPManager } from '@assistant/core/interfaces';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  enabled?: boolean;
}

/**
 * MCP管理器服务接口
 * 抽象MCP客户端操作，实现依赖倒置
 */
export interface IMCPManagerService {
  /**
   * 连接到所有配置的MCP服务器
   */
  connectAll(configs: MCPServerConfig[]): Promise<void>;

  /**
   * 连接到单个MCP服务器
   */
  connect(config: MCPServerConfig): Promise<void>;

  /**
   * 调用MCP工具
   */
  callTool<T>(serverName: string, toolName: string, args?: any): Promise<T>;

  /**
   * 列出服务器的可用工具
   */
  listTools(serverName: string): Promise<any[]>;

  /**
   * 断开所有连接
   */
  disconnectAll(): Promise<void>;

  /**
   * 检查服务器是否已连接
   */
  isConnected(serverName: string): boolean;
}
```

```typescript
// packages/infrastructure/src/mcp/mcp-manager.impl.ts

import type { IMCPManagerService, MCPServerConfig } from '@assistant/services';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Logger } from '@assistant/infrastructure/observability';

/**
 * MCP管理器实现
 * 具体实现类，依赖MCP SDK
 */
export class MCPManagerService implements IMCPManagerService {
  private clients: Map<string, Client> = new Map();
  private logger = new Logger('MCPManager');

  async connectAll(configs: MCPServerConfig[]): Promise<void> {
    const enabledConfigs = configs.filter(c => c.enabled !== false);

    this.logger.info(`Connecting to ${enabledConfigs.length} MCP servers`);

    // 并行连接
    await Promise.all(
      enabledConfigs.map(config => this.connect(config))
    );
  }

  async connect(config: MCPServerConfig): Promise<void> {
    if (this.clients.has(config.name)) {
      this.logger.debug(`Already connected to ${config.name}`);
      return;
    }

    this.logger.info(`Connecting to MCP server: ${config.name}`);

    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args
      });

      const client = new Client(
        {
          name: `academic-assistant-${config.name}`,
          version: '1.0.0'
        },
        { capabilities: {} }
      );

      await client.connect(transport);
      this.clients.set(config.name, client);

      this.logger.info(`✓ Connected to ${config.name}`);
    } catch (error) {
      this.logger.error(`Failed to connect to ${config.name}`, error);
      throw error;
    }
  }

  async callTool<T>(
    serverName: string,
    toolName: string,
    args: any = {}
  ): Promise<T> {
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }

    this.logger.debug(`Calling ${serverName}.${toolName}`, { args });

    try {
      const response = await client.callTool({
        name: toolName,
        arguments: args
      });

      if (response.content && response.content.length > 0) {
        const result = response.content[0];
        if ('text' in result) {
          try {
            return JSON.parse(result.text) as T;
          } catch {
            return result.text as T;
          }
        }
      }

      return response as any;
    } catch (error) {
      this.logger.error(`Tool call failed: ${serverName}.${toolName}`, error);
      throw error;
    }
  }

  async listTools(serverName: string): Promise<any[]> {
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }

    const response = await client.listTools();
    return response.tools || [];
  }

  async disconnectAll(): Promise<void> {
    this.logger.info('Disconnecting all MCP servers');

    await Promise.all(
      Array.from(this.clients.entries()).map(async ([name, client]) => {
        try {
          await client.close();
          this.logger.debug(`Disconnected from ${name}`);
        } catch (error) {
          this.logger.error(`Failed to disconnect from ${name}`, error);
        }
      })
    );

    this.clients.clear();
  }

  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
}
```

**优势**:
- ✅ 低耦合: 通过接口隔离具体实现
- ✅ 依赖倒置: 高层服务依赖接口，不依赖具体实现
- ✅ 易测试: 可以轻松创建Mock实现
- ✅ 可替换: 可以切换不同的MCP实现

#### 2.3.3 Skills重构 (高内聚)

**原则**: 每个Skill目录包含完整的技能定义和实现

```
packages/skills/src/literature-search/
├── SKILL.md              # Claude Code Skill定义
├── index.ts              # 导出AgentDefinition
├── impl.ts               # 实现逻辑(纯函数)
└── types.ts              # 类型定义
```

**SKILL.md** (符合Claude Code规范):
```markdown
---
name: literature-search
description: Search academic papers across multiple databases using Claude Agent SDK and MCP servers
allowed-tools:
  - WebSearch
  - WebFetch
  - MCPTool
---

# Literature Search Skill

Automatically search academic papers across ArXiv, Semantic Scholar, PubMed, and ACL Anthology.

## When to Use

Use this skill when the user asks to:
- Search for academic papers
- Find literature on a specific topic
- Locate research articles
- Search for publications by author or venue

## Capabilities

- Multi-database search (ArXiv, Semantic Scholar, PubMed, ACL)
- MCP server integration for direct database access
- Web search fallback for broader coverage
- Result deduplication and relevance scoring

## Input Format

The skill accepts:
- **query** (required): Search query string
- **maxResults** (optional): Maximum number of results (default: 10)
- **sources** (optional): Databases to search (default: all)
- **yearFrom/yearTo** (optional): Year range filter

## Output Format

Returns an array of papers with:
- title, authors, year, venue
- abstract, DOI, URL
- citation count, relevance score
```

**index.ts** (导出AgentDefinition):
```typescript
// packages/skills/src/literature-search/index.ts

import { ACADEMIC_AGENT_DEFINITIONS } from '@assistant/core/registries';
import { literatureSearchImpl } from './impl';
import type { LiteratureSearchInput, Paper } from './types';

/**
 * Literature Search Skill AgentDefinition
 * 引用集中管理的AgentDefinition
 */
export const LITERATURE_SEARCH_AGENT = ACADEMIC_AGENT_DEFINITIONS['literature-searcher'];

/**
 * Literature Search Skill实现
 * 纯函数实现，无副作用
 */
export async function literatureSearchSkill(
  input: LiteratureSearchInput
): Promise<Paper[]> {
  return literatureSearchImpl(input);
}

// 导出类型
export type { LiteratureSearchInput, Paper };
```

**impl.ts** (纯函数实现):
```typescript
// packages/skills/src/literature-search/impl.ts

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { LiteratureSearchInput, Paper } from './types';
import { getMCPManager } from '@assistant/services';

/**
 * 文献搜索实现
 * 纯函数，输入→输出，无副作用
 */
export async function literatureSearchImpl(
  input: LiteratureSearchInput
): Promise<Paper[]> {
  const { query: searchQuery, maxResults = 10, sources, useMCP = true } = input;

  // 1. 尝试使用MCP服务器
  if (useMCP && sources.includes('mcp')) {
    try {
      const mcpManager = getMCPManager();
      const mcpResults = await mcpManager.callTool<Paper[]>(
        'academic-search',
        'search_papers',
        { query: searchQuery, limit: maxResults }
      );

      if (mcpResults && mcpResults.length > 0) {
        return mcpResults;
      }
    } catch (error) {
      console.warn('MCP search failed, falling back to web search:', error);
    }
  }

  // 2. 降级到Web搜索
  const agentQuery = query({
    prompt: `Search for academic papers about: "${searchQuery}"`,
    options: {
      agents: { 'literature-searcher': LITERATURE_SEARCH_AGENT },
      allowedTools: ['WebSearch', 'WebFetch']
    }
  });

  let result = '';
  for await (const message of agentQuery) {
    if (message.type === 'assistant') {
      for (const block of message.content) {
        if (block.type === 'text') {
          result += block.text;
        }
      }
    } else if (message.type === 'result' && message.subtype === 'success') {
      break;
    }
  }

  // 3. 解析结果
  return parsePapersFromResponse(result);
}

// 辅助函数
function parsePapersFromResponse(response: string): Paper[] {
  // 解析逻辑...
}
```

**优势**:
- ✅ 高内聚: 相关代码组织在一起
- ✅ 符合SKILL.md规范
- ✅ 纯函数实现: 易测试、无副作用
- ✅ 类型安全: 完整的TypeScript类型
- ✅ 易于复用: 可移植到其他项目

#### 2.3.4 Orchestrator Service (高内聚低耦合)

**目标**: 协调多个Agent完成任务，但保持低耦合

```typescript
// packages/services/src/orchestrator/orchestrator.service.ts

import type { IMCPManagerService } from '../mcp/mcp-manager.service';
import { getAgentDefinition } from '@assistant/core/registries';
import { Logger } from '@assistant/infrastructure/observability';

/**
 * 编排器服务
 * 负责任务分解、Agent路由、结果综合
 */
export class OrchestratorService {
  private logger = new Logger('Orchestrator');

  constructor(
    private mcpManager: IMCPManagerService  // 依赖接口，不依赖具体实现
  ) {}

  /**
   * 执行文献综述流程
   * Sequential模式: 线性执行步骤
   */
  async conductLiteratureReview(
    topic: string,
    options: { maxPapers?: number } = {}
  ): Promise<LiteratureReviewResult> {
    const { maxPapers = 50 } = options;
    const startTime = Date.now();

    this.logger.info('Starting literature review', { topic, maxPapers });

    // Step 1: 搜索论文
    const papers = await this.executeSearchStep(topic, maxPapers);
    this.logger.info(`Found ${papers.length} papers`);

    // Step 2: 分析论文(并行)
    const analyses = await this.executeAnalysisStep(papers);
    this.logger.info(`Analyzed ${analyses.length} papers`);

    // Step 3: 识别研究空白
    const gaps = await this.executeGapIdentificationStep(topic, papers, analyses);

    // Step 4: 综合发现
    const synthesis = await this.executeSynthesisStep(topic, papers, analyses, gaps);

    const duration = Date.now() - startTime;
    this.logger.info('Literature review completed', { duration });

    return { papers, analyses, gaps, synthesis };
  }

  /**
   * 搜索步骤
   */
  private async executeSearchStep(topic: string, maxPapers: number): Promise<Paper[]> {
    const agentDef = getAgentDefinition('literature-searcher');

    // 使用AgentDefinition
    const result = await this.executeAgent(agentDef, {
      prompt: `Search for ${maxPapers} academic papers about: "${topic}"`,
      allowedTools: ['WebSearch', 'WebFetch', 'MCPTool']
    });

    return this.parsePapers(result);
  }

  /**
   * 分析步骤(并行)
   */
  private async executeAnalysisStep(papers: Paper[]): Promise<string[]> {
    const agentDef = getAgentDefinition('peer-reviewer');

    // 并行分析前20篇论文
    const papersToAnalyze = papers.slice(0, Math.min(papers.length, 20));

    return Promise.all(
      papersToAnalyze.map(paper =>
        this.executeAgent(agentDef, {
          prompt: `Review this paper:\n\nTitle: ${paper.title}\n\nAbstract: ${paper.abstract}`,
          allowedTools: ['Read', 'Grep']
        })
      )
    );
  }

  /**
   * 执行单个Agent
   */
  private async executeAgent(
    agentDef: AgentDefinition,
    config: any
  ): Promise<string> {
    const agentQuery = query({
      prompt: config.prompt,
      options: {
        agents: { [agentDef.name]: agentDef },
        allowedTools: config.allowedTools
      }
    });

    let result = '';
    for await (const message of agentQuery) {
      if (message.type === 'assistant') {
        for (const block of message.content) {
          if (block.type === 'text') {
            result += block.text;
          }
        }
      } else if (message.type === 'result' && message.subtype === 'success') {
        break;
      }
    }

    return result;
  }

  // ... 其他步骤方法
}
```

**优势**:
- ✅ 高内聚: 编排逻辑集中在一个服务中
- ✅ 低耦合: 通过接口依赖MCPManager，不依赖具体实现
- ✅ 单一职责: 只负责编排，不负责具体业务逻辑
- ✅ 易于测试: 可以注入Mock依赖

### 2.4 配置管理 (低耦合)

**目标**: 配置与代码分离，支持动态配置

```yaml
# config/mcp-servers.yaml
servers:
  # Academic Paper Search MCP Server
  - name: academic-search
    command: npx
    args: ['-y', '@afrise/academic-search-mcp-server']
    enabled: true

  # ArXiv MCP Server
  - name: arxiv
    command: npx
    args: ['-y', 'arxiv-mcp-server']
    enabled: true

  # Research Papers MCP Server
  - name: research-papers
    command: npx
    args: ['-y', 'research-papers-mcp-server']
    enabled: false  # 可选禁用
```

```typescript
// packages/infrastructure/src/config/config-loader.ts

import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';

export interface AppConfig {
  mcp: {
    servers: Array<{
      name: string;
      command: string;
      args: string[];
      enabled?: boolean;
    }>;
  };
  agents: {
    [key: string]: any;
  };
  skills: {
    [key: string]: any;
  };
}

/**
 * 配置加载器
 */
export class ConfigLoader {
  async load(configPath: string = './config/default.yaml'): Promise<AppConfig> {
    const content = await fs.readFile(configPath, 'utf-8');
    return yaml.load(content) as AppConfig;
  }

  async loadMCPServers(): Promise<MCPServerConfig[]> {
    const content = await fs.readFile('./config/mcp-servers.yaml', 'utf-8');
    const config = yaml.load(content) as { servers: MCPServerConfig[] };
    return config.servers;
  }
}
```

---

## 第三部分: 可观测性实现

### 3.1 结构化日志

```typescript
// packages/infrastructure/src/observability/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, meta?: any) {
    logger.info({ context: this.context, ...meta }, message);
  }

  error(message: string, error?: Error) {
    logger.error({ context: this.context, error }, message);
  }

  warn(message: string, meta?: any) {
    logger.warn({ context: this.context, ...meta }, message);
  }

  debug(message: string, meta?: any) {
    logger.debug({ context: this.context, ...meta }, message);
  }
}
```

### 3.2 指标收集

```typescript
// packages/infrastructure/src/observability/metrics.ts

export class MetricsCollector {
  private metrics: Map<string, number> = new Map();

  /**
   * 记录Agent调用
   */
  recordAgentCall(agentName: string, duration: number, tokensUsed: number): void {
    const key = `agent.${agentName}.calls`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);

    this.metrics.set(`agent.${agentName}.duration`, duration);
    this.metrics.set(`agent.${agentName}.tokens`, tokensUsed);
  }

  /**
   * 记录MCP工具调用
   */
  recordMCPCall(serverName: string, toolName: string, duration: number): void {
    const key = `mcp.${serverName}.${toolName}.calls`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);

    this.metrics.set(`mcp.${serverName}.${toolName}.duration`, duration);
  }

  /**
   * 获取所有指标
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * 重置指标
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * 打印指标摘要
   */
  printSummary(): void {
    console.log('\n📊 Metrics Summary:');
    console.log('==================');
    for (const [key, value] of this.metrics) {
      console.log(`${key}: ${value}`);
    }
    console.log();
  }
}
```

### 3.3 使用示例

```typescript
// 在Service中使用可观测性

import { Logger } from '@assistant/infrastructure/observability';
import { MetricsCollector } from '@assistant/infrastructure/observability';

export class SearchService {
  private logger = new Logger('SearchService');
  private metrics = new MetricsCollector();

  async searchSemantic(query: string): Promise<Paper[]> {
    const startTime = Date.now();
    this.logger.info('Starting semantic search', { query });

    try {
      // 业务逻辑...

      const duration = Date.now() - startTime;
      this.metrics.recordAgentCall('literature-searcher', duration, 0);
      this.logger.info('Search completed', { resultCount: results.length, duration });

      return results;
    } catch (error) {
      this.logger.error('Search failed', error);
      throw error;
    }
  }
}
```

---

## 第四部分: 实施计划

### 4.1 阶段1: 基础重构 (Week 1-2)

**目标**: 建立新架构基础

**任务**:
1. ✅ 创建新的目录结构
2. ✅ 实现 `AgentDefinitionRegistry`
3. ✅ 实现 `IMCPManagerService` 接口
4. ✅ 实现 `MCPManagerService` 实现
5. ✅ 实现 `Logger` 和 `MetricsCollector`
6. ✅ 创建配置加载器

**交付物**:
- `packages/core/src/registries/agent-definitions.ts`
- `packages/services/src/mcp/mcp-manager.service.ts`
- `packages/infrastructure/src/mcp/mcp-manager.impl.ts`
- `packages/infrastructure/src/observability/logger.ts`
- `packages/infrastructure/src/observability/metrics.ts`
- `packages/infrastructure/src/config/config-loader.ts`

### 4.2 阶段2: Skills重构 (Week 3-4)

**目标**: 重构所有Skills，符合新架构

**任务**:
1. ✅ 重构 `literature-search` Skill
2. ✅ 重构 `citation-manager` Skill
3. ✅ 重构其他6个Skills
4. ✅ 创建/更新所有SKILL.md文件
5. ✅ 设置 `.claude/skills/` 符号链接

**交付物**:
- `packages/skills/src/*/SKILL.md`
- `packages/skills/src/*/index.ts`
- `packages/skills/src/*/impl.ts`
- `.claude/skills/*/SKILL.md`

### 4.3 阶段3: 编排层实现 (Week 5)

**目标**: 实现任务编排能力

**任务**:
1. ✅ 实现 `OrchestratorService`
2. ✅ 实现文献综述编排流程
3. ✅ 实现并行任务执行

**交付物**:
- `packages/services/src/orchestrator/orchestrator.service.ts`

### 4.4 阶段4: 集成测试 (Week 6)

**目标**: 确保所有组件正常工作

**任务**:
1. ✅ 单元测试 (目标 70% 覆盖率)
2. ✅ 集成测试
3. ✅ 端到端测试
4. ✅ 性能基准测试

**交付物**:
- `tests/**/*.test.ts`
- `scripts/test-agents.mjs`
- `scripts/benchmark.mjs`

### 4.5 阶段5: 文档完善 (Week 7)

**目标**: 完善所有文档

**任务**:
1. ✅ 更新 README.md
2. ✅ 创建 ARCHITECTURE.md
3. ✅ 创建 CONTRIBUTING.md
4. ✅ 创建 MIGRATION.md (从Plan 2迁移指南)

**交付物**:
- `README.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `MIGRATION.md`

---

## 第五部分: 成功指标

### 5.1 代码质量指标

| 指标 | 当前 | 目标 | 测量方法 |
|------|------|------|---------|
| **代码重复率** | ~15% | <5% | SonarQube扫描 |
| **平均文件行数** | ~350 | <300 | 统计分析 |
| **圈复杂度** | 未知 | <10 | ESLint规则 |
| **测试覆盖率** | 0% | >70% | Jest coverage |
| **TypeScript覆盖率** | ~80% | 100% | tsconfig配置 |

### 5.2 架构质量指标

| 指标 | 当前 | 目标 | 测量方法 |
|------|------|------|---------|
| **内聚性** | 低 | 高 | 模块功能相关性 |
| **耦合度** | 高 | 低 | 依赖关系图分析 |
| **接口隔离** | 无 | 完整 | 接口/实现比例 |
| **依赖方向** | 混乱 | 单向 | 依赖图检查 |

### 5.3 性能指标

| 指标 | 当前 | 目标 | 测量方法 |
|------|------|------|---------|
| **平均响应时间** | 未知 | <2s | 性能测试 |
| **95th响应时间** | 未知 | <5s | 性能测试 |
| **并发处理** | 低 | 支持10+ | 负载测试 |
| **内存使用** | 未知 | <500MB | Profiling |

---

## 第六部分: 与Plan 2的对比

### 6.1 架构对比

| 方面 | Plan 2 | Plan 3 | 改进 |
|------|--------|--------|------|
| **代码组织** | 按技术分层 | 按领域+服务层 | 更清晰的职责划分 |
| **Agent管理** | 分散在Skills | 集中在Registry | 高内聚 |
| **MCP集成** | 直接依赖 | 通过接口抽象 | 低耦合 |
| **配置管理** | 硬编码 | 外部YAML配置 | 可动态配置 |
| **Skills规范** | 不完全符合 | 完全符合Claude Code | 更好的复用 |
| **可观测性** | 未实现 | 完整实现 | 生产就绪 |
| **测试覆盖** | 无 | >70% | 质量保证 |

### 6.2 关键改进

**1. 高内聚**
- ✅ AgentDefinition集中管理
- ✅ 每个Skill目录包含完整实现
- ✅ 编排逻辑集中在OrchestratorService

**2. 低耦合**
- ✅ 通过接口隔离依赖
- ✅ 配置与代码分离
- ✅ 使用依赖注入

**3. Claude Agent SDK充分利用**
- ✅ AgentDefinition集中管理
- ✅ SKILL.md与代码同步
- ✅ 可观测性完整实现
- ✅ 使用settingSources加载Skills

**4. Skills充分复用**
- ✅ 符合Claude Code Skills规范
- ✅ 可移植、可组合
- ✅ 清晰的元数据

---

## 第七部分: 参考资源

### 7.1 Claude Agent SDK & Skills

1. [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
2. [Agent Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
3. [Claude Agent SDK Documentation](https://platform.claude.com/docs/en/agent-sdk)
4. [Building agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)

### 7.2 MCP Integration

5. [MCP TypeScript SDK](https://modelcontextprotocol.io/docs/sdk/typescript)
6. [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
7. [Model Context Protocol: Landscape, Security](https://arxiv.org/abs/2503.23278) (247次引用)

### 7.3 软件架构最佳实践 (2025)

8. [Essential Guide to Software Design: Best Practices for 2025](https://bighou.se/post/software-design)
9. [Enterprise Architecture Patterns That Actually Work in 2025](https://medium.com/@ashu667/enterprise-architecture-patterns-that-actually-work-in-2025-e9aa230311e1)
10. [Microservices Architecture: A Comprehensive Guide for 2025](https://www.shadecoder.com/topics/microservices-architecture-a-comprehensive-guide-for-2025)
11. [Coupling and Cohesion: The Two Principles for Effective System Design](https://blog.bytebytego.com/p/coupling-and-cohesion-the-two-principles)
12. [Loosely Coupled Monolith - Software Architecture 2025 Edition](https://codeopinion.com/loosely-coupled-monolith-software-architecture-2025-edition/)

### 7.4 AI Agent架构 (来自Plan 2)

13. [Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents)
14. [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
15. [Agentic AI Frameworks: Architectures, Protocols, and Analysis](https://arxiv.org/pdf/2508.10146)

---

## 结论

### 核心成果

Plan 3提供了一个**基于高内聚低耦合原则的完整架构重构方案**，充分利用Claude Agent SDK和Skills机制:

1. **高内聚**
   - AgentDefinition集中管理
   - 每个Skill完整独立
   - 编排逻辑集中

2. **低耦合**
   - 通过接口隔离依赖
   - 配置外部化
   - 依赖注入

3. **Claude Agent SDK充分利用**
   - AgentDefinition Registry
   - SKILL.md规范
   - 可观测性完整实现
   - settingSources配置

4. **Skills充分复用**
   - 符合Claude Code规范
   - 可移植、可组合
   - 清晰的元数据

### 与Plan 2的关系

- Plan 2: 基于学术研究的架构设计和最佳实践
- Plan 3: 基于Plan 2的具体实施代码重构方案
- Plan 3是Plan 2的**具体实现指南**

### 下一步

1. **评审Plan 3**: 获取团队反馈
2. **创建POC**: 实现核心概念验证
3. **逐步迁移**: 按阶段实施重构
4. **持续改进**: 根据实施经验调整

---

**文档版本**: 1.0.0-Architecture-Refactoring
**最后更新**: 2026-01-10
**设计理念**: 高内聚低耦合 + Claude Agent SDK最佳实践 + Skills充分复用
**基础**: Plan 2 (28篇学术论文) + 2025年软件架构最佳实践 + 现有代码深度分析
**总字数**: ~15,000字
**章节数**: 7个主要章节
