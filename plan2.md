# Plan 2: 简化架构重构计划（完整版）

## 文档信息

- **创建日期**: 2025-01-10
- **最后更新**: 2025-01-10（完整架构分析）
- **版本**: 2.2.0-Final
- **设计理念**: KISS (Keep It Simple, Stupid) + 实用主义
- **目标**: 构建简单、实用、易维护的学术助手系统

---

## 执行摘要

基于 Plan 1 的真实实现和最新学术研究，本文档提供一个**完整优化的架构重构计划**。整合了 LibSQL 向量检索、RAG 智能问答、多 MCP 服务器集成，并充分考虑 Claude Agent SDK 和 Skills 的充分使用。

### 核心原则

1. **简单优先**: 能用 3 层就不设计 5 层
2. **渐进式重构**: 不推倒重来，逐步改进
3. **实用主义**: 解决实际问题，不追求理论完美
4. **可测试性**: 代码易于理解和测试
5. **生产就绪**: 监控、日志、错误处理完备

### 🆕 新增功能（基于最新研究）

1. **LibSQL 向量检索**: 语义搜索能力
2. **RAG 查询**: 智能问答（支持 Agentic RAG）
3. **多 MCP 服务器集成**: Academic Paper Search, ArXiv, Research Papers
4. **Claude Agent SDK 充分使用**: 可观测性、监控、成本追踪
5. **Skills 充分复用**: 8 个 Skills 的生产级实现

---

## 第一部分：现有代码深度分析

### 1.1 当前 Claude Agent SDK 使用情况

#### ✅ 已使用特性

**文件**: `packages/skills/src/literature-search/real-skill-v2.ts`

```typescript
// ✅ 1. AgentDefinition 使用
const LITERATURE_SEARCH_AGENT: AgentDefinition = {
  description: 'Expert in academic literature search',
  prompt: '...',
  tools: ['WebSearch', 'WebFetch', 'Bash'],
  model: 'sonnet'
};

// ✅ 2. query() 函数调用
const agentQuery = query({
  prompt: searchPrompt,
  options: {
    agents: { 'literature-searcher': this.agent },
    allowedTools: ['WebSearch', 'WebFetch'],
    permissionMode: 'bypassPermissions'
  }
});

// ✅ 3. 流式输出处理
for await (const message of agentQuery) {
  if (message.type === 'assistant') {
    // 处理助手回复
  } else if (message.type === 'result') {
    // 处理最终结果
  }
}
```

#### ❌ 未使用的生产特性

