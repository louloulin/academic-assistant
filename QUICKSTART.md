# 🎓 Academic Assistant - 快速开始指南

## 项目概述

基于Claude Code和Claude Agent SDK构建的AI学术论文助手，采用混合架构（Bun + TypeScript + Rust）。

## 技术栈

- **前端**: Bun + React + Next.js
- **后端**: Bun + Hono + Claude Agent SDK
- **MCP服务器**: Rust + Tokio
- **工具链**: Turborepo + pnpm

## 核心功能

### 8大Skills
1. 🔍 文献搜索（ArXiv、Semantic Scholar）
2. 📚 文献综述自动化
3. 📝 论文结构（IMRaD模板）
4. 📖 引用管理（APA、MLA、Chicago）
5. ✍️ 写作质量检查
6. 👥 同行评审模拟
7. 📊 数据分析
8. 🎯 期刊投稿

## 快速开始

### 1. 环境准备

```bash
# 安装工具
curl -fsSL https://bun.sh/install | bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
npm install -g pnpm turbo
```

### 2. 项目初始化

```bash
# 创建项目
mkdir academic-assistant && cd academic-assistant

# 初始化monorepo
pnpm init
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# 安装Turborepo
pnpm add -Dw turbo
```

### 3. Docker启动（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 4. 本地开发

```bash
# 复制环境变量
cp .env.example .env
# 编辑.env添加API keys

# 安装依赖
pnpm install

# 启动开发服务
pnpm run dev
```

## 项目结构

```
academic-assistant/
├── apps/
│   ├── web/          # 前端应用
│   └── api/          # API服务
├── packages/
│   ├── core/         # 核心类型
│   ├── skills/       # Skills实现
│   ├── agents/       # Agent系统
│   ├── mcp-client/   # MCP客户端
│   ├── mcp-servers/  # Rust服务器
│   └── utils/        # 工具函数
└── .github/
    └── workflows/    # CI/CD配置
```

## 核心概念

### 1. Skills系统

Skills是可重用的功能模块：

```typescript
export class LiteratureSearchSkill implements ISkill {
  readonly id = 'literature-search';
  readonly name = 'Literature Search';

  async execute(task: Task): Promise<Task> {
    // 搜索论文
    return results;
  }
}
```

### 2. Agent系统

Agent协调整个工作流：

```typescript
export class WorkflowManagerAgent extends BaseAgent {
  async execute(task: Task): Promise<Task> {
    // 1. 规划任务
    // 2. 分配子任务
    // 3. 执行并监控
    // 4. 综合结果
  }
}
```

### 3. MCP集成

通过MCP协议连接外部服务：

```typescript
const mcpClient = new MCPClient();
await mcpClient.connect('literature-search');

const result = await mcpClient.call({
  server: 'literature-search',
  method: 'search_arxiv',
  params: { query: 'machine learning' }
});
```

## 开发指南

### 创建新Skill

```bash
# 生成Skill模板
pnpm run generate:skill my-skill

# 或手动创建
mkdir -p packages/skills/src/my-skill
```

### 创建MCP服务器（Rust）

```bash
cd packages/mcp-servers
cargo new my-server --bin
```

### 运行测试

```bash
# TypeScript测试
pnpm test

# Rust测试
cd packages/mcp-servers
cargo test

# 覆盖率报告
pnpm test:coverage
```

## 部署

### Docker部署

```bash
# 构建镜像
docker-compose build

# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d
```

### 手动部署

```bash
# 构建
pnpm run build

# 启动API
cd apps/api && bun run start

# 启动Web
cd apps/web && bun run start
```

## 文档

- **README.md** - 项目总览
- **plan1.md** - 详细规划
- **tech-stack-analysis.md** - 技术分析
- **implementation-guide.md** - 实现指南
- **SUMMARY.md** - 项目总结

## 贡献

欢迎贡献！请查看贡献指南。

## 许可证

MIT License

---

**Made with ❤️ by Academic Assistant Team**
