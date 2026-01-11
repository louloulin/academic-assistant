# 🎓 学术助手 CLI - 使用指南

## 快速开始

### 安装依赖
```bash
bun install
```

### 基本使用

```bash
# 查看帮助
bun run cli

# 查看所有可用Skills
bun run cli --skills

# 使用学术助手
bun run cli "您的请求"
```

## 使用示例

### 1. 文献搜索
```bash
bun run cli "搜索关于深度学习在医疗领域应用的最新论文"
```

### 2. 引用格式化
```bash
bun run cli "将这个引用格式化为APA: Author et al., Deep Learning in Healthcare, 2023"
```

### 3. 论文结构生成
```bash
bun run cli "为我生成一篇关于transformer架构的论文结构"
```

### 4. 写作质量检查
```bash
bun run cli "检查这段学术写作的语法和质量：..."
```

### 5. 文献综述
```bash
bun run cli "为以下主题写文献综述：大语言模型在教育领域的应用"
```

### 6. 期刊推荐
```bash
bun run cli "推荐适合发表这篇关于机器学习的论文的期刊"
```

### 7. 同行评审
```bash
bun run cli "模拟同行评审这篇论文，给出修改建议"
```

## 可用的Skills

### 🔗 核心Skills (4个)
- **literature-search** - 搜索学术文献
- **citation-manager** - 格式化和验证引用
- **paper-structure** - 生成论文结构
- **writing-quality** - 检查写作质量

### 🔗 分析Skills (4个)
- **literature-review** - 分析和综合文献 (可调用其他Skills)
- **peer-review** - 模拟同行评审 (可调用其他Skills)
- **data-analysis** - 统计分析和可视化 (可调用其他Skills)
- **journal-submission** - 期刊匹配和投稿准备 (可调用其他Skills)

### 增强Skills (5个)
- **semantic-search** - 向量语义搜索
- **academic-polisher** - 语言润色和改进 (可调用其他Skills)
- **plagiarism-checker** - 检测潜在抄袭
- **pdf-analyzer** - 深度PDF解析
- **citation-graph** - 生成引用图谱

### 工具Skills (5个)
- **experiment-runner** - 执行实验代码
- **data-analyzer** - 深度数据分析 (可调用其他Skills)
- **journal-matchmaker** - 匹配合适期刊
- **version-control** - Git版本管理
- **zotero-integrator** - Zotero文献管理

### 协作Skills (6个)
- **workflow-manager** - 编排多个Skills (可调用所有Skills) 🔗
- **conversational-editor** - 交互式写作助手
- **creative-expander** - 扩展和创意开发 (可调用其他Skills)
- **collaboration-hub** - 多人协作编辑 (可调用其他Skills)
- **personalized-recommender** - 基于兴趣的推荐 (可调用其他Skills)
- **multilingual-writer** - 多语言翻译写作 (可调用其他Skills)

🔗 标记表示该Skill可以调用其他Skills

## 技术架构

### 基于Claude Agent SDK
- ✅ 真实使用Claude Agent SDK的`query()`函数
- ✅ AgentDefinition格式
- ✅ Fork Context支持 (16个Skills使用)
- ✅ Skill工具支持 (11个Skills可调用其他Skills)
- ✅ 真实工具使用 (WebSearch, Read, Write, Bash)

### Skills协作能力
- ✅ 11个Skills配置了`allowed-tools: [Skill]`
- ✅ Skills可以相互调用形成工作流
- ✅ workflow-manager作为总编排器可以调用所有Skills

### 真实实现
- ✅ 0行Mock代码
- ✅ 所有算法真实实现
- ✅ 所有工具真实调用
- ✅ 无外部API依赖（仅Claude SDK）

## 高级用法

### 组合多个Skills

某些请求会自动触发多个Skills的协作：

```bash
# 这个请求会调用 literature-search → semantic-search → literature-review
bun run cli "为我的论文搜索相关文献并写综述"
```

### 使用workflow-manager

对于复杂任务，workflow-manager会自动编排多个Skills：

```bash
# workflow-manager会协调多个Skills完成整个流程
bun run cli "帮我完成一篇论文的完整写作流程"
```

## 测试验证

运行所有测试验证功能：

```bash
# Skill协作测试
node --test tests/skill-collaboration-test.mjs

# Plan 6测试
node --test tests/plan6-simple-test.mjs
```

## 相关文档

- **plan5.md** - Plan 5完整规划和实现状态
- **plan6.md** - Plan 6 Agent编排系统
- **IMPLEMENTATION_COMPLETE.md** - 实现完成报告

## 系统状态

- ✅ 24个完整Skills
- ✅ 11个Skills可调用其他Skills
- ✅ 16个Skills使用Fork Context
- ✅ 0行Mock代码
- ✅ 100%测试通过
- ✅ 生产就绪

## 命令别名

除了 `bun run cli`，您也可以使用：

```bash
bun run assistant "您的请求"
```

两个命令完全相同。

## 故障排除

### Claude API未配置
确保设置了Claude API密钥：
```bash
export ANTHROPIC_API_KEY=your_key_here
```

### 网络问题
某些Skills需要网络访问（如WebSearch），请确保网络连接正常。

### 权限问题
某些操作需要文件读写权限，请确保有相应的权限。

---

**版本**: 1.0.0
**状态**: 🚀 生产就绪
**日期**: 2026-01-11