根据 [Claude Agent SDK 生产部署指南](https://www.mintmcp.com/blog/enterprise-development-guide-ai-agents)，以下特性**未使用**：

1. **可观测性（Observability）**:
   - 成本追踪（Cost Tracking）
   - 使用指标（Usage Metrics）
   - 结构化日志（Structured Logging）

2. **监控和追踪**:
   - OpenTelemetry 集成
   - Langfuse 追踪
   - MLflow 评估

3. **错误处理**:
   - 重试机制
   - 降级策略
   - 超时控制

### 1.2 Skills 使用情况分析

#### ✅ 已实现的 Skills

| Skill | 文件 | 功能 | 行数 |
|-------|------|------|------|
| LiteratureSearch | real-skill-v2.ts | 文献搜索 | 341 |
| CitationManager | real-skill.ts | 引用管理 | 205 |
| PaperStructure | skill.ts | 论文结构 | 281 |
| LiteratureReview | skill.ts | 文献综述 | 420 |
| WritingQuality | skill.ts | 写作质量 | 435 |
| PeerReview | skill.ts | 同行评审 | 567 |
| DataAnalysis | skill.ts | 数据分析 | 492 |
| JournalSubmission | skill.ts | 期刊投稿 | 496 |

**问题识别**:
- ❌ 重复实现：3 个版本的 LiteratureSearch
- ❌ 未使用 SKILL.md 规范
- ❌ 缺少统一的接口
- ❌ 缺少错误处理

### 1.3 MCP 集成情况

#### ✅ 已集成

```typescript
// packages/mcp-client/src/real-mcp-client.ts
export class RealMCPClient {
  async connect(serverName: string, command: string, args: string[]): Promise<void>
  async callTool<T>(serverName: string, toolName: string, args: any): Promise<T>
  async listTools(serverName: string): Promise<any[]>
}
```

#### ❌ 未集成的 MCP 服务器

根据 [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)，以下学术相关 MCP 服务器**未集成**：

1. **Academic Paper Search MCP Server** ([afrise](https://mcpservers.org/servers/afrise/academic-search-mcp-server))
2. **ArXiv MCP Server** ([blazickjp](https://github.com/blazickjp/arxiv-mcp-server))
3. **Research Papers MCP Server** ([mcpmarket](https://mcpmarket.com/server/research-4))

---

## 第二部分：最新研究成果整合

### 2.1 AI Agent 架构设计原则（2025）

根据最新研究，以下设计原则至关重要：

#### 核心原则

1. **单一职责（Single Responsibility）**
   - 每个 Agent 专注于一个领域
   - 参考: [Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents)

2. **简洁性（Simplicity）**
   - 避免过度设计
   - 参考: [AI Agentic Design Principles](https://microsoft.github.io/ai-agents-for-beginners/03-agentic-design-patterns/)

3. **透明度（Transparency）**
   - Agent 决策过程可见
   - 参考: [Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents)

4. **模块化（Modularity）**
   - Agent 独立，易于替换
   - 参考: [Building an AI Agent Architecture](https://aira.fr/building-an-ai-agent-architecture-key-design-principles)

### 2.2 多 Agent 编排模式（2025）

根据 [Azure AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)，推荐以下模式：

#### 1. Orchestrator-Worker 模式

```
┌─────────────────┐
│  Orchestrator    │  ← 协调者
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
Worker1   Worker2  Worker3  Worker4
```

**优势**:
- 清晰的职责分离
- 易于扩展
- 适合学术助手场景

#### 2. Sequential 模式

```
Agent1 → Agent2 → Agent3 → Agent4
```

**优势**:
- 简单直接
- 适合工作流场景
- 文献综述典型流程

### 2.3 文献综述自动化研究（2025）

根据最新论文 [AI Agents vs. Agentic AI](https://arxiv.org/abs/2505.10468) 和 [Automated literature research](https://academic.oup.com/nsr/advance-article/doi/10.1093/nsr/nwaf169/8120226)，关键发现：

1. **Agentic AI vs AI Agents**:
   - Agentic AI: 持续自主的系统
   - AI Agents: 特定任务的代理

2. **自动化文献综述流程**:
   - 搜索 → 筛选 → 分析 → 综合 → 生成
   - 每个 Agent 负责一个环节

3. **关键挑战**:
   - 信息准确性
   - 引用完整性
   - 避免幻觉

### 2.4 MCP 学术服务器生态

根据 [MCP Servers Repository](https://github.com/modelcontextprotocol/servers) 和 [Experiences with MCP Servers](https://arxiv.org/abs/2508.18489)：

#### 可用的学术 MCP 服务器

1. **Academic Paper Search** ([afrise](https://mcpservers.org/servers/afrise/academic-search-mcp-server))
   - 多源搜索
   - 引用管理

2. **ArXiv** ([blazickjp](https://github.com/blazickjp/arxiv-mcp-server))
   - 论文检索
   - 元数据提取

3. **Research Papers** ([mcpmarket](https://mcpmarket.com/server/research-4))
   - arXiv 论文
   - LLM 提示

---

## 第三部分：优化后的简化架构

### 3.1 整体架构（基于 2025 最佳实践）

```
┌─────────────────────────────────────────┐
│         CLI 入口层                       │
│  academic-assistant.mjs                 │
│  - 命令解析                             │
│  - 配置加载                             │
│  - 日志初始化                           │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│      Agent Orchestration Layer            │  🆕 编排层
│  ┌──────────────────────────────────┐   │
│  │  Orchestrator                      │   │
│  │  - 任务分解                        │   │
│  │  - Agent 路由                      │   │
│  │  - 结果综合                        │   │
│  └──────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│       Claude Agent SDK + Skills Layer      │  🆕 核心
│  ┌──────────────────────────────────┐   │
│  │  AgentDefinitions (8个Skills)     │   │
│  │  - literature-search             │   │
│  │  - citation-manager              │   │
│  │  - paper-structure               │   │
│  │  - literature-review             │   │
│  │  - writing-quality                │   │
│  │  - peer-review                   │   │
│  │  - data-analysis                 │   │
│  │  - journal-submission            │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  MCP Tools (3个服务器)            │   │
│  │  - academic-search               │   │
│  │  - arxiv                         │   │
│  │  - research-papers               │   │
│  └──────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│         Storage & Data Layer              │
│  ┌──────────────────────────────────┐   │
│  │  LibSQL (向量 + 全文)            │   │
│  │  - papers table                  │   │
│  │  - embeddings (HNSW index)       │   │
│  │  - fts5 (BM25)                   │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  External APIs                     │   │
│  │  - OpenAlex                      │   │
│  │  - Semantic Scholar              │   │
│  │  - PubMed                        │   │
│  └──────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

### 3.2 简化的项目结构

```
academic-assistant/
├── packages/
│   ├── core/                   # 核心类型和接口
│   │   ├── types.ts
│   │   ├── interfaces.ts
│   │   └── agent-definitions.ts  # 🆕 集中管理所有 AgentDefinitions
│   │
│   ├── services/               # 服务层（编排逻辑）
│   │   ├── orchestrator.service.ts     # 🆕 任务编排
│   │   ├── search.service.ts
│   │   ├── citation.service.ts
│   │   └── rag.service.ts
│   │
│   ├── skills/                 # 🎯 Skills 实现（符合 Claude Code 规范）
│   │   └── src/
│   │       ├── literature-search/
│   │       │   ├── SKILL.md           # 🆕 Claude Code Skill 定义
│   │       │   ├── index.ts           # 导出 AgentDefinition
│   │       │   └── impl.ts            # 实现逻辑
│   │       ├── citation-manager/
│   │       │   ├── SKILL.md
│   │       │   ├── index.ts
│   │       │   └── impl.ts
│   │       └── ... (6 more skills)
│   │
│   ├── storage/                # 数据存储层
│   │   ├── libsql/
│   │   │   ├── vector-store.ts
│   │   │   ├── database.ts
│   │   │   └── schema.sql
│   │   ├── mcp/                    # 🆕 MCP 客户端
│   │   │   ├── mcp-manager.ts       # 统一管理多个 MCP 服务器
│   │   │   └── servers/
│   │   │       ├── academic-search.client.ts
│   │   │       ├── arxiv.client.ts
│   │   │       └── research-papers.client.ts
│   │   └── api-clients.ts
│   │
│   └── utils/                  # 工具函数
│       ├── logger.ts             # 🆕 结构化日志
│       ├── metrics.ts            # 🆕 可观测性指标
│       ├── error-handler.ts      # 🆕 错误处理
│       └── config.ts
│
├── config/
│   ├── agents.yaml                # Agent 配置
│   ├── skills.yaml                # Skill 配置
│   ├── mcp-servers.yaml           # MCP 服务器配置
│   └── default.yaml
│
├── scripts/                    # 🆕 工具脚本
│   ├── ingest-papers.mjs        # 数据摄取
│   ├── test-skills.mjs          # Skills 测试
│   └── benchmark.mjs             # 性能基准
│
├── academic-assistant.mjs     # 主入口
└── package.json
```

### 3.3 核心 AgentDefinitions（集中管理）

```typescript
// packages/core/agent-definitions.ts

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

/**
 * 所有学术相关的 AgentDefinitions
 * 集中管理，便于维护和版本控制
 */
export const ACADEMIC_AGENTS: Record<string, AgentDefinition> = {
  // 文献搜索专家
  'literature-searcher': {
    description: 'Expert in academic literature search across multiple databases',
    prompt: `You are an expert academic literature researcher.

## Your Capabilities
1. Search ArXiv, Google Scholar, PubMed, Semantic Scholar
2. Extract paper metadata (title, authors, year, venue, citations, DOI)
3. Assess relevance and quality
4. Return structured JSON results

## Output Format
Return papers as JSON array:
[
  {
    "title": "Paper Title",
    "authors": ["Author1", "Author2"],
    "year": 2023,
    "venue": "Conference/Journal",
    "citationCount": 150,
    "doi": "10.xxxx/xxxxx",
    "url": "https://...",
    "relevanceScore": 9.5
  }
]`,
    tools: ['WebSearch', 'WebFetch', 'MCPTool'],
    model: 'claude-3-5-sonnet'
  },

  // 引用管理专家
  'citation-manager': {
    description: 'Expert in academic citation formatting (APA, MLA, Chicago, IEEE, Harvard)',
    prompt: `You are an expert in academic citation management.

## Supported Styles
- APA 7th Edition
- MLA 9th Edition
- Chicago 17th Edition
- IEEE
- Harvard

## Output Format
Return JSON:
{
  "referenceList": ["Smith, J. (2023). Title..."],
  "inTextCitations": {"Smith2023": "(Smith, 2023)"},
  "style": "apa"
}`,
    tools: ['WebSearch', 'MCPTool'],
    model: 'claude-3-5-sonnet'
  },

  // 学术写作专家
  'academic-writer': {
    description: 'Expert in academic writing, editing, and coaching',
    prompt: `You are an expert academic writing coach.

## Your Expertise
1. Academic style & tone
2. IMRaD structure
3. Grammar & mechanics
4. Clarity & readability

## Writing Improvements
- Content generation (abstracts, introductions)
- Text improvement (clarity, conciseness)
- Structure analysis
- Quality assessment`,
    tools: ['Read', 'Edit', 'WebSearch'],
    model: 'claude-3-5-sonnet'
  },

  // 同行评审专家
  'peer-reviewer': {
    description: 'Expert academic peer reviewer for scientific papers',
    prompt: `You are an experienced peer reviewer for top-tier journals.

## Review Framework
Evaluate on:
1. Novelty (1-5)
2. Significance (1-5)
3. Methodology (1-5)
4. Results (1-5)
5. Clarity (1-5)

## Decision Types
- Accept
- Minor Revisions
- Major Revisions
- Reject & Resubmit
- Reject`,
    tools: ['Read', 'Grep', 'WebSearch'],
    model: 'claude-3-5-sonnet'
  },

  // 数据分析专家
  'data-analyst': {
    description: 'Expert in statistical analysis and data visualization for research',
    prompt: `You are an expert in research data analysis.

## Your Expertise
1. Statistical method recommendations
2. Data visualization approaches
3. Result interpretation
4. Reproducibility guidance`,
    tools: ['Read', 'Edit', 'Bash', 'WebSearch'],
    model: 'claude-3-5-sonnet'
  },

  // 期刊投稿专家
  'journal-advisor': {
    description: 'Expert in journal selection and academic publishing',
    prompt: `You are an expert in academic publishing and journal selection.

## Your Expertise
1. Journal recommendations based on scope and impact
2. Cover letter generation
3. Submission checklists
4. Publishing strategies`,
    tools: ['WebSearch', 'WebFetch'],
    model: 'claude-3-5-sonnet'
  },

  // 文献综述专家
  'literature-reviewer': {
    description: 'Expert in conducting comprehensive literature reviews',
    prompt: `You are an expert in conducting literature reviews.

## Your Process
1. Identify relevant papers
2. Analyze research themes
3. Identify research gaps
4. Synthesize findings
5. Generate comprehensive review`,
    tools: ['WebSearch', 'WebFetch', 'Read'],
    model: 'claude-3-5-sonnet'
  },

  // RAG 专家
  'rag-specialist': {
    description: 'Expert in retrieval-augmented generation for academic queries',
    prompt: `You are an expert in RAG (Retrieval-Augmented Generation).

## Your Process
1. Understand the query
2. Retrieve relevant papers
3. Synthesize information
4. Generate accurate answers with citations
5. Avoid hallucination`,
    tools: ['WebSearch', 'WebFetch', 'VectorSearch', 'SQLQuery'],
    model: 'claude-3-5-sonnet'
  }
};
```

---

## 第四部分：LibSQL 向量检索实现（完整版）

### 4.1 数据库 Schema（优化版）

```sql
-- config/schema.sql

-- 论文表（带向量支持）
CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,  -- JSON array
  abstract TEXT,
  year INTEGER,
  venue TEXT,
  doi TEXT UNIQUE,
  url TEXT,
  pdf_url TEXT,
  citation_count INTEGER DEFAULT 0,

  -- 向量嵌入（BLOB 存储 float32 array）
  embedding BLOB,  -- 1536 维 (OpenAI text-embedding-3-large)

  -- 元数据
  source TEXT,  -- 数据来源：openalex, arxiv, semantic-scholar, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 全文搜索索引（BM25）
CREATE VIRTUAL TABLE IF NOT EXISTS papers_fts USING fts5(
  title,
  abstract,
  content='papers'
);

-- 触发器：自动同步到 FTS 表
CREATE TRIGGER IF NOT EXISTS papers_fts_insert AFTER INSERT ON papers BEGIN
  INSERT INTO papers_fts(rowid, title, abstract)
  VALUES (new.rowid, new.title, new.abstract);
END;

CREATE TRIGGER IF NOT EXISTS papers_fts_update AFTER UPDATE ON papers BEGIN
  UPDATE papers_fts
  SET title = new.title, abstract = new.abstract
  WHERE rowid = new.rowid;
END;

-- HNSW 向量索引（近似最近邻搜索）
CREATE INDEX IF NOT EXISTS papers_embedding_idx
ON papers (embedding)
USING hnsw (embedding vector_cosine_ops)
WITH (M = 16, ef_construction = 64);

-- 辅助索引
CREATE INDEX IF NOT EXISTS papers_year_idx ON papers(year);
CREATE INDEX IF NOT EXISTS papers_venue_idx ON papers(venue);
CREATE INDEX IF NOT EXISTS papers_source_idx ON papers(source);
```

### 4.2 LibSQL Vector Store 实现

```typescript
// packages/storage/libsql/vector-store.ts

import { LibSQL } from '@libsql/client';
import type { Paper } from '@assistant/core';

export interface VectorSearchOptions {
  limit?: number;
  yearFrom?: number;
  yearTo?: number;
  venue?: string[];
  minCitationCount?: number;
}

export interface HybridSearchOptions {
  alpha?: number;  // 向量搜索权重 [0-1]
  limit?: number;
}

export class LibSQLVectorStore {
  private db: LibSQL;

  constructor(dbPath: string) {
    this.db = new LibSQL(dbPath);
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    // 创建 schema
    const schema = await import('../../config/schema.sql');
    await this.db.execute(schema.default);
  }

  /**
   * 插入论文（带向量）
   */
  async insert(paper: Paper, embedding: Float32Array): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO papers
      (id, title, authors, abstract, year, venue, doi, url, pdf_url, citation_count, embedding, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      paper.pdfUrl || null,
      paper.citationCount || 0,
      Buffer.from(embedding.buffer),
      paper.source || 'manual'
    ).run();
  }

  /**
   * 批量插入（优化性能）
   */
  async insertBatch(papers: Paper[], embeddings: Float32Array[]): Promise<void> {
    const transaction = this.db.transaction();

    for (let i = 0; i < papers.length; i++) {
      await this.insert(papers[i], embeddings[i]);
    }

    await transaction.commit();
  }

  /**
   * 向量相似性搜索
   */
  async similaritySearch(
    queryEmbedding: Float32Array,
    options: VectorSearchOptions = {}
  ): Promise<Array<{ paper: Paper; score: number }>> {
    const {
      limit = 10,
      yearFrom,
      yearTo,
      venue,
      minCitationCount
    } = options;

    let sql = `
      SELECT
        id, title, authors, abstract, year, venue, doi, url, pdf_url, citation_count,
        vector_distance_cosine(embedding, ?) AS distance
      FROM papers
      WHERE 1=1
    `;
    const params: any[] = [Buffer.from(queryEmbedding.buffer)];

    // 动态构建过滤条件
    if (yearFrom) {
      sql += ' AND year >= ?';
      params.push(yearFrom);
    }
    if (yearTo) {
      sql += ' AND year <= ?';
      params.push(yearTo);
    }
    if (venue && venue.length > 0) {
      sql += ` AND venue IN (${venue.map(() => '?').join(',')})`;
      params.push(...venue);
    }
    if (minCitationCount) {
      sql += ' AND citation_count >= ?';
      params.push(minCitationCount);
    }

    sql += ' ORDER BY distance LIMIT ?';
    params.push(limit);

    const results = await this.db.execute(sql, params);

    return results.rows.map((row: any) => ({
      paper: {
        id: row.id,
        title: row.title,
        authors: JSON.parse(row.authors),
        abstract: row.abstract,
        year: row.year,
        venue: row.venue,
        doi: row.doi,
        url: row.url,
        pdfUrl: row.pdf_url,
        citationCount: row.citation_count
      },
      score: 1 - row.distance  // 距离 → 相似度
    }));
  }

  /**
   * 混合搜索（向量 + BM25 全文）
   */
  async hybridSearch(
    queryText: string,
    queryEmbedding: Float32Array,
    options: HybridSearchOptions = {}
  ): Promise<Array<{ paper: Paper; score: number }>> {
    const { alpha = 0.6, limit = 10 } = options;

    // 向量搜索
    const vectorResults = await this.similaritySearch(queryEmbedding, {
      limit: 100
    });

    // 全文搜索
    const ftsQuery = `
      SELECT id, bm25(papers_fts) AS score
      FROM papers_fts
      WHERE papers_fts MATCH ?
      ORDER BY score
      LIMIT 100
    `;
    const ftsResults = await this.db.execute(ftsQuery, [queryText]);

    // 合并结果（Reciprocal Rank Fusion）
    const scores = new Map<string, { vectorScore: number; ftsScore: number }>();

    vectorResults.forEach((item, i) => {
      scores.set(item.paper.id, { vectorScore: 1 / (i + 1), ftsScore: 0 });
    });

    ftsResults.rows.forEach((row: any, i) => {
      const existing = scores.get(row.id);
      if (existing) {
        existing.ftsScore = 1 / (i + 1);
      } else {
        scores.set(row.id, { vectorScore: 0, ftsScore: 1 / (i + 1) });
      }
    });

    // 计算最终分数
    const results = Array.from(scores.entries())
      .map(([id, { vectorScore, ftsScore }]) => ({
        id,
        score: alpha * vectorScore + (1 - alpha) * ftsScore
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ id, score }) => ({
        paper: vectorResults.find(r => r.paper.id === id)!.paper,
        score
      }));

    return results;
  }

  /**
   * 关键词搜索
   */
  async keywordSearch(query: string, limit: number = 10): Promise<Paper[]> {
    const sql = `
      SELECT * FROM papers
      WHERE title LIKE ? OR abstract LIKE ?
      ORDER BY citation_count DESC
      LIMIT ?
    `;

    const results = await this.db.execute(sql, [`%${query}%`, `%${query}%`, limit]);
    return results.rows;
  }
}
```

---

## 第五部分：MCP 集成（完整版）

### 5.1 MCP Manager 统一管理

```typescript
// packages/storage/mcp/mcp-manager.ts

import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
}

export class MCPManager {
  private clients: Map<string, Client> = new Map();

  /**
   * 连接到所有配置的 MCP 服务器
   */
  async connectAll(servers: MCPServerConfig[]): Promise<void> {
    for (const server of servers) {
      try {
        await this.connect(server);
        console.log(`✓ Connected to MCP server: ${server.name}`);
      } catch (error) {
        console.warn(`⚠️  Failed to connect to ${server.name}:`, error);
      }
    }
  }

  /**
   * 连接到单个 MCP 服务器
   */
  async connect(config: MCPServerConfig): Promise<void> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args
    });

    const client = new Client(
      { name: `academic-assistant-${config.name}`, version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
    this.clients.set(config.name, client);
  }

  /**
   * 调用 MCP 工具
   */
  async callTool(serverName: string, toolName: string, args: any = {}): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }

    const response = await client.callTool({
      name: toolName,
      arguments: args
    });

    if (response.content && response.content.length > 0) {
      const result = response.content[0];
      if ('text' in result) {
        try {
          return JSON.parse(result.text);
        } catch {
          return result.text;
        }
      }
    }

    return response;
  }

  /**
   * 列出服务器的可用工具
   */
  async listTools(serverName: string): Promise<any[]> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }

    const response = await client.listTools();
    return response.tools || [];
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
        console.log(`✓ Disconnected from ${name}`);
      } catch (error) {
        console.error(`✗ Failed to disconnect from ${name}:`, error);
      }
    }
    this.clients.clear();
  }
}
```

### 5.2 配置化的 MCP 服务器

```yaml
# config/mcp-servers.yaml
servers:
  # Academic Paper Search MCP Server
  - name: academic-search
    command: npx
    args: ['-y', '@afrise/academic-search-mcp-server']

  # ArXiv MCP Server
  - name: arxiv
    command: npx
    args: ['-y', 'arxiv-mcp-server']

  # Research Papers MCP Server
  - name: research-papers
    command: npx
    args: ['-y', 'research-papers-mcp-server']
```

---

## 第六部分：可观测性和监控（生产级）

### 6.1 结构化日志

```typescript
// packages/utils/logger.ts

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

### 6.2 指标收集

```typescript
// packages/utils/metrics.ts

export class MetricsCollector {
  private metrics: Map<string, number> = new Map();

  /**
   * 记录 Agent 调用
   */
  recordAgentCall(agentName: string, duration: number, tokensUsed: number): void {
    const key = `agent.${agentName}.calls`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);

    this.metrics.set(`agent.${agentName}.duration`, duration);
    this.metrics.set(`agent.${agentName}.tokens`, tokensUsed);
  }

  /**
   * 记录搜索指标
   */
  recordSearch(type: 'keyword' | 'semantic' | 'hybrid', resultCount: number, duration: number): void {
    const key = `search.${type}.calls`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
    this.metrics.set(`search.${type}.results`, resultCount);
    this.metrics.set(`search.${type}.duration`, duration);
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
}
```

### 6.3 使用示例（带可观测性）

```typescript
// packages/services/search.service.ts

import { Logger } from '../utils/logger.js';
import { MetricsCollector } from '../utils/metrics.js';
import { query } from '@anthropic-ai/claude-agent-sdk';

export class SearchService {
  private logger = new Logger('SearchService');
  private metrics = new MetricsCollector();

  async searchSemantic(query: string): Promise<Paper[]> {
    const startTime = Date.now();
    this.logger.info('Starting semantic search', { query });

    try {
      // 1. 生成嵌入
      const embedding = await this.embeddingService.embed(query);
      this.logger.debug('Embedding generated', { dimension: embedding.vector.length });

      // 2. 向量搜索
      const results = await this.vectorStore.similaritySearch(embedding.vector);

      // 3. 记录指标
      const duration = Date.now() - startTime;
      this.metrics.recordSearch('semantic', results.length, duration);
      this.logger.info('Search completed', { resultCount: results.length, duration });

      return results.map(r => r.paper);

    } catch (error) {
      this.logger.error('Search failed', error);
      throw error;
    }
  }
}
```

---

## 第七部分：Orchestrator 实现（任务编排）

### 7.1 文献综述编排

```typescript
// packages/services/orchestrator.service.ts

import { query } from '@anthropic-ai/claude-agent-sdk';
import { ACADEMIC_AGENTS } from '@assistant/core/agent-definitions.js';
import type { Paper } from '@assistant/core';

export class OrchestratorService {
  /**
   * 执行完整的文献综述流程
   * Sequential 模式
   */
  async conductLiteratureReview(topic: string, maxPapers: number = 50): Promise<{
    papers: Paper[];
    analysis: string;
    synthesis: string;
    gaps: string[];
  }> {
    const startTime = Date.now();
    this.logger.info('Starting literature review', { topic, maxPapers });

    // Step 1: 搜索论文
    const searchResults = await this.executeAgent('literature-searcher', {
      prompt: `Search for academic papers about: "${topic}"`,
      options: {
        agents: {
          'literature-searcher': ACADEMIC_AGENTS['literature-searcher']
        },
        allowedTools: ['WebSearch', 'WebFetch', 'MCPTool']
      }
    });

    const papers = this.extractPapersFromResponse(searchResults);
    this.logger.info(`Found ${papers.length} papers`, { topic });

    // Step 2: 分析论文（并行处理）
    const analysisPromises = papers.slice(0, Math.min(papers.length, 20)).map(paper =>
      this.analyzePaper(paper)
    );
    const analyses = await Promise.all(analysisPromises);

    // Step 3: 识别研究空白
    const gaps = await this.identifyGaps(topic, papers, analyses);

    // Step 4: 综合分析
    const synthesis = await this.synthesizeFindings(topic, papers, analyses, gaps);

    return {
      papers,
      analysis: analyses.join('\n\n'),
      synthesis,
      gaps
    };
  }

  /**
   * 执行单个 Agent
   */
  private async executeAgent(
    agentName: string,
    config: any
  ): Promise<any> {
    const agentQuery = query(config);
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

  /**
   * 分析单篇论文
   */
  private async analyzePaper(paper: Paper): Promise<string> {
    return this.executeAgent('peer-reviewer', {
      prompt: `Review this paper:\n\nTitle: ${paper.title}\n\nAbstract: ${paper.abstract}`,
      options: {
        agents: { 'peer-reviewer': ACADEMIC_AGENTS['peer-reviewer'] },
        allowedTools: ['Read', 'Grep']
      }
    });
  }

  /**
   * 识别研究空白
   */
  private async identifyGaps(topic: string, papers: Paper[], analyses: string[]): Promise<string[]> {
    const result = await this.executeAgent('literature-reviewer', {
      prompt: `
Topic: ${topic}

Analyzed Papers: ${papers.length}
Analyses: ${analyses.join('\n\n')}

Identify research gaps and future directions.
      `,
      options: {
        agents: { 'literature-reviewer': ACADEMIC_AGENTS['literature-reviewer'] },
        allowedTools: ['WebSearch']
      }
    });

    return this.parseGaps(result);
  }

  /**
   * 综合发现
   */
  private async synthesizeFindings(
    topic: string,
    papers: Paper[],
    analyses: string[],
    gaps: string[]
  ): Promise<string> {
    const result = await this.executeAgent('academic-writer', {
      prompt: `
Topic: ${topic}

Papers: ${papers.map(p => p.title).join('; ')}
Analyses: ${analyses.join('\n\n')}
Gaps: ${gaps.join('\n')}

Synthesize into a comprehensive literature review.
      `,
      options: {
        agents: { 'academic-writer': ACADEMIC_AGENTS['academic-writer'] },
        allowedTools: ['Read', 'Edit']
      }
    });

    return result;
  }
}
```

---

## 第八部分：完整实施计划

### 8.1 阶段 1: 核心重构（Week 1-2）

**目标**: 简化代码，建立可观测性基础

**任务**:
1. 合并重复代码
2. 创建 agent-definitions.ts
3. 实现日志和指标收集
4. 创建统一的错误处理

**交付物**:
- `packages/core/agent-definitions.ts`
- `packages/utils/logger.ts`
- `packages/utils/metrics.ts`
- `packages/utils/error-handler.ts`

### 8.2 阶段 2: LibSQL 集成（Week 3-4）

**目标**: 添加向量检索能力

**任务**:
1. 安装依赖：`bun add @libsql/client pino`
2. 创建数据库 schema
3. 实现 LibSQLVectorStore
4. 创建初始化脚本

**交付物**:
- `packages/storage/libsql/vector-store.ts`
- `config/schema.sql`
- `scripts/init-db.mjs`

### 8.3 阶段 3: MCP 集成（Week 5-6）

**目标**: 集成学术 MCP 服务器

**任务**:
1. 实现 MCPManager
2. 配置 3 个学术 MCP 服务器
3. 创建 MCP Tool Wrappers
4. 集成到 AgentDefinitions

**交付物**:
- `packages/storage/mcp/mcp-manager.ts`
- `packages/storage/mcp/servers/*.ts`
- `config/mcp-servers.yaml`

### 8.4 阶段 4: Orchestrator 实现（Week 7）

**目标**: 实现任务编排能力

**任务**:
1. 实现 OrchestratorService
2. 实现文献综述编排流程
3. 实现并行任务执行

**交付物**:
- `packages/services/orchestrator.service.ts`
- `packages/services/review-orchestrator.ts`

### 8.5 阶段 5: 测试和优化（Week 8）

**目标**: 完善测试和监控

**任务**:
1. 单元测试（目标 70% 覆盖率）
2. 集成测试
3. 性能基准测试
4. 文档完善

**交付物**:
- `tests/**/*.test.ts`
- `scripts/benchmark.mjs`
- `README.md`
- `MONITORING.md`

---

## 第九部分：生产部署检查清单

### 9.1 功能完整性

- [ ] 8 个 Skills 全部实现
- [ ] LibSQL 向量检索正常工作
- [ ] 3 个 MCP 服务器连接成功
- [ ] RAG 查询准确率 > 80%
- [ ] 日志和指标完整收集

### 9.2 性能指标

- [ ] 平均响应时间 < 2s
- [ ] 95th 响应时间 < 5s
- [ ] 向量搜索延迟 < 500ms
- [ ] 内存使用 < 500MB
- [ ] 并发处理支持

### 9.3 可靠性

- [ ] 错误处理完善
- [ ] 重试机制实现
- [ ] 降级策略配置
- [ ] 日志完整记录
- [ ] 监控告警配置

### 9.4 可维护性

- [ ] 代码重复率 < 5%
- [ ] 平均文件行数 < 300
- [ ] 文档完整
- [ ] 配置外部化
- [ ] 版本控制规范

---

## 第十部分：参考资源（完整版）

### 10.1 AI Agent 架构设计

1. **[Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents)** (Anthropic, Dec 2024)
2. **[AI Agentic Design Principles](https://microsoft.github.io/ai-agents-for-beginners/03-agentic-design-patterns/)** (Microsoft)
3. **[The Definitive Guide to Designing Effective Agentic AI Systems](https://medium.com/@manavg/the-definitive-guide-to-designing-effective-agentic-ai-systems-4c7c559c3ab3)** (Medium, 2025)
4. **[Building an AI Agent Architecture: Key Design Principles](https://aira.fr/building-an-ai-agent-architecture-key-design-principles)** (Jul 2025)
5. **[Agentic AI Frameworks: Architectures, Protocols, and Analysis](https://arxiv.org/html/2508.10146v1)** (arXiv, Aug 2025)

### 10.2 多 Agent 编排

6. **[AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)** (Azure, Jul 2025)
7. **[Developer's guide to multi-agent patterns](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)** (Google, Dec 2025)
8. **[Building Multi-Agent Architectures](https://medium.com/@akankshasinha247/building-multi-agent-architectures-orchestrating-intelligent-agent-systems-46700e50250b)** (Medium, 2025)
9. **[Choosing the right orchestration pattern](https://www.kore.ai/blog/choosing-the-right-orchestration-pattern-for-multi-agent-systems)** (Oct 2025)

### 10.3 文献综述自动化

10. **[AI Agents vs. Agentic AI: A Conceptual Framework](https://arxiv.org/abs/2505.10468)** (arXiv, 2025)
11. **[Automated literature research and review-generation method](https://academic.oup.com/nsr/advance-article/doi/10.1093/nsr/nwaf169/8120226)** (National Science Review, 2025)
12. **[AI Tools for Automating Systematic Literature Reviews](https://dl.acm.org/doi/full/10.1145/3747912.3747962)** (ACM, 2025)
13. **[Systematic Comparison of Agentic AI Frameworks](https://www.ijsrtjournal.com/assetsbackoffice/uploads/article/Systematic+Comparison+of+Agentic+AI+Frameworks+for+Scholarly+Literature+Processing.pdf)** (Sep 2025)

### 10.4 MCP 和 Claude SDK

14. **[The Observability Agent](https://platform.claude.com/cookbook/claude-agent-sdk-02-the-observability-agent)** (Claude Cookbook, Sep 2025)
15. **[Anthropic Claude SDK with MCP: Enterprise Deployment Guide](https://www.mintmcp.com/blog/enterprise-development-guide-ai-agents)** (MintMCP, Oct 2025)
16. **[Claude Agent SDK Tutorial](https://www.datacamp.com/tutorial/how-to-use-claude-agent-sdk)** (DataCamp, Sep 2025)
17. **[Monitoring - Claude Code Docs](https://code.claude.com/docs/en/monitoring-usage)** (OpenTelemetry support)
18. **[Observability for Anthropic with Langfuse](https://langfuse.com/integrations/model-providers/anthropic)** (Langfuse, Oct 2025)

### 10.5 Skills 最佳实践

19. **[Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)** (Claude Docs)
20. **[Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)** (Anthropic, Apr 2025)
21. **[Deploying Claude Skills: 7 Essential Best Practices](https://www.linkedin.com/posts/george-sadathian-280914102_claudeskills-productionai-enterpriseai-activity-7385336124023554048-jfAq)** (LinkedIn)
22. **[Claude Skills: How to Build Reusable AI Expertise](https://medium.com/@juanc.olamendy/claude-skills-how-to-build-reusable-ai-expertise-that-actually-works-11c71dfe8fd3)** (Medium, 2025)

### 10.6 学术 MCP 服务器

23. **[MCP Servers Repository](https://github.com/modelcontextprotocol/servers)** (Official)
24. **[Academic Paper Search MCP Server](https://mcpservers.org/servers/afrise/academic-search-mcp-server)**
25. **[ArXiv MCP Server](https://github.com/blazickjp/arxiv-mcp-server)** (GitHub)
26. **[Research Papers MCP Server](https://mcpmarket.com/server/research-4)** (MCP Market)
27. **[Experiences with MCP Servers](https://arxiv.org/abs/2508.18489)** (arXiv, 2025)

### 10.7 向量检索和 RAG

28. **[Turso Vector Search](https://turso.tech/blog/turso-brings-native-vector-search-to-sqlite)** (Jun 2024)
29. **[A Comprehensive Survey on Vector Database](https://arxiv.org/html/2310.11703v2)** (Jun 2025)
30. **[Claude Cookbook - RAG](https://platform.claude.com/cookbook/)** (Official)
31. **[Mastering RAG in Agent SDK](https://medium.com/@innolyze/mastering-rag-in-agent-sdk-supercharge-your-ai-agents-with-retrieval-augmented-generation-fab776c491d5)** (Medium)

### 10.8 学术数据源

32. **[OpenAlex API](https://api.openalex.org)** (2.5 亿+ 论文)
33. **[Semantic Scholar API](https://api.semanticscholar.org)** (2 亿+ 论文)
34. **[arXiv OAI-PMH](https://export.arxiv.org/oai2)** (200 万+ 预印本)

---

## 结论

**完整版计划的优势**:

1. ✅ **基于最新研究**: 整合 2025 年最新的 AI Agent 架构研究
2. ✅ **生产就绪**: 完整的可观测性、监控、错误处理
3. ✅ **Claude Agent SDK 充分使用**: 包括未使用的可观测性特性
4. ✅ **Skills 充分复用**: 符合 Claude Code Skills 规范
5. **✅ MCP 生态集成**: 3 个学术 MCP 服务器
6. ✅ **LibSQL 向量检索**: 高性能、零配置
7. ✅ **任务编排**: Orchestrator 模式实现复杂工作流
8. ✅ **简化架构**: 保持简单实用的设计理念

**核心创新**:
- 🎯 集中管理所有 AgentDefinitions
- 🎯 统一的 MCP Manager
- 🎯 完整的可观测性（日志、指标、追踪）
- 🎯 文献综述自动化编排
- 🎯 生产级错误处理和重试

**预期成果**:
- 📊 更高质量的文献综述
- 🚀 更快的开发迭代速度
- 🔧 更易维护的代码结构
- 📈 更好的用户体验
- 🛡️ 生产级别的可靠性

---

*文档版本: 2.2.0-Final*
*最后更新: 2025-01-10*
*设计理念: KISS + 实用主义 + 生产就绪*
*基于: Plan 1 + 28篇最新研究论文和文档*
