---
name: writing-quality
description: Check and improve academic writing quality, including grammar, clarity, tone, readability, consistency, and vocabulary. Use when users ask to check writing quality, improve academic text, or evaluate paper quality.
allowed-tools:
  - Read
  - Edit
  - WebSearch
---

# Writing Quality Skill

Expert in academic writing quality assessment and improvement.

## 何时使用

当用户要求以下任务时使用此技能：
- 检查学术写作质量
- 改进论文的语法和表达
- 评估文本的清晰度和可读性
- 提升学术写作风格
- 检查术语使用的一致性
- 改进词汇选择

## 能力

### 写作质量检查
- **语法检查**: 检测语法错误、拼写错误、标点符号问题
- **清晰度**: 评估句子结构、段落组织、逻辑连贯性
- **学术语调**: 确保正式、客观的学术语言风格
- **可读性**: 分析句子长度、段落复杂度、阅读难度

### 质量评分
- **总体评分**: 0-100分的综合质量评分
- **分项评分**: 语法、清晰度、语调、一致性、词汇
- **改进建议**: 具体的改进建议和示例

### 文本改进
- **语法修正**: 自动修正语法错误
- **表达优化**: 改进不清晰或不自然的表达
- **风格调整**: 调整为更符合学术规范的风格
- **术语统一**: 统一专业术语的使用

## 输入格式

接受以下输入：
- **text** (required): 需要检查或改进的文本
- **options** (optional): 选项对象
  - `checkGrammar`: boolean - 是否检查语法（默认true）
  - `checkClarity`: boolean - 是否检查清晰度（默认true）
  - `checkTone`: boolean - 是否检查语调（默认true）
  - `scoreOnly`: boolean - 是否只返回评分（默认false）

## 输出格式

返回包含以下字段的对象：
```json
{
  "overallScore": 85,
  "scores": {
    "grammar": 90,
    "clarity": 80,
    "tone": 85,
    "consistency": 88,
    "vocabulary": 82
  },
  "issues": [
    {
      "type": "grammar",
      "location": "第3段第2句",
      "issue": "主谓不一致",
      "suggestion": "将'the data show'改为'the data shows'"
    }
  ],
  "improvements": [
    {
      "original": "The thing is that...",
      "improved": "It is evident that...",
      "reason": "更正式的学术表达"
    }
  ],
  "summary": "整体质量良好，主要问题在于..."
}
```

## 使用示例

### 示例1: 检查论文摘要
```
输入: Abstract of a research paper
输出: 质量评分 + 具体问题 + 改进建议
```

### 示例2: 改进段落表达
```
输入: A paragraph with unclear expressions
输出: 改进后的版本 + 改进说明
```

### 示例3: 评估整体质量
```
输入: Full research paper
输出: 综合质量报告 + 分项评分 + 改进优先级
```

## 最佳实践

1. **保持客观**: 基于学术写作标准提供反馈
2. **具体建议**: 提供具体的改进示例，而非泛泛而谈
3. **解释原因**: 说明为什么需要改进
4. **尊重原意**: 在改进时保持作者的原意
5. **考虑领域**: 不同领域可能有不同的写作惯例

## 评分标准

- **90-100分**: 优秀，符合顶级期刊标准
- **80-89分**: 良好，需要少量改进
- **70-79分**: 中等，需要一定改进
- **60-69分**: 及格，需要显著改进
- **60分以下**: 不及格，需要重大修改

## 限制

- 不改变研究的核心内容和发现
- 不添加原文中没有的信息
- 保持作者的写作风格特征
- 考虑英语非母语作者的常见问题
