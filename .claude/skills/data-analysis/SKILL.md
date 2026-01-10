---
name: data-analysis
description: Provide statistical analysis recommendations, visualization suggestions, and reporting guidelines for research data. Use when users ask to analyze data, choose statistical methods, create visualizations, or interpret results.
allowed-tools:
  - Read
  - Bash
  - WebSearch
  - Edit
---

# Data Analysis Skill

Expert in statistical analysis, data visualization, and research data interpretation.

## 何时使用

当用户要求以下任务时使用此技能：
- 选择统计分析方法
- 设计数据分析方案
- 创建数据可视化
- 解释统计结果
- 评估数据分析质量
- 提供分析工具建议

## 能力

### 方法选择指导
- **描述性统计**: 均值、中位数、标准差等
- **推断统计**: t检验、方差分析、回归分析等
- **非参数检验**: 当数据不满足正态分布时
- **高级方法**: 多元统计、机器学习等

### 研究设计建议
- **样本量计算**: 确定足够的样本大小
- **实验设计**: 随机化、对照、重复
- **变量设计**: 自变量、因变量、控制变量
- **数据收集**: 问卷设计、测量工具

### 可视化建议
- **图表选择**: 根据数据类型选择合适的图表
- **设计原则**: 清晰、准确、美观
- **工具推荐**: Python (matplotlib, seaborn)、R (ggplot2)等
- **最佳实践**: 颜色使用、标签、图例

### 结果解释
- **统计显著性**: p值、置信区间
- **效应量**: 实际意义的大小
- **结果报告**: 如何描述统计结果
- **图表解读**: 如何阅读和解释图表

## 输入格式

接受以下输入：
- **researchQuestion** (required): 研究问题
- **dataType** (required): 数据类型描述
- **data** (optional): 实际数据或数据摘要
- **options** (optional): 选项对象
  - `purpose`: string - 分析目的（探索/验证/预测）
  - `software`: string - 使用的软件（Python/R/SPSS等）
  - `expertise`: string - 用户水平（初学者/中级/高级）

## 输出格式

返回包含以下字段的对象：
```json
{
  "recommendedMethods": [
    {
      "method": "独立样本t检验",
      "reason": "比较两组连续数据的均值差异",
      "assumptions": [
        "数据正态分布",
        "方差齐性",
        "样本独立"
      ],
      "alternatives": [
        " Mann-Whitney U检验（非参数替代）"
      ]
    }
  ],

  "analysisPlan": [
    "步骤1: 描述性统计分析",
    "步骤2: 正态性检验",
    "步骤3: t检验",
    "步骤4: 效应量计算",
    "步骤5: 结果可视化"
  ],

  "visualizations": [
    {
      "type": "箱线图",
      "purpose": "展示两组数据分布和异常值",
      "tools": ["Python (seaborn)", "R (ggplot2)"],
      "exampleCode": "import seaborn as sns; sns.boxplot(...)"
    }
  ],

  "sampleSize": {
    "recommended": 64,
    "reason": "达到80%统计功效，效应量0.5",
    "calculator": "使用G*Power软件"
  },

  "reportingGuidelines": {
    "statistics": "t(62) = 2.45, p = .017, d = 0.61",
    "interpretation": "两组差异具有统计显著性（p < .05），效应量为中等",
    "apaFormat": "报告t值、自由度、p值和效应量"
  },

  "assumptionsCheck": [
    {
      "assumption": "正态性",
      "test": "Shapiro-Wilk检验",
      "remedy": "如果违反，使用非参数检验"
    }
  ]
}
```

## 使用示例

### 示例1: 方法选择
```
输入: "比较两组学生的考试成绩"
输出: 推荐t检验 + 假设检验 + 替代方案
```

### 示例2: 完整分析方案
```
输入: "研究教学方法对学习效果的影响" + 数据类型
输出: 从数据收集到结果报告的完整方案
```

### 示例3: 可视化建议
```
输入: "展示时间序列数据的变化趋势"
输出: 推荐折线图 + 设计建议 + 代码示例
```

## 统计方法选择指南

### 比较两组数据
- **连续数据 + 正态分布**: 独立样本t检验
- **连续数据 + 非正态**: Mann-Whitney U检验
- **分类数据**: 卡方检验
- **配对数据**: 配对t检验或Wilcoxon符号秩检验

### 比较多组数据
- **连续数据 + 正态分布**: 单因素方差分析(ANOVA)
- **连续数据 + 非正态**: Kruskal-Wallis检验
- **分类数据**: 卡方检验

### 关系分析
- **两个连续变量**: Pearson相关
- **两个有序变量**: Spearman相关
- **预测关系**: 线性回归

## 可视化选择指南

### 单变量分布
- **连续变量**: 直方图、箱线图、小提琴图
- **分类变量**: 条形图、饼图（慎用）

### 双变量关系
- **连续vs连续**: 散点图、折线图
- **分类vs连续**: 箱线图、小提琴图、条形图
- **分类vs分类**: 堆叠条形图、热图

### 多变量关系
- **3个以上变量**: 散点图矩阵、平行坐标图
- **时间序列**: 折线图、面积图
- **地理数据**: 地图、 choropleth图

## 效应量指南

### Cohen's d
- **0.2**: 小效应
- **0.5**: 中等效应
- **0.8**: 大效应

### R² (决定系数)
- **0.01**: 小效应
- **0.09**: 中等效应
- **0.25**: 大效应

### 解释原则
1. **统计显著性 ≠ 实际意义**: 大样本可能得到显著的微小效应
2. **考虑领域**: 不同领域的效应量标准不同
3. **置信区间**: 报告效应量的置信区间

## 常见错误

### 方法选择错误
- ❌ 对非正态数据使用参数检验
- ❌ 对配对数据使用独立样本检验
- ❌ 忽略方差齐性假设

### 结果解释错误
- ❌ 混淆统计显著性和实际意义
- ❌ 过度解释相关关系（相关≠因果）
- ❌ p值操纵(p-hacking)

### 可视化错误
- ❌ 使用误导性的坐标轴
- ❌ 图表过于复杂
- ❌ 颜色使用不当（如色盲不友好）

## 最佳实践

1. **探索性分析**: 先了解数据特征
2. **假设检验**: 明确零假设和备择假设
3. **效应量**: 总是报告效应量，不只报告p值
4. **可视化**: 一图胜千言，但要用对图
5. **可重复性**: 记录所有分析步骤和代码
6. **稳健性**: 检查结果的稳健性

## 工具推荐

### Python
- **NumPy/Pandas**: 数据处理
- **SciPy**: 统计检验
- **Statsmodels**: 高级统计建模
- **Matplotlib/Seaborn**: 可视化

### R
- **基础R**: 内置统计函数
- **Tidyverse**: 数据处理和可视化
- **ggplot2**: 优雅的可视化
- **lme4**: 混合效应模型

### 其他
- **SPSS**: 用户友好，适合初学者
- **JASP/Jamovi**: 免费开源，支持贝叶斯统计
- **G*Power**: 样本量计算
