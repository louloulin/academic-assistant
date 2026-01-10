# 学术论文助手 - 使用示例

本文档提供所有8个核心技能的详细使用示例。

## 📚 目录

1. [文献搜索](#1-文献搜索-literaturesearchskill)
2. [引用管理](#2-引用管理-citationmanagerskill)
3. [论文结构](#3-论文结构-paperstructureskill)
4. [写作质量](#4-写作质量-writingqualityskill)
5. [文献综述](#5-文献综述-literaturereviewskill)
6. [同行评审](#6-同行评审-peerreviewskill)
7. [数据分析](#7-数据分析-dataanalysisskill)
8. [期刊投稿](#8-期刊投稿-journalsubmissionskill)

---

## 1. 文献搜索 (LiteratureSearchSkill)

### 基础示例

```typescript
import { LiteratureSearchSkill } from '@assistant/skills';
import { MCPClient } from '@assistant/mcp-client';
import { TaskStatus } from '@assistant/core';

// 初始化MCP客户端和技能
const mcpClient = new MCPClient();
const searchSkill = new LiteratureSearchSkill(mcpClient);

// 创建搜索任务
const task = {
  id: 'search-001',
  title: '搜索深度学习在医学影像中的应用',
  status: TaskStatus.PENDING,
  priority: 3,
  input: {
    query: 'deep learning medical imaging diagnosis',
    maxResults: 15,
    sources: ['arxiv', 'semantic-scholar', 'pubmed'],
    yearFrom: 2022,
    yearTo: 2024
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// 执行搜索
const result = await searchSkill.execute(task);

// 输出结果
console.log(`找到 ${result.output.length} 篇论文`);
result.output.forEach((paper, index) => {
  console.log(`\n${index + 1}. ${paper.title}`);
  console.log(`   作者: ${paper.authors.join(', ')}`);
  console.log(`   年份: ${paper.year}`);
  console.log(`   引用数: ${paper.citationCount || 'N/A'}`);
  console.log(`   摘要: ${paper.abstract.substring(0, 150)}...`);
});
```

### 高级用法

```typescript
// 仅搜索ArXiv最新论文
const arxivTask = {
  input: {
    query: 'transformer architecture',
    sources: ['arxiv'],
    yearFrom: 2023,
    maxResults: 20
  }
};

// 搜索特定作者的工作
const authorTask = {
  input: {
    query: 'Geoffrey Hinton deep learning',
    sources: ['semantic-scholar'],
    maxResults: 10
  }
};

// 组合多个关键词
const multiKeywordTask = {
  input: {
    query: 'reinforcement learning robotics control',
    sources: ['arxiv', 'semantic-scholar'],
    yearFrom: 2020,
    maxResults: 25
  }
};
```

---

## 2. 引用管理 (CitationManagerSkill)

### APA格式示例

```typescript
import { CitationManagerSkill, CitationStyle } from '@assistant/skills';

const citationSkill = new CitationManagerSkill();

const task = {
  id: 'cite-001',
  title: '生成APA格式引用',
  status: TaskStatus.PENDING,
  priority: 2,
  input: {
    papers: [
      {
        id: '1',
        title: 'Attention Is All You Need',
        authors: ['Vaswani, Ashish', 'Shazeer, Noam', 'Parmar, Niki'],
        year: 2017,
        journal: 'NeurIPS',
        pages: '5998-6008',
        doi: '10.5555/3295222.3295347'
      },
      {
        id: '2',
        title: 'BERT: Pre-training of Deep Bidirectional Transformers',
        authors: ['Devlin, Jacob', 'Chang, Ming-Wei', 'Lee, Kenton'],
        year: 2019,
        journal: 'NAACL',
        volume: '1',
        issue: '1',
        pages: '4171-4186',
        doi: '10.18653/v1/N19-1423'
      }
    ],
    style: CitationStyle.APA
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const result = await citationSkill.execute(task);

console.log('参考文献列表:');
console.log(result.output.bibliography);

// 输出:
// Vaswani, A., Shazeer, N., & Parmar, N. (2017). Attention Is All You Need. NeurIPS, 5998-6008. https://doi.org/10.5555/3295222.3295347
// Devlin, J., Chang, M., & Lee, K. (2019). BERT: Pre-training of Deep Bidirectional Transformers. NAACL, 1(1), 4171-4186. https://doi.org/10.18653/v1/N19-1423
```

### 多格式对比

```typescript
const styles = [
  CitationStyle.APA,
  CitationStyle.MLA,
  CitationStyle.CHICAGO,
  CitationStyle.IEEE,
  CitationStyle.HARVARD
];

for (const style of styles) {
  const task = { input: { papers, style } };
  const result = await citationSkill.execute(task);
  console.log(`\n${style.toUpperCase()} 格式:`);
  console.log(result.output.bibliography);
}
```

---

## 3. 论文结构 (PaperStructureSkill)

### 研究论文结构生成

```typescript
import { PaperStructureSkill, PaperType } from '@assistant/skills';

const structureSkill = new PaperStructureSkill();

const task = {
  id: 'structure-001',
  title: '生成研究论文结构',
  status: TaskStatus.PENDING,
  priority: 2,
  input: {
    title: '基于深度学习的医学影像诊断系统研究',
    paperType: PaperType.RESEARCH_PAPER,
    researchArea: '医学人工智能',
    keywords: ['深度学习', '医学影像', '诊断系统', '卷积神经网络']
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const result = await structureSkill.execute(task);

console.log('论文结构:\n');
result.output.sections.forEach(section => {
  console.log(`## ${section.order}. ${section.title}`);
  console.log(`${section.description}`);
  console.log(`\n子章节:`);
  section.subsections?.forEach(sub => {
    console.log(`  - ${sub}`);
  });
  console.log(`\n写作建议:`);
  section.tips.forEach(tip => {
    console.log(`  ✓ ${tip}`);
  });
  console.log('\n' + '='.repeat(60) + '\n');
});

// 字数统计
console.log('\n建议字数分配:');
Object.entries(result.output.estimatedWordCounts).forEach(([section, count]) => {
  if (section !== 'total') {
    console.log(`  ${section}: ${count} 字`);
  }
});
console.log(`  总计: ${result.output.estimatedWordCounts.total} 字`);
```

### 不同论文类型

```typescript
// 学位论文
const thesisTask = {
  input: {
    title: '自然语言处理在临床文本分析中的应用研究',
    paperType: PaperType.THESIS,
    researchArea: '自然语言处理'
  }
};

// 会议论文
const conferenceTask = {
  input: {
    title: '多模态情感识别方法',
    paperType: PaperType.CONFERENCE_PAPER,
    researchArea: '情感计算'
  }
};

// 综述论文
const reviewTask = {
  input: {
    title: '深度强化学习研究进展综述',
    paperType: PaperType.REVIEW_PAPER,
    researchArea: '强化学习'
  }
};
```

---

## 4. 写作质量 (WritingQualitySkill)

### 基础质量检查

```typescript
import { WritingQualitySkill } from '@assistant/skills';

const qualitySkill = new WritingQualitySkill();

const task = {
  id: 'quality-001',
  title: '检查论文写作质量',
  status: TaskStatus.PENDING,
  priority: 2,
  input: {
    text: `
      Deep learning has revolutionized the field of computer vision.
      This paper proposes a novel approach for image classification.
      The method achieves state-of-the-art performance on ImageNet dataset.
      We evaluated our approach using multiple metrics including accuracy, precision, and recall.
      Results demonstrate significant improvements over existing methods.
    `,
    checks: ['grammar', 'clarity', 'tone', 'readability', 'vocabulary']
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const result = await qualitySkill.execute(task);

console.log(`总体评分: ${result.output.overallScore}/100`);
console.log(`阅读时间: ${result.output.statistics.readingTime} 分钟`);
console.log(`字数: ${result.output.statistics.wordCount}`);
console.log(`平均句长: ${result.output.statistics.avgWordsPerSentence.toFixed(1)} 词`);

console.log('\n各项检查得分:');
result.output.checks.forEach(check => {
  console.log(`  ${check.name}: ${check.score}/100 ${check.passed ? '✓' : '✗'}`);
  if (check.issues.length > 0) {
    console.log(`  问题:`);
    check.issues.forEach(issue => {
      console.log(`    - [${issue.severity}] ${issue.message}`);
    });
  }
});

console.log('\n改进建议:');
result.output.suggestions.forEach(suggestion => {
  console.log(`  [${suggestion.priority}] ${suggestion.description}`);
  if (suggestion.example) {
    console.log(`    原文: ${suggestion.example.original}`);
    console.log(`    建议: ${suggestion.example.improved}`);
  }
});
```

### 详细检查报告

```typescript
// 完整的6项检查
const fullCheckTask = {
  input: {
    text: yourLongPaperText,
    checks: [
      'grammar',       // 语法检查
      'clarity',       // 清晰度
      'tone',          // 学术语调
      'readability',   // 可读性
      'consistency',   // 一致性
      'vocabulary'     // 词汇使用
    ]
  }
};

const result = await qualitySkill.execute(fullCheckTask);

// 生成详细报告
const report = {
  summary: `总体质量: ${result.output.overallScore}分`,
  statistics: result.output.statistics,
  issues: result.output.checks.flatMap(c => c.issues),
  suggestions: result.output.suggestions
};

console.log(JSON.stringify(report, null, 2));
```

---

## 5. 文献综述 (LiteratureReviewSkill)

### 自动生成文献综述

```typescript
import { LiteratureReviewSkill } from '@assistant/skills';

const reviewSkill = new LiteratureReviewSkill();

const task = {
  id: 'review-001',
  title: '生成文献综述',
  status: TaskStatus.PENDING,
  priority: 3,
  input: {
    papers: [
      {
        id: '1',
        title: 'Deep Learning for Medical Image Analysis',
        authors: ['Litjens, Geert', 'Kooi, Thijs'],
        year: 2017,
        abstract: 'This paper reviews deep learning in medical image analysis...',
        keywords: ['deep learning', 'medical imaging', 'CNN'],
        journal: 'Medical Image Analysis',
        citationCount: 3500
      },
      // ... 更多论文
    ],
    researchQuestion: '深度学习在医学影像分析中的最新进展是什么？',
    focusAreas: ['卷积神经网络', '图像分割', '疾病诊断']
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const result = await reviewSkill.execute(task);

console.log('文献综述报告\n');
console.log('=' .repeat(80));

// 概要统计
console.log('\n📊 概要统计:');
console.log(`  总论文数: ${result.output.summary.totalPapers}`);
console.log(`  时间范围: ${result.output.summary.yearRange.min} - ${result.output.summary.yearRange.max}`);
console.log(`  平均引用数: ${result.output.summary.averageCitations}`);
console.log(`\n  顶级期刊:`);
result.output.summary.topJournals.forEach(j => {
  console.log(`    - ${j.journal}: ${j.count} 篇`);
});

// 识别的主题
console.log('\n🎯 主要主题:');
result.output.themes.forEach((theme, index) => {
  console.log(`\n${index + 1}. ${theme.name}`);
  console.log(`   描述: ${theme.description}`);
  console.log(`   相关论文数: ${theme.papers.length}`);
  console.log(`   主要发现:`);
  theme.keyFindings.forEach(finding => {
    console.log(`     - ${finding}`);
  });
});

// 方法学分析
console.log('\n🔬 方法学分析:');
const methods = result.output.methodology;
console.log(`  定性研究: ${methods.qualitative} 篇`);
console.log(`  定量研究: ${methods.quantitative} 篇`);
console.log(`  混合方法: ${methods.mixed} 篇`);
console.log(`  综述研究: ${methods.review} 篇`);
console.log(`\n  常用方法:`);
methods.commonMethods.forEach(method => {
  console.log(`    - ${method.method}: ${method.count} 次`);
});

// 研究空白
console.log('\n🔍 研究空白:');
result.output.gaps.forEach(gap => {
  console.log(`  • ${gap.description}`);
  console.log(`    机会: ${gap.opportunity}`);
});

// 推荐建议
console.log('\n💡 研究建议:');
result.output.recommendations.forEach((rec, index) => {
  console.log(`  ${index + 1}. ${rec}`);
});
```

---

## 6. 同行评审 (PeerReviewSkill)

### 模拟同行评审

```typescript
import { PeerReviewSkill } from '@assistant/skills';

const reviewSkill = new PeerReviewSkill();

const task = {
  id: 'peer-review-001',
  title: '同行评审',
  status: TaskStatus.PENDING,
  priority: 3,
  input: {
    title: '一种新的深度学习图像分割方法',
    abstract: `
      本文提出了一种新的深度学习方法用于医学图像分割。
      该方法结合了注意力机制和残差连接，在多个数据集上取得了优异性能。
    `,
    content: `
      INTRODUCTION
      医学图像分割是计算机辅助诊断的重要任务...

      METHODS
      我们提出的方法基于U-Net架构...

      RESULTS
      实验结果表明我们的方法优于现有方法...

      DISCUSSION
      本研究的局限性在于样本量较小...
    `,
    section: 'full-paper',
    reviewType: 'comprehensive'
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const result = await reviewSkill.execute(task);

console.log('同行评审报告\n');
console.log('=' .repeat(80));

// 总体评估
const overall = result.output.overall;
console.log('\n📋 总体评估:');
console.log(`  清晰度: ${overall.clarity}/100`);
console.log(`  原创性: ${overall.originality}/100`);
console.log(`  重要性: ${overall.significance}/100`);
console.log(`  方法学: ${overall.methodology}/100`);
console.log(`  呈现: ${overall.presentation}/100`);
console.log(`\n  总结: ${overall.summary}`);

// 评审决策
console.log(`\n🎯 评审决策: ${result.output.decision.toUpperCase()}`);
console.log(`评分: ${result.output.score.total}/${result.output.score.maxScore} (${result.output.score.percentage}%)`);

// 优点
console.log('\n✅ 优点:');
result.output.strengths.forEach(strength => {
  console.log(`  • ${strength}`);
});

// 缺点
console.log('\n❌ 缺点:');
result.output.weaknesses.forEach(weakness => {
  console.log(`  • ${weakness}`);
});

// 分章节评审
console.log('\n📝 分章节评审:');
result.output.sections.forEach(section => {
  console.log(`\n${section.section}章节:`);
  console.log(`  评估: ${section.assessment}`);
  if (section.issues.length > 0) {
    console.log(`  问题:`);
    section.issues.forEach(issue => {
      console.log(`    [${issue.severity}] ${issue.description}`);
    });
  }
  if (section.suggestions.length > 0) {
    console.log(`  建议:`);
    section.suggestions.forEach(suggestion => {
      console.log(`    - ${suggestion}`);
    });
  }
});

// 改进建议
console.log('\n💡 改进建议:');
result.output.recommendations.forEach(rec => {
  console.log(`  [${rec.priority}] ${rec.category}: ${rec.description}`);
  console.log(`    行动: ${rec.action}`);
});
```

---

## 7. 数据分析 (DataAnalysisSkill)

### 生成数据分析计划

```typescript
import { DataAnalysisSkill } from '@assistant/skills';

const analysisSkill = new DataAnalysisSkill();

const task = {
  id: 'analysis-001',
  title: '生成数据分析计划',
  status: TaskStatus.PENDING,
  priority: 2,
  input: {
    dataDescription: '200名患者的临床数据，包含年龄、性别、诊断结果等变量',
    researchQuestions: [
      '不同年龄组的诊断结果是否有显著差异？',
      '性别与诊断结果是否相关？'
    ],
    dataType: 'mixed',
    sampleSize: 200,
    variables: [
      { name: '年龄', type: 'numerical', description: '患者年龄' },
      { name: '性别', type: 'categorical', description: '患者性别' },
      { name: '诊断结果', type: 'categorical', description: '疾病诊断' }
    ],
    analysisGoal: 'comparison'
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const result = await analysisSkill.execute(task);

console.log('数据分析计划\n');
console.log('=' .repeat(80));

// 分析概要
console.log('\n📊 分析概要:');
const summary = result.output.summary;
console.log(`  数据类型: ${summary.dataType}`);
console.log(`  分析目标: ${summary.analysisGoal}`);
console.log(`  推荐方法: ${summary.recommendedApproach}`);
console.log(`  样本量充足: ${summary.sampleSizeAdequate ? '是' : '否'}`);

if (summary.powerAnalysis) {
  const power = summary.powerAnalysis;
  console.log(`\n  功效分析:`);
  console.log(`    当前功效: ${power.currentPower}`);
  console.log(`    推荐样本量: ${power.recommendedSampleSize}`);
  console.log(`    效应量: ${power.effectSize}`);
}

// 数据准备
console.log('\n🔧 数据准备步骤:');
result.output.preparation.steps.forEach(step => {
  console.log(`  [${step.priority}] ${step.step}`);
  console.log(`    ${step.description}`);
});

console.log('\n✓ 质量检查:');
result.output.preparation.qualityChecks.forEach(check => {
  console.log(`  • ${check.check}`);
  console.log(`    方法: ${check.method}`);
  console.log(`    理由: ${check.rationale}`);
});

// 推荐分析
console.log('\n📈 推荐的统计分析:');
result.output.analyses.forEach(analysis => {
  console.log(`\n  ${analysis.name}`);
  console.log(`    描述: ${analysis.description}`);
  console.log(`    假设:`);
  analysis.assumptions.forEach(assumption => {
    console.log(`      - ${assumption}`);
  });
  console.log(`    假设检验: ${analysis.assumptionsCheck}`);
  console.log(`    结果解释: ${analysis.interpretation}`);
  console.log(`    报告格式: ${analysis.reporting}`);
  if (analysis.alternatives.length > 0) {
    console.log(`    替代方法: ${analysis.alternatives.join(', ')}`);
  }
});

// 可视化建议
console.log('\n📊 可视化建议:');
result.output.visualizations.forEach(viz => {
  console.log(`\n  ${viz.type}`);
  console.log(`    用途: ${viz.purpose}`);
  console.log(`    描述: ${viz.description}`);
  console.log(`    最适用于: ${viz.bestFor.join(', ')}`);
  console.log(`    提示:`);
  viz.tips.forEach(tip => {
    console.log(`      - ${tip}`);
  });
});

// 报告指导
console.log('\n📝 报告指导:');
console.log('  必须包含:');
result.output.reporting.essential.forEach(item => {
  console.log(`    • ${item}`);
});
console.log('\n  建议包含:');
result.output.reporting.recommended.forEach(item => {
  console.log(`    • ${item}`);
});
console.log('\n  格式要求:');
result.output.reporting.format.forEach(item => {
  console.log(`    • ${item}`);
});
```

---

## 8. 期刊投稿 (JournalSubmissionSkill)

### 期刊推荐和投稿准备

```typescript
import { JournalSubmissionSkill } from '@assistant/skills';

const submissionSkill = new JournalSubmissionSkill();

const task = {
  id: 'submission-001',
  title: '准备期刊投稿',
  status: TaskStatus.PENDING,
  priority: 3,
  input: {
    title: '基于Transformer的医学影像诊断方法研究',
    abstract: `
      本文提出了一种基于Transformer架构的新型医学影像诊断方法。
      该方法在多个公开数据集上取得了优异的性能...
    `,
    keywords: ['Transformer', '医学影像', '深度学习', '计算机辅助诊断'],
    researchArea: '医学人工智能',
    paperType: 'research-article',
    wordCount: 6500
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const result = await submissionSkill.execute(task);

console.log('期刊投稿准备\n');
console.log('=' .repeat(80));

// 期刊推荐
console.log('\n📰 推荐期刊:');
result.output.recommendations.forEach((journal, index) => {
  console.log(`\n${index + 1}. ${journal.name}`);
  console.log(`   出版社: ${journal.publisher}`);
  console.log(`   匹配度: ${journal.matchScore}/100`);
  if (journal.impactFactor) {
    console.log(`   影响因子: ${journal.impactFactor}`);
  }
  if (journal.acceptanceRate) {
    console.log(`   接收率: ${journal.acceptanceRate}%`);
  }
  console.log(`   审稿周期: ${journal.reviewTime}`);
  console.log(`   开放获取: ${journal.openAccess ? '是' : '否'}`);
  console.log(`   推荐理由: ${journal.reason}`);
  if (journal.url) {
    console.log(`   网址: ${journal.url}`);
  }
});

// Cover Letter
console.log('\n✉️  Cover Letter 模板:');
console.log(result.output.coverLetter.template);

// 投稿清单
console.log('\n✓ 投稿前检查:');
const checklists = result.output.checklists;
console.log('\n  投稿前准备:');
checklists.beforeSubmission.forEach(item => {
  console.log(`    [ ] ${item.item}`);
  if (item.notes) {
    console.log(`        注: ${item.notes}`);
  }
});

console.log('\n  手稿要求:');
checklists.manuscriptRequirements.forEach(item => {
  console.log(`    [ ] ${item.item}`);
});

console.log('\n  格式要求:');
checklists.formatting.forEach(item => {
  console.log(`    [ ] ${item.item}`);
});

console.log('\n  所需文档:');
checklists.documents.forEach(item => {
  console.log(`    [ ] ${item.item}`);
  if (item.notes) {
    console.log(`        注: ${item.notes}`);
  }
});

// 时间线
console.log('\n⏰ 预计时间线:');
const timeline = result.output.timeline;
console.log(`  准备阶段: ${timeline.preparation} 周`);
console.log(`  投稿阶段: ${timeline.submission} 周`);
console.log(`  审稿阶段: ${timeline.review} 周`);
console.log(`  修改阶段: ${timeline.revision} 周`);
console.log(`  发表阶段: ${timeline.publication} 周`);
console.log(`  总计: ${timeline.total} 周 (约 ${Math.round(timeline.total / 4)} 个月)`);

// 投稿技巧
console.log('\n💡 投稿技巧:');
result.output.tips.forEach(tip => {
  const priority = tip.priority === 'high' ? '🔴 重要' : tip.priority === 'medium' ? '🟡 建议' : '🟢 参考';
  console.log(`  ${priority} [${tip.category}]`);
  console.log(`    ${tip.tip}`);
});
```

---

## 🎯 总结

以上示例展示了所有8个核心技能的使用方法。每个技能都：

1. ✅ **遵循统一的接口设计** (ISkill)
2. ✅ **支持输入验证** (Zod schemas)
3. ✅ **提供详细的输出**
4. ✅ **包含错误处理**

### 下一步

- 集成多个技能创建完整工作流
- 使用 Workflow Manager Agent 协调任务
- 扩展自定义技能

查看 [plan1.md](./plan1.md) 了解完整的项目规划和实施状态。
