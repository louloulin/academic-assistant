# 🎓 基于 Claude Agent SDK 的学术助手 - 真实实现

本目录包含基于 **官方 @anthropic-ai/claude-agent-sdk** 的真实学术助手实现。

## 🏗️ 架构说明

### 与之前模拟实现的区别

1. **真实的 Agent SDK**: 使用官方 `@anthropic-ai/claude-agent-sdk` 而不是自定义框架
2. **Agent 定义方式**: 使用 `agents` 参数定义多个专业 Agent
3. **工具集成**: 直接使用 SDK 提供的工具（WebSearch, Read, Edit, Bash 等）
4. **流式输出**: 利用 AsyncGenerator 获取实时输出

### Agent 架构

```
学术助手系统
├── LiteratureAgent (文献搜索 Agent)
│   └── 工具: WebSearch, WebFetch
├── CitationAgent (引用管理 Agent)
│   └── 工具: Read, Edit, WebSearch
├── WritingAgent (写作助手 Agent)
│   └── 工具: Read, Edit, Bash, WebSearch
├── ReviewAgent (同行评审 Agent)
│   └── 工具: Read, Grep, Glob
└── DataAgent (数据分析 Agent)
    └── 工具: Bash, Read, Edit
```

## 📦 安装依赖

```bash
cd agents-real
bun install
```

## 🔑 配置 API Key

确保已设置 `ANTHROPIC_API_KEY` 环境变量：

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

## 🚀 使用方式

### 方式1: 使用主入口脚本

```bash
# 文献搜索
bun run literature.mjs "search papers about deep learning in NLP"

# 引用格式化
bun run citation.mjs "format these references in APA style"

# 写作助手
bun run writing.mjs "help me write an abstract about AI"
```

### 方式2: 直接使用 SDK

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function searchLiterature(query) {
  const agent = await query({
    prompt: `Search for academic papers about: ${query}`,
    options: {
      agents: {
        'literature-searcher': {
          description: 'Expert in academic literature search',
          prompt: 'You are an expert academic researcher...',
          tools: ['WebSearch', 'WebFetch']
        }
      },
      allowedTools: ['WebSearch', 'WebFetch'],
      permissionMode: 'auto'
    }
  });

  for await (const message of agent) {
    console.log(message);
  }
}
```

## 📚 各个 Agent 功能

### 1. LiteratureAgent
- 搜索 ArXiv, Google Scholar, PubMed
- 提取论文元数据
- 生成文献列表

### 2. CitationAgent
- 格式化引用（APA, MLA, Chicago, IEEE, Harvard）
- 生成参考文献列表
- 检查引用格式

### 3. WritingAgent
- 提供写作建议
- 检查语法和风格
- 生成论文结构

### 4. ReviewAgent
- 模拟同行评审
- 提供修改建议
- 评估论文质量

### 5. DataAgent
- 推荐统计方法
- 生成数据可视化代码
- 提供分析建议

## 🧪 测试

```bash
# 运行所有测试
bun test

# 运行特定测试
bun test literature.test.mjs
```

## 📖 示例

查看 `examples/` 目录获取更多使用示例。

## 🔗 相关资源

- [Claude Agent SDK 文档](https://platform.claude.com/docs/en/agent-sdk/quickstart)
- [Claude Agent SDK GitHub](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Agent Skills 文档](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)

## 📝 注意事项

1. **API Key**: 需要有效的 Anthropic API Key
2. **网络访问**: WebSearch 和 WebFetch 需要网络连接
3. **文件权限**: 某些操作需要文件读写权限
4. **成本控制**: 使用 API 会产生费用，请注意控制使用量

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
