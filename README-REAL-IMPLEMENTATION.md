# 🎓 基于 Claude Agent SDK 的真实实现 - 使用指南

## 📋 概述

本项目现在包含**两种实现方式**：

1. **真实实现** (推荐) - 基于 `@anthropic-ai/claude-agent-sdk` 官方包
2. **模拟实现** (旧版) - 基于自定义框架，仅用于学习

## 🚀 快速开始 - 真实实现

### 1. 安装依赖

```bash
# 在项目根目录
bun install
```

### 2. 设置 API Key

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

### 3. 使用真实实现的助手

```bash
# 方式 1: 使用统一入口（推荐）
bun run academic-assistant-real.mjs "search papers about deep learning"

# 方式 2: 直接使用真实 Skill 实现
bun run academic-assistant-real.mjs "format this citation in APA: ..."
bun run academic-assistant-real.mjs "write an abstract about AI in healthcare"
bun run academic-assistant-real.mjs "review this paper"
```

## 📁 文件结构

### 真实实现文件

```
packages/skills/src/
├── literature-search/
│   └── real-skill.ts          # 真实的文献搜索 Skill
├── citation-manager/
│   └── real-skill.ts          # 真实的引用管理 Skill
└── real-skills/
    └── index.ts               # 真实 Skills 统一导出

根目录:
├── academic-assistant-real.mjs  # 真实实现的助手入口
└── agents-real/                 # 独立的真实实现目录（备用）
```

### 模拟实现文件（旧版）

```
packages/skills/src/
├── literature-search/
│   └── skill.ts               # 模拟的文献搜索 Skill
├── citation-manager/
│   └── skill.ts               # 模拟的引用管理 Skill
└── ... (其他模拟 Skills)
```

## 🎯 真实实现 vs 模拟实现对比

| 特性 | 真实实现 | 模拟实现 |
|------|---------|---------|
| SDK | `@anthropic-ai/claude-agent-sdk` | 自定义框架 |
| AI | 真实 Claude API | 无/假实现 |
| 输出 | 高质量 AI 生成 | 硬编码规则 |
| 工具 | 真实 WebSearch 等 | 模拟数据 |
| 用途 | 生产环境 | 学习理解 |

## 💡 使用示例

### 示例 1: 文献搜索

```bash
bun run academic-assistant-real.mjs "search for recent papers about transformer models in NLP"
```

**输出**：
```
🎓 学术助手 - 真实 Claude Agent SDK 实现
═══════════════════════════════════════════════════════════════
📝 请求: search for recent papers about transformer models in NLP
🎯 任务类型: literature search
🤖 指定 Agent: literature-searcher
═══════════════════════════════════════════════════════════════

🔧 使用工具: WebSearch

找到了 8 篇相关论文：
[真实的 AI 生成结果...]

═══════════════════════════════════════════════════════════════
✅ 任务完成！
🤖 使用: literature-searcher
```

### 示例 2: 引用格式化

```bash
bun run academic-assistant-real.mjs "format in APA style: Smith J, Doe J. Deep Learning. 2023. Nature. Vol 10. pp 123-145"
```

### 示例 3: 写作辅助

```bash
bun run academic-assistant-real.mjs "write an abstract for a paper about federated learning in healthcare"
```

## 🔧 在代码中使用真实 Skills

### 方式 1: 直接导入真实 Skill

```typescript
import { literatureSearchSkill } from '@assistant/skills/src/real-skills';

// 使用真实的文献搜索 Skill
const results = await literatureSearchSkill.execute({
  query: 'deep learning in NLP',
  maxResults: 10,
  sources: ['arxiv', 'semantic-scholar']
});

console.log(`找到 ${results.length} 篇论文`);
```

### 方式 2: 使用 Claude Agent SDK

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const agentQuery = query({
  prompt: 'search papers about machine learning',
  options: {
    agents: {
      'literature-searcher': {
        description: 'Expert in academic literature search',
        prompt: 'You are an expert...',
        tools: ['WebSearch', 'WebFetch'],
        model: 'sonnet'
      }
    },
    allowedTools: ['WebSearch', 'WebFetch'],
    permissionMode: 'bypassPermissions'
  }
});

for await (const message of agentQuery) {
  console.log(message);
}
```

## ⚠️ 重要说明

### API Key 和费用

1. **需要 API Key**: 必须设置有效的 `ANTHROPIC_API_KEY`
2. **产生费用**: 每次 API 调用都会产生费用（按 token 计费）
3. **成本控制**:
   - 使用 `haiku` 模型可以降低成本
   - 明确的提示词减少 token 使用
   - 设置合理的使用限制

### 与旧版模拟实现的区别

**旧版（模拟）**:
```typescript
// 只是验证类结构
const skill = new LiteratureSearchSkill(mcpClient);
const result = await skill.execute(task);
// 输出是模拟的，不是真实的 AI
```

**新版（真实）**:
```typescript
// 真实调用 Claude API
import { query } from '@anthropic-ai/claude-agent-sdk';
const result = await query({ prompt: '...', options: {...} });
// 输出是真实的 AI 生成内容
```

## 📚 相关文档

- [Claude Agent SDK Quickstart](https://platform.claude.com/docs/en/agent-sdk/quickstart)
- [Claude Agent SDK GitHub](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Agent Skills 文档](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [agents-real/README_CN.md](agents-real/README_CN.md) - 完整的中文文档

## 🚧 迁移指南

如果你之前使用的是模拟实现，迁移到真实实现：

1. **安装 SDK**:
   ```bash
   bun install @anthropic-ai/claude-agent-sdk
   ```

2. **设置 API Key**:
   ```bash
   export ANTHROPIC_API_KEY=your_key_here
   ```

3. **更新代码**:
   ```typescript
   // 旧的（模拟）
   import { LiteratureSearchSkill } from '@assistant/skills';
   const skill = new LiteratureSearchSkill(mcpClient);

   // 新的（真实）
   import { query } from '@anthropic-ai/claude-agent-sdk';
   const result = await query({...});
   ```

4. **处理流式输出**:
   ```typescript
   // 旧版（一次性）
   const output = await result.output;

   // 新版（流式）
   for await (const message of result) {
     console.log(message);
   }
   ```

## ✅ 优势

使用真实实现的优势：

✅ **生产就绪** - 可直接用于实际工作
✅ **高质量输出** - Claude AI 提供顶级质量
✅ **持续更新** - 随 Claude 模型改进而提升
✅ **完整工具** - 支持所有 Claude Code 工具
✅ **官方支持** - Anthropic 官方维护

## 🎓 总结

- **新手学习**: 可以先查看模拟实现代码理解架构
- **实际使用**: 必须使用真实实现才能获得有价值的结果
- **生产环境**: 强烈推荐使用真实实现

---

*更新日期: 2025-01-10*
*基于 Claude Agent SDK v0.2.3*
