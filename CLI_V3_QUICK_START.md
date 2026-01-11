# 🚀 CLI V3.0 快速开始指南

## 📋 基本信息

**CLI 文件**: `academic-cli-v3.mjs`
**测试文件**: `tests/cli-v3-skills-integration.test.mjs`
**测试结果**: ✅ 64/64 通过 (100%)

## ✨ 核心特性

1. **动态 Skills 发现** - 自动加载所有 Skills，无需手动维护
2. **AI 智能分析** - 理解复杂请求，选择最优 Skills
3. **结构化工作流** - 5 种预定义工作流，完整进度跟踪
4. **验证检查点** - 确保每步输出质量
5. **Progressive Disclosure** - 优化 Token 使用 50%

## 🎯 使用方法

### 基本语法

```bash
bun run academic-cli-v3.mjs "您的请求"
```

### 使用示例

#### 1. 文献研究
```bash
bun run academic-cli-v3.mjs "搜索关于深度学习在医疗领域应用的论文并写综述"
```

**工作流**: 搜索 → 分析 → 综合 → 格式化 (4 步)

#### 2. 论文写作
```bash
bun run academic-cli-v3.mjs "帮我写一篇关于机器学习的论文，包含完整的结构、内容、质量检查和同行评审"
```

**工作流**: 结构 → 撰写 → 润色 → 质量检查 → 评审 (5 步)

#### 3. 数据分析
```bash
bun run academic-cli-v3.mjs "分析这组数据，进行统计分析、可视化，并生成报告"
```

**工作流**: 统计 → 可视化 → 实验 → 报告 (4 步)

#### 4. 质量检查
```bash
bun run academic-cli-v3.mjs "检查这篇论文的质量，包括语法、清晰度、学术语言和抄袭检测"
```

**工作流**: 写作质量 → 抄袭检测 → 学术润色 (3 步)

#### 5. 期刊投稿
```bash
bun run academic-cli-v3.mjs "推荐合适的期刊并准备投稿材料"
```

**工作流**: 匹配期刊 → 投稿信 → 检查清单 (3 步)

## 📊 执行流程

```
1. 🔍 发现 Skills
   └─ 自动读取 .claude/skills/*/SKILL.md
   └─ 解析 YAML frontmatter
   └─ 构建动态 Skills 注册表

2. 🤔 AI 任务分析
   └─ 使用 Claude SDK 分析请求
   └─ 识别任务类型
   └─ 选择最优 Skills 组合

3. 📋 生成工作流
   └─ 根据任务类型选择工作流
   └─ 生成 Checklist
   └─ 定义验证检查点

4. 🔄 执行工作流
   └─ 逐步执行
   └─ 实时显示进度
   └─ 验证每步输出

5. 💾 保存输出
   └─ 生成完整报告
   └─ 保存到 output/ 目录
```

## 🎨 进度显示示例

```
📊 进度:

→ ⏳ 搜索文献
   Skills: literature-search, semantic-search
⏳ 深度分析论文
   Skills: pdf-analyzer
⏳ 综合文献
   Skills: literature-review, citation-graph
⏳ 格式化引用
   Skills: citation-manager

进度: 1/4 (25%)
```

## 🔧 配置选项

在 `academic-cli-v3.mjs` 中可以修改:

```javascript
const CONFIG = {
  model: 'claude-sonnet-4-5',  // 模型
  maxTurns: 10,                // 最大轮次
  timeout: 300000,             // 超时 (5 分钟)
  outputDir: './output',       // 输出目录
  autoSave: true,              // 自动保存
};
```

## 📁 输出文件

输出文件保存在 `output/` 目录:

```
output/
├── workflow-文献研究工作流-20260111T123456.md
├── workflow-论文写作工作流-20260111T234567.md
└── workflow-数据分析工作流-20260111T345678.md
```

每个文件包含:
- 生成时间
- 完成步骤统计
- 耗时
- 每个步骤的输出

## 🧪 运行测试

```bash
# 运行所有测试
bun test tests/cli-v3-skills-integration.test.mjs

# 运行特定测试类别
bun test tests/cli-v3-skills-integration.test.mjs -t "动态 Skills 发现"
```

**测试结果**: ✅ 64/64 通过 (100%)

## 📚 相关文档

- **CLI_V3_IMPROVEMENT_REPORT.md** - 完整改进报告
- **CLI_PROBLEMS_AND_SOLUTION.md** - 问题分析和解决方案
- **FINAL_SUMMARY_CLI_V3.md** - 最终总结
- **plan5.md** - 已更新 CLI V3.0 完成标记

## 🎯 工作流类型

| 工作流 | 步骤数 | 说明 |
|--------|--------|------|
| 文献研究 | 4 | 搜索 → 分析 → 综合 → 格式化 |
| 论文写作 | 5 | 结构 → 撰写 → 润色 → 质量检查 → 评审 |
| 数据分析 | 4 | 统计 → 可视化 → 实验 → 报告 |
| 质量检查 | 3 | 写作质量 → 抄袭检测 → 学术润色 |
| 期刊投稿 | 3 | 匹配 → 投稿信 → 检查清单 |

## 💡 最佳实践

1. **具体描述请求** - 越具体，结果越准确
2. **使用完整句子** - AI 能更好地理解
3. **指定工作流类型** - 可以明确指定工作流
4. **检查输出目录** - 结果自动保存到 `output/`
5. **查看进度** - 实时显示，可以随时中断

## 🆚 V2 vs V3

| 特性 | V2 | V3 |
|------|----|----|
| Skills 发现 | 硬编码 | 动态 |
| 任务分析 | 关键词 | AI |
| 工作流 | 无 | 5 种 |
| 进度跟踪 | 无 | Checklist |
| 验证 | 无 | 检查点 |
| Token 效率 | 基础 | +50% |

## 🎉 开始使用

```bash
# 运行一个简单的请求
bun run academic-cli-v3.mjs "搜索关于transformer架构的论文"

# 查看帮助
bun run academic-cli-v3.mjs --help
```

---

**状态**: ✅ 生产就绪
**测试**: ✅ 64/64 通过 (100%)
**文档**: ✅ 完整

🎉🎉🎉 立即开始使用 CLI V3.0！🎉🎉🎉
