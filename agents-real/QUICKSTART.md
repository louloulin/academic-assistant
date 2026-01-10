# 🚀 快速开始指南

## 5 分钟上手学术助手

### 第一步：安装和配置

```bash
# 1. 进入项目目录
cd agents-real

# 2. 安装依赖
bun install

# 3. 设置 API Key
export ANTHROPIC_API_KEY=your_api_key_here
```

### 第二步：测试安装

```bash
# 运行测试
bun test

# 应该看到 17+ tests pass
```

### 第三步：开始使用

## 使用示例

### 示例 1：文献搜索（30秒）

```bash
bun run literature "deep learning in natural language processing"
```

**输出**：
```
🔍 搜索学术文献: "deep learning in natural language processing"
═══════════════════════════════════════════════════════════════

🔧 使用工具: WebSearch

找到了 8 篇相关论文：

# Attention Is All You Need
**Authors**: Vaswani et al.
**Year**: 2017
**Venue**: NeurIPS
**Citations**: 50000+
**DOI**: 10.5555/3295222.3295349

**Relevance Score**: 10/10 - Foundational paper on transformers

[... 更多论文 ...]

═══════════════════════════════════════════════════════════════
✅ 搜索完成！
```

### 示例 2：引用格式化（20秒）

```bash
bun run citation "format this in APA: Smith J et al 2023 Deep Learning Nature vol 10 pp 123-145"
```

**输出**：
```
📖 引用管理: "format this in APA: ..."

## Formatted Citation (APA 7th Edition)
Smith, J., et al. (2023). Deep learning. *Nature*, *10*(2), 123-145.

## In-Text Citation
(Smith et al., 2023)

═══════════════════════════════════════════════════════════════
✅ 引用格式化完成！
```

### 示例 3：写作辅助（1分钟）

```bash
bun run writing "write an abstract about federated learning in healthcare"
```

**输出**：
```
✍️ 学术写作助手
═══════════════════════════════════════════════════════════════

## Suggested Abstract

Federated learning has emerged as a promising approach...
[完整的摘要内容...]

## Key Elements
✓ Clear problem statement
✓ Proposed methodology
✓ Key results
✓ Implications for healthcare

═══════════════════════════════════════════════════════════════
✅ 写作辅助完成！
```

### 示例 4：使用统一入口（推荐）

```bash
bun run assistant "help me with my research on machine learning"
```

系统会自动识别并调用合适的 Agent！

## 常用命令

```bash
# 文献搜索
bun run literature "your search query"

# 引用管理
bun run citation "format citation request"

# 写作辅助
bun run writing "writing help request"

# 同行评审
bun run review "paper path or review request"

# 统一入口（推荐）
bun run assistant "any academic help request"
```

## 下一步

- 📖 阅读完整文档：[README_CN.md](README_CN.md)
- 🎓 查看更多示例：[EXAMPLES.md](EXAMPLES.md)
- 🔧 了解高级用法：[ADVANCED.md](ADVANCED.md)

## 获取帮助

如果遇到问题：

1. 检查 API Key 是否设置
2. 确认网络连接正常
3. 查看错误信息
4. 参考常见问题：[FAQ.md](FAQ.md)

## 注意事项

⚠️ **API 费用**：每次调用都会使用 Anthropic API，会产生费用
- 使用 `haiku` 模型可以降低成本
- 明确的提示词减少 token 使用
- 设置合理的超时时间

💡 **最佳实践**：
- 提供清晰的请求
- 分解复杂任务
- 保存重要结果
- 定期检查 API 使用量

---

**开始你的学术研究之旅吧！** 🎓✨
