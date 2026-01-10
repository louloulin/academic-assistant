# 🎓 基于 Claude Agent SDK 的学术助手 - 真实实现

> 使用官方 `@anthropic-ai/claude-agent-sdk` 构建的智能学术研究助手

## 📚 目录

- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [使用指南](#使用指南)
- [Agent 详细说明](#agent-详细说明)
- [API 参考](#api-参考)
- [示例](#示例)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)

## 项目简介

这是一个基于 **Anthropic 官方 Claude Agent SDK** 构建的学术研究助手系统。它通过多个专业化的 AI Agents 协作，为研究人员提供从文献搜索、论文写作到同行评审的全流程支持。

### 为什么选择真实实现？

相比之前的模拟实现，这个版本：

✅ **使用官方 SDK** - 基于 `@anthropic-ai/claude-agent-sdk` 官方包
✅ **真实 API 调用** - 直接调用 Anthropic Claude API
✅ **流式输出** - 实时显示 AI 思考过程
✅ **多 Agent 协作** - 专业 Agents 各司其职
✅ **工具集成** - 使用 WebSearch、Read、Edit 等真实工具
✅ **生产就绪** - 可直接部署使用

## 核心特性

### 🤖 6 个专业 Agents

1. **Literature Searcher** - 文献搜索专家
   - 多数据库搜索（ArXiv、Google Scholar、PubMed）
   - 智能相关性排序
   - 自动提取元数据

2. **Citation Manager** - 引用管理专家
   - 5种引用格式（APA、MLA、Chicago、IEEE、Harvard）
   - 格式转换
   - 参考文献生成

3. **Academic Writer** - 写作助手
   - 内容生成（摘要、引言等）
   - 写作改进
   - 语法和风格检查

4. **Peer Reviewer** - 同行评审专家
   - 全面质量评估
   - 具体改进建议
   - 发表决策推荐

5. **Data Analyst** - 数据分析专家
   - 统计方法推荐
   - 可视化建议
   - 结果解释

6. **Journal Advisor** - 期刊投稿专家
   - 期刊推荐
   - Cover Letter 生成
   - 投稿策略

### 🛠️ 强大的工具集成

- **WebSearch** - 搜索网络资源
- **WebFetch** - 获取网页内容
- **Read** - 读取本地文件
- **Edit** - 编辑文件
- **Grep** - 搜索文件内容
- **Glob** - 查找文件
- **Bash** - 执行命令

## 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                 Academic Assistant System                │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Main Entry Point                        │  │
│  │     academic-assistant.mjs                        │  │
│  └──────────────┬────────────────────────────────────┘  │
│                 │                                       │
│                 ▼                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Claude Agent SDK Core                      │  │
│  │      @anthropic-ai/claude-agent-sdk               │  │
│  └──────────────┬────────────────────────────────────┘  │
│                 │                                       │
│      ┌──────────┼──────────┐                          │
│      ▼          ▼          ▼                          │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐    │
│  │Liter  │ │Cite   │ │Write  │ │Review │ │Data   │    │
│  │ature  │ │ation  │ │ing    │ │er     │ │Analyst│    │
│  │Search │ │Mgr    │ │Coach  │ │       │ │       │    │
│  └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘    │
│      │         │         │         │         │          │
│      ▼         ▼         ▼         ▼         ▼          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Tools Layer                          │  │
│  │  WebSearch │ WebFetch │ Read │ Edit │ Bash │...  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 关键技术

- **Runtime**: Bun 1.0+
- **SDK**: @anthropic-ai/claude-agent-sdk v0.2.3
- **Language**: JavaScript (ESM)
- **Architecture**: Multi-Agent System
- **Communication**: AsyncGenerator Stream

## 快速开始

### 前置要求

1. **安装 Bun**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **获取 Anthropic API Key**
   - 访问 [Anthropic Console](https://console.anthropic.com/)
   - 创建 API Key

3. **安装依赖**
   ```bash
   cd agents-real
   bun install
   ```

### 配置

设置 API Key 环境变量：

```bash
# 临时设置（当前会话）
export ANTHROPIC_API_KEY=your_api_key_here

# 或添加到 ~/.bashrc 或 ~/.zshrc
echo 'export ANTHROPIC_API_KEY=your_api_key_here' >> ~/.bashrc
source ~/.bashrc
```

### 快速测试

```bash
# 测试文献搜索
bun run literature "deep learning in natural language processing"

# 测试引用格式化
bun run citation "format this as APA: Smith et al. 2023, AI Applications, Nature"

# 测试写作助手
bun run writing "write an abstract about artificial intelligence in healthcare"

# 测试同行评审
bun run review "review this paper" path/to/paper.md

# 使用统一入口
bun run assistant "search papers about machine learning"
```

## 使用指南

### 方式 1: 使用独立 Agent 脚本

每个 Agent 都有独立的脚本文件：

```bash
# 文献搜索
bun run literature.mjs "your search query"

# 引用管理
bun run citation.mjs "format citation in APA style: ..."

# 写作助手
bun run writing.mjs "improve my academic writing"

# 同行评审
bun run review.mjs "evaluate this paper"
```

### 方式 2: 使用统一入口

推荐使用统一入口，系统会自动识别任务类型并分配给合适的 Agent：

```bash
bun run assistant.mjs "your request"
```

系统会自动识别：
- 文献搜索 → literature-searcher
- 引用格式化 → citation-manager
- 写作辅助 → academic-writer
- 同行评审 → peer-reviewer
- 数据分析 → data-analyst
- 期刊投稿 → journal-advisor

### 方式 3: 在代码中使用

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

// 定义 Agents
const agents = {
  'literature-searcher': {
    description: 'Expert in academic literature search',
    prompt: 'You are an expert...',
    tools: ['WebSearch', 'WebFetch'],
    model: 'sonnet'
  }
};

// 创建查询
const agentQuery = query({
  prompt: 'Search for papers about deep learning',
  options: {
    agents: agents,
    allowedTools: ['WebSearch', 'WebFetch'],
    permissionMode: 'bypassPermissions'
  }
});

// 处理流式输出
for await (const message of agentQuery) {
  if (message.type === 'assistant') {
    console.log(message.content);
  }
}
```

## Agent 详细说明

### 1. Literature Searcher

**功能**：
- 搜索 ArXiv、Google Scholar、PubMed
- 提取论文元数据（标题、作者、年份、引用数）
- 相关性评分和排序
- 生成结构化文献列表

**示例**：
```bash
bun run literature "transformer architecture for NLP"
```

**输出格式**：
```
# Attention Is All You Need
**Authors**: Vaswani et al.
**Year**: 2017
**Venue**: NeurIPS
**Citations**: 50000+
**DOI**: 10.5555/3295222.3295349

**Abstract**: [摘要...]

**Key Contributions**:
- Self-attention mechanism
- Parallel processing
- State-of-the-art results

**Relevance Score**: 10/10
```

### 2. Citation Manager

**功能**：
- 支持 5 种引用格式
- 格式转换
- 文内引用和参考文献生成
- 格式验证

**支持的格式**：
- APA 7th Edition
- MLA 9th Edition
- Chicago 17th Edition
- IEEE
- Harvard

**示例**：
```bash
bun run citation "convert to APA: Smith J. Deep Learning. 2023. Nature. Vol 10. pp 123-145"
```

### 3. Academic Writer

**功能**：
- 生成学术内容（摘要、引言、结论等）
- 改进写作质量和清晰度
- 检查语法和学术风格
- 提供具体修改建议

**示例**：
```bash
# 生成摘要
bun run writing "write an abstract for a paper about AI in drug discovery"

# 改进文本
bun run writing "improve clarity" path/to/paragraph.txt

# 检查风格
bun run writing "check for academic tone in this text" my-paper.md
```

### 4. Peer Reviewer

**功能**：
- 全面评估论文质量
- 分章节详细评审
- 识别优缺点
- 提供发表建议

**评估维度**：
- Novelty（新颖性）
- Significance（重要性）
- Methodology（方法论）
- Results（结果）
- Clarity（清晰度）

**决策类型**：
- Accept（接受）
- Minor Revisions（小修）
- Major Revisions（大修）
- Reject & Resubmit（拒稿但鼓励重投）
- Reject（拒稿）

**示例**：
```bash
bun run review path/to/paper.md
```

### 5. Data Analyst

**功能**：
- 推荐统计方法
- 数据可视化建议
- 结果解释
- 可复现性指导

**示例**：
```bash
bun run assistant "what statistical test should I use for comparing two groups"
```

### 6. Journal Advisor

**功能**：
- 期刊推荐
- Cover Letter 生成
- 投稿清单
- 策略建议

**示例**：
```bash
bun run assistant "recommend journals for a paper on machine learning in healthcare"
```

## API 参考

### 主入口函数

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

function query(params: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query;
```

### Options 类型

```typescript
type Options = {
  // Agent 定义
  agents?: Record<string, AgentDefinition>;

  // 允许的工具
  allowedTools?: string[];

  // 权限模式
  permissionMode?: 'default' | 'bypassPermissions' | 'acceptEdits';

  // 系统提示
  systemPrompt?: string;

  // 工作目录
  cwd?: string;

  // 中止控制器
  abortController?: AbortController;
};
```

### AgentDefinition 类型

```typescript
type AgentDefinition = {
  description: string;        // Agent 描述
  prompt: string;             // 系统提示
  tools?: string[];           // 允许的工具列表
  model?: 'sonnet' | 'opus' | 'haiku';  // 使用的模型
};
```

### 消息类型

```typescript
// 助手消息
type SDKAssistantMessage = {
  type: 'assistant';
  content: Array<TextBlock | ToolUseBlock>;
};

// 结果消息
type SDKResultMessage = {
  type: 'result';
  subtype: 'success' | 'error';
  error?: string;
};

// 状态消息
type SDKStatusMessage = {
  type: 'status';
  status: string;
};
```

## 示例

### 示例 1: 文献搜索流程

```bash
# 搜索论文
bun run literature "quantum computing applications in machine learning"

# 输出：
# 🔍 搜索学术文献: "quantum computing applications in machine learning"
#
# 找到 8 篇相关论文：
#
# 1. Quantum Machine Learning
#    **Authors**: Biamonte et al.
#    **Year**: 2017
#    **Citations**: 2500+
#    **Relevance**: 10/10
#
# [... 更多论文 ...]
```

### 示例 2: 引用格式转换

```bash
bun run citation "convert to IEEE: Smith, J. (2023). Deep learning for NLP. Nature, 10(2), 123-145."

# 输出：
# 📖 引用管理: "convert to IEEE: ..."
#
# ## Original Input
# Smith, J. (2023). Deep learning for NLP. Nature, 10(2), 123-145.
#
# ## Formatted Citation (IEEE)
# [1] J. Smith, "Deep learning for NLP," Nature, vol. 10, no. 2, pp. 123-145, 2023.
```

### 示例 3: 写作辅助

```bash
bun run writing "write an abstract about federated learning in healthcare"

# 输出：
# ✍️ 学术写作助手
#
# ## Suggested Abstract
#
# Federated learning has emerged as a promising approach...
#
# ## Key Points Covered
# - Motivation and problem
# - Proposed approach
# - Key results
# - Implications
```

### 示例 4: 同行评审

```bash
bun run review "evaluate this research paper" my-paper.md

# 输出：
# 👨‍🔬 学术同行评审
#
# # Peer Review Report
#
# ## Overall Assessment
# - Novelty: 4/5
# - Significance: 4/5
# - Methodology: 3/5
# - Results: 4/5
# - Clarity: 3/5
#
# ## Strengths
# 1. Novel approach to problem
# 2. Strong experimental results
# 3. Clear presentation
#
# ## Weaknesses & Required Changes
# 1. Methodology needs more detail
# 2. Statistical analysis insufficient
# 3. Related work incomplete
#
# ## Decision
# **Recommendation**: MAJOR REVISIONS
```

## 最佳实践

### 1. 提示词编写

✅ **好的提示词**：
```
"search for recent papers (2023-2024) about transformer models in computer vision, focusing on efficiency improvements"
```

❌ **不好的提示词**：
```
"find papers"
```

### 2. 任务分解

对于复杂任务，分解成多个子任务：

```bash
# 第一步：搜索文献
bun run literature "deep learning for time series forecasting"

# 第二步：综述文献
bun run writing "write a literature review based on these findings"

# 第三步：生成引用
bun run citation "format these references in APA style"
```

### 3. 结果保存

将重要结果保存到文件：

```bash
# 保存文献搜索结果
bun run literature "quantum ML" > literature-results.md

# 使用 Edit 工具保存
bun run assistant "search papers and save results to papers.md"
```

### 4. API 成本控制

- 使用 `permissionMode: 'bypassPermissions'` 减少交互
- 明确指定工具列表避免不必要的调用
- 选择合适的模型（haiku 更快更便宜，sonnet 质量更好）

## 常见问题

### Q1: 如何获取 API Key？

访问 [Anthropic Console](https://console.anthropic.com/)，注册并创建 API Key。

### Q2: 支持哪些模型？

- **Sonnet**（推荐）：平衡质量和速度
- **Opus**：最高质量，成本较高
- **Haiku**：最快速度，适合简单任务

### Q3: 如何限制 Agent 的能力？

在 `AgentDefinition` 中指定 `tools` 列表：

```javascript
{
  'my-agent': {
    description: 'Agent with limited tools',
    prompt: '...',
    tools: ['WebSearch']  // 只允许搜索
  }
}
```

### Q4: 可以处理中文内容吗？

可以！Claude 支持多语言，包括中文学术文献。

### Q5: 如何处理大文件？

对于大文件，建议：
1. 分段处理
2. 使用 Grep 工具定位相关内容
3. 专注于特定章节

### Q6: API 调用失败怎么办？

检查：
1. API Key 是否正确
2. 网络连接是否正常
3. 账户是否有足够额度
4. 是否超出速率限制

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发指南

```bash
# 克隆仓库
git clone <repo-url>
cd agents-real

# 安装依赖
bun install

# 运行测试
bun test

# 添加新的 Agent
# 1. 在 academic-assistant.mjs 中添加 Agent 定义
# 2. 创建独立的 Agent 脚本（可选）
# 3. 添加文档和示例
# 4. 提交 PR
```

## 许可证

MIT License - 详见 LICENSE 文件

## 致谢

- [Anthropic](https://www.anthropic.com/) - Claude Agent SDK
- [Claude Agent SDK Documentation](https://platform.claude.com/docs/en/agent-sdk/quickstart)
- 所有贡献者

## 联系方式

- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Discussions: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**注意**: 本项目仅供学习和研究使用。使用时请遵守 Anthropic 的服务条款。
