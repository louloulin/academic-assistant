---
name: peer-review
description: Simulate academic peer review process for scientific papers. Provide section-wise review, identify strengths and weaknesses, and generate editorial decisions (accept/minor revisions/major revisions/reject). Use when users ask to review a paper, get peer review feedback, or evaluate submission quality.
allowed-tools:
  - Read
  - WebSearch
  - Edit
---

# Peer Review Skill

Expert academic peer reviewer for scientific papers across multiple disciplines.

## 何时使用

当用户要求以下任务时使用此技能：
- 对论文进行同行评审
- 模拟期刊审稿流程
- 评估论文的学术质量
- 提供审稿意见和修改建议
- 判断论文是否适合发表
- 识别论文的优缺点

## 能力

### 全面评审框架
- **创新性** (1-5分): 研究贡献的原创性
- **重要性** (1-5分): 对领域的重要性
- **方法学** (1-5分): 方法的科学性
- **结果** (1-5分): 结果的质量和可靠性
- **清晰度** (1-5分): 表达和展示质量

### 分节评审
- **摘要**: 是否准确反映全文内容
- **引言**: 是否清楚说明研究背景和问题
- **文献综述**: 是否全面覆盖相关研究
- **方法**: 是否详细且可重复
- **结果**: 是否清晰呈现
- **讨论**: 是否深入解释发现
- **结论**: 是否合理且有依据

### 编辑决策
- **Accept**: 直接接受发表
- **Minor Revisions**: 小修后接受
- **Major Revisions**: 大修后重新提交
- **Reject & Resubmit**: 拒稿但鼓励重新提交
- **Reject**: 拒稿，不适合发表

## 输入格式

接受以下输入：
- **paper** (required): 论文内容或文件路径
- **options** (optional): 选项对象
  - `venue`: string - 目标期刊/会议（用于调整标准）
  - `focusSections`: array - 重点评审的章节
  - `detailed**: boolean - 是否提供详细评审（默认true）

## 输出格式

返回包含以下字段的对象：
```json
{
  "decision": "Major Revisions",
  "overallAssessment": "本文提出了一个有趣的方法，但...",
  "scores": {
    "novelty": 4,
    "significance": 3,
    "methodology": 4,
    "results": 3,
    "clarity": 3
  },
  "strengths": [
    "方法创新，结合了X和Y技术",
    "实验设计较为全面"
  ],
  "weaknesses": [
    "对比实验不够充分",
    "缺少对失败案例的分析"
  ],
  "sectionComments": {
    "abstract": "摘要清晰，但缺少具体数值结果",
    "introduction": "背景介绍充分，研究问题明确",
    "methodology": "方法描述详细，可重复性强"
  },
  "requiredRevisions": [
    "添加与方法的对比实验",
    "补充消融实验",
    "改进图表的清晰度"
  ],
  "optionalSuggestions": [
    "考虑在附录中添加更多实验细节",
    "讨论方法的局限性"
  ]
}
```

## 使用示例

### 示例1: 快速评审
```
输入: 论文PDF + 目标期刊
输出: 编辑决策 + 总体评价 + 主要问题
```

### 示例2: 详细评审
```
输入: 完整论文
输出: 分节评审 + 优缺点列表 + 具体修改建议
```

### 示例3: 预投稿评估
```
输入: 论文初稿
输出: 是否适合目标期刊 + 需要改进的方面
```

## 评审标准

### 创新性 (Novelty)
- **5分**: 突破性创新，开辟新方向
- **4分**: 显著创新，改进现有方法
- **3分**: 有一定创新，增量改进
- **2分**: 创新有限，重复已有工作
- **1分**: 无创新，完全重复

### 重要性 (Significance)
- **5分**: 对领域有重大影响
- **4分**: 对领域有重要贡献
- **3分**: 有一定贡献
- **2分**: 贡献有限
- **1分**: 无明显贡献

### 方法学 (Methodology)
- **5分**: 方法严谨，设计完美
- **4分**: 方法合理，设计良好
- **3分**: 方法基本合理，有小问题
- **2分**: 方法有缺陷
- **1分**: 方法有严重问题

### 结果 (Results)
- **5分**: 结果清晰，证据充分
- **4分**: 结果较好，证据较充分
- **3分**: 结果一般，证据有限
- **2分**: 结果不清楚，证据不足
- **1分**: 结果不可信

### 清晰度 (Clarity)
- **5分**: 表达极佳，结构完美
- **4分**: 表达清晰，结构良好
- **3分**: 表达基本清楚，有小问题
- **2分**: 表达不清楚，结构混乱
- **1分**: 表达很差，难以理解

## 决策标准

### Accept
- 总分 > 4.0
- 所有关键项 ≥ 4分
- 无致命缺陷

### Minor Revisions
- 总分 > 3.5
- 所有关键项 ≥ 3分
- 需要小修改即可

### Major Revisions
- 总分 > 2.5
- 大部分项 ≥ 3分
- 需要重要修改

### Reject & Resubmit
- 总分 > 2.0
- 有价值但需要重大修改
- 建议重新投稿

### Reject
- 总分 ≤ 2.0
- 或有致命缺陷
- 或不适合本期刊

## 最佳实践

1. **客观公正**: 基于学术标准，不带个人偏见
2. **建设性批评**: 提供具体可行的改进建议
3. **尊重作者**: 使用礼貌、专业的语言
4. **详实具体**: 避免模糊不清的评价
5. **平衡观点**: 既指出优点，也指出缺点

## 伦理准则

- 保护作者知识产权
- 不用于商业目的
- 保持评审保密性
- 避免利益冲突
- 尊重作者的工作
