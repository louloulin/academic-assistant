# 🎓 Academic Assistant - AI-Powered Paper Writing Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black)](https://bun.sh/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange)](https://www.rust-lang.org/)

> 基于Claude Code、Claude Agent SDK和MCP协议的智能学术论文写作助手

## 📋 目录

- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [开发指南](#开发指南)
- [项目结构](#项目结构)
- [核心功能](#核心功能)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 🎯 项目简介

Academic Assistant是一个开源的AI驱动学术研究助手，帮助研究人员和学生更高效地进行学术研究和论文写作。本项目采用混合架构（Bun + TypeScript + Rust），充分利用Claude Agent SDK的AI能力和MCP协议的扩展性。

### 为什么选择我们？

- ✅ **100% 开源**：完全开源，可自由定制和扩展
- ✅ **学术诚信**：辅助而非替代，保持研究原创性
- ✅ **端到端解决方案**：从文献搜索到投稿的完整流程
- ✅ **多Agent协作**：类似人类研究团队的工作方式
- ✅ **高性能**：Rust处理密集任务，TypeScript保证开发效率
- ✅ **中英双语**：原生支持中文和英文

## 🚀 核心特性

### 8大核心Skills

| Skill | 功能描述 | 状态 |
|-------|---------|------|
| 🔍 **Literature Search** | 多源文献搜索（ArXiv、Semantic Scholar、PubMed） | 🟡 开发中 |
| 📚 **Literature Review** | AI驱动的文献综述自动化 | 🟡 开发中 |
| 📝 **Paper Structure** | IMRaD结构模板与写作指导 | 🟡 开发中 |
| 📖 **Citation Manager** | 多格式引用管理（APA、MLA、Chicago等） | 🟡 开发中 |
| ✍️ **Writing Quality** | 学术写作质量检查与改进建议 | ⚪ 计划中 |
| 👥 **Peer Review** | 模拟同行评审与反馈 | ⚪ 计划中 |
| 📊 **Data Analysis** | 研究数据分析与可视化 | ⚪ 计划中 |
| 🎯 **Journal Submission** | 期刊推荐与投稿协助 | ⚪ 计划中 |

### 智能Agent系统

- **Workflow Manager Agent**: 协调整个研究和写作流程
- **Researcher Agent**: 文献搜索和数据收集
- **Writer Agent**: 论文起草和编辑
- **Reviewer Agent**: 质量检查和同行评审
- **Analyzer Agent**: 数据分析和可视化

## 🏗️ 技术架构

### 混合架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│                   TypeScript + Tailwind                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              API Gateway (Bun + Hono)                   │
│           Claude Agent SDK Integration                  │
└─────┬───────────────┬───────────────┬───────────────────┘
      │               │               │
┌─────┴─────┐   ┌─────┴─────┐   ┌───┴───────────────────┐
│  Skills   │   │  Agents   │   │  MCP Client Layer      │
│  (TS)     │   │  (TS)     │   │  (TS + Rust Bridge)    │
└───────────┘   └───────────┘   └───┬───────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │         MCP Server Layer              │
                    │         (Rust + Tokio)                │
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

### 技术栈

#### 前端层
- **运行时**: Bun 1.0+
- **框架**: React 18 + Next.js 14
- **样式**: TailwindCSS
- **状态管理**: Zustand + React Query

#### 后端层
- **运行时**: Bun 1.0+
- **框架**: Hono
- **AI SDK**: Claude Agent SDK
- **协议**: MCP (Model Context Protocol)

#### MCP服务器层
- **语言**: Rust 1.70+
- **运行时**: Tokio
- **SDK**: Official Rust MCP SDK
- **性能**: 零拷贝、异步I/O

#### 开发工具
- **Monorepo**: Turborepo + pnpm
- **语言**: TypeScript 5.3+
- **测试**: Vitest + Jest
- **文档**: TypeDoc

## 🎓 快速开始

### 环境要求

- **Bun** >= 1.0.0
- **Rust** >= 1.70.0
- **pnpm** >= 8.0.0
- **Docker** (可选)

### 一键安装

```bash
# 克隆仓库
git clone https://github.com/your-org/academic-assistant.git
cd academic-assistant

# 安装依赖
pnpm install

# 初始化开发环境
pnpm run setup

# 启动开发服务器
pnpm run dev
```

### 手动安装

<details>
<summary>点击展开详细步骤</summary>

#### 1. 安装必需工具

```bash
# 安装Bun
curl -fsSL https://bun.sh/install | bash

# 安装Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装pnpm
npm install -g pnpm

# 安装Turbo
npm install -g turbo
```

#### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，添加必要的API密钥
# ANTHROPIC_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here
```

#### 3. 构建Rust MCP服务器

```bash
cd packages/mcp-servers
cargo build --release
```

#### 4. 启动服务

```bash
# 终端1：启动MCP服务器
./bin/literature-search-server

# 终端2：启动API
cd apps/api
bun run dev

# 终端3：启动前端
cd apps/web
bun run dev
```

</details>

### Docker部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 👨‍💻 开发指南

### 项目结构

```
academic-assistant/
├── apps/
│   ├── web/                      # 前端应用（React + Next.js）
│   └── api/                      # API服务（Bun + Hono）
│
├── packages/
│   ├── core/                     # 核心类型和接口
│   ├── skills/                   # 8个核心Skills实现
│   ├── agents/                   # Agent系统实现
│   ├── mcp-client/               # MCP客户端
│   ├── mcp-servers/              # Rust MCP服务器
│   └── utils/                    # 工具函数
│
├── tools/
│   └── rust-ffi-bridge/          # Rust FFI桥接
│
├── docs/                         # 项目文档
├── scripts/                      # 构建和部署脚本
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### 开发工作流

```bash
# 开发模式（热重载）
pnpm run dev

# 构建所有包
pnpm run build

# 运行测试
pnpm run test

# 代码检查
pnpm run lint

# 代码格式化
pnpm run format
```

### 创建新的Skill

```bash
# 使用生成器创建新Skill
pnpm run generate:skill

# 或手动创建
mkdir -p packages/skills/src/my-skill
cd packages/skills/src/my-skill

# 创建以下文件：
# - skill.ts         # Skill实现
# - types.ts         # 类型定义
# - index.ts         # 导出
# - SKILL.md         # Skill文档
```

```typescript
// skill.ts示例
import { ISkill } from '@assistant/core';

export class MySkill implements ISkill {
  readonly id = 'my-skill';
  readonly name = 'My Skill';
  readonly description = 'Description of my skill';

  async execute(task: Task): Promise<Task> {
    // 实现你的逻辑
    return task;
  }
}
```

### 创建新的MCP服务器

```bash
# 在Rust workspace中添加新服务器
cd packages/mcp-servers
cargo new my-server --bin

# 添加到Cargo.toml
# [workspace.dependencies]
# my-server = { path = "my-server" }
```

```rust
// my-server/src/main.rs
use rmcp::Server;

#[tokio::main]
async fn main() -> Result<()> {
    let server = Server::new("my-server")
        .tool("my_tool", "Description", my_tool)?;

    server.run().await?;

    Ok(())
}

async fn my_tool(params: serde_json::Value) -> Result<serde_json::Value> {
    // 实现你的逻辑
    Ok(json!({"result": "success"}))
}
```

## 📚 核心功能

### 1. 文献搜索

```typescript
// 搜索ArXiv上的机器学习论文
const results = await literatureSearchSkill.execute({
  query: 'machine learning',
  maxResults: 10,
  sources: ['arxiv', 'semantic-scholar'],
  yearFrom: 2020
});
```

### 2. 引用管理

```typescript
// 格式化为APA风格
const citation = await citationManagerSkill.execute({
  paper: {
    title: 'Attention Is All You Need',
    authors: [
      { first: 'Ashish', last: 'Vaswani' }
    ],
    year: 2017,
    venue: 'NeurIPS'
  },
  style: 'apa'
});

// 输出：
// {
//   inText: '(Vaswani et al., 2017)',
//   bibliography: 'Vaswani, A. (2017). Attention Is All You Need. NeurIPS.'
// }
```

### 3. 文献综述

```typescript
// 自动生成文献综述大纲
const review = await literatureReviewSkill.execute({
  topic: 'transformer architectures in NLP',
  papers: [/* paper objects */],
  structure: 'thematic'
});

// 返回：
// {
//   outline: [...],
//   keyThemes: [...],
//   researchGaps: [...]
// }
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. 🐛 报告Bug
2. 💡 提出新功能
3. 📖 改进文档
4. 🔧 提交代码
5. 🌍 帮助翻译

### 开发流程

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范

- 遵循[TypeScript风格指南](https://typescript.github.io/tslint/)
- 使用[ESLint](https://eslint.org/)进行代码检查
- 遵循[Conventional Commits](https://www.conventionalcommits.org/)
- 为新功能添加测试
- 更新相关文档

### Pull Request检查清单

- [ ] 代码通过所有测试
- [ ] 新功能包含单元测试
- [ ] 文档已更新
- [ ] 遵循代码规范
- [ ] 提交信息清晰明了

## 📖 文档

详细文档请查看：

- 📄 [项目规划](./plan1.md) - 完整的项目规划文档
- 🏗️ [技术栈分析](./tech-stack-analysis.md) - 技术选型和架构设计
- 🛠️ [实施指南](./implementation-guide.md) - 详细的实现指南
- 🔧 [API文档](./docs/api.md) - API参考文档
- 🎓 [用户手册](./docs/user-guide.md) - 用户使用手册

## 🗺️ 路线图

### v0.1.0 - MVP（当前）
- [x] 项目初始化和架构设计
- [x] 核心类型和接口定义
- [x] 文献搜索Skill（基础版）
- [x] 引用管理Skill（基础版）
- [ ] Workflow Manager Agent
- [ ] 基础Web界面

### v0.2.0 - Beta（计划中）
- [ ] 完整实现8个Skills
- [ ] 多Agent协作系统
- [ ] Claude Agent SDK深度集成
- [ ] Artifact生成功能
- [ ] 用户认证和多用户支持

### v0.3.0 - Stable（计划中）
- [ ] 性能优化
- [ ] 完整测试覆盖
- [ ] 生产部署方案
- [ ] 完善文档
- [ ] 社区贡献者工具

### v1.0.0 - Production（未来）
- [ ] 企业级功能
- [ ] SLA保证
- [ ] 商业支持
- [ ] 云服务版本

## 🌟 致谢

本项目基于以下优秀的开源项目：

- [Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Turborepo](https://turbo.build/repo)
- [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/)

特别感谢：

- Anthropic团队提供的Claude Agent SDK
- MCP社区的贡献者
- 所有为本项目贡献的开发者

## 📄 许可证

本项目采用 [MIT许可证](LICENSE) 开源。

## 📮 联系方式

- 📧 Email: [your-email@example.com](mailto:your-email@example.com)
- 🐦 Twitter: [@academic_assist](https://twitter.com/academic_assist)
- 💬 Discord: [加入我们的社区](https://discord.gg/academic-assistant)
- 📝 Blog: [学术研究助手博客](https://blog.assistant.com)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-org/academic-assistant&type=Date)](https://star-history.com/#your-org/academic-assistant&Date)

如果这个项目对你有帮助，请给我们一个⭐️！

---

<div align="center">

**让AI成为你的学术研究伙伴** 🤖📚

Made with ❤️ by Academic Assistant Team

</div>
