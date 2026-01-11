---
name: data-analyzer
description: Provide statistical analysis recommendations, visualization suggestions, and reporting guidelines for research data
allowed-tools:
  - WebSearch
  - Read
  - Write
  - Bash
  - MCPTool
  - Skill
context: fork
---

# Data Analyzer Skill

Advanced statistical analysis assistant that helps researchers choose appropriate statistical methods, create visualizations, and interpret results. Integrates with Python's scientific ecosystem for real analysis execution.

## When to Use

Use this skill when the user asks to:
- Choose statistical tests for their data
- Analyze experimental results
- Create data visualizations
- Interpret statistical outputs
- Check assumptions for statistical tests
- Calculate effect sizes
- Generate statistical reports
- Perform power analysis

## Capabilities

### 1. Statistical Test Recommendation
- Analyze data characteristics (type, distribution, sample size)
- Recommend appropriate tests (t-test, ANOVA, chi-square, etc.)
- Check test assumptions
- Suggest alternatives if assumptions violated
- Explain test choices

### 2. Data Visualization
- Recommend plot types based on data
- Generate code for visualizations
- Customize plots for publication
- Create multi-panel figures
- Generate interactive plots

### 3. Descriptive Statistics
- Mean, median, mode, SD, variance
- Confidence intervals
- Percentiles and quartiles
- Outlier detection
- Normality tests

### 4. Inferential Statistics
- t-tests (independent, paired)
- ANOVA (one-way, two-way, repeated measures)
- Non-parametric tests (Mann-Whitney, Kruskal-Wallis)
- Chi-square tests
- Correlation analysis
- Regression analysis

### 5. Effect Size Calculation
- Cohen's d
- Pearson's r
- R-squared
- Odds ratios
- Confidence intervals for effect sizes

### 6. Power Analysis
- Sample size calculation
- Power analysis
- Effect size estimation
- Optimal design recommendations

## Input Format

```typescript
{
  data?: {
    values: number[] | number[][];
    groups?: string[];
    labels?: string[];
    type?: 'continuous' | 'categorical' | 'ordinal';
  };
  dataPath?: string;              // Path to CSV/Excel file
  analysisType?: 'descriptive' | 'inferential' | 'visualization' | 'all';
  test?: string;                  // Specific test to run
  visualizationType?: string;     // Specific visualization
  alpha?: number;                 // Significance level (default: 0.05)
  generateCode?: boolean;         // Generate Python/R code
  exportFormat?: 'json' | 'csv' | 'html';
}
```

## Output Format

```typescript
{
  summary: string;
  recommendations: string[];

  descriptive?: {
    n: number;
    mean: number;
    median: number;
    std: number;
    variance: number;
    min: number;
    max: number;
    quartiles: [number, number, number];
    confidenceInterval: [number, number];
    normalityTest: {
      statistic: number;
      pValue: number;
      isNormal: boolean;
    };
  };

  testResults?: Array<{
    testName: string;
    statistic: number;
    pValue: number;
    significant: boolean;
    effectSize?: number;
    interpretation: string;
  }>;

  visualizations?: Array<{
    type: string;
    description: string;
    code: string;                 // Python/matplotlib code
    suggested: boolean;
  }>;

  assumptions?: {
    test: string;
    assumption: string;
    checked: boolean;
    details: string;
  }[];

  report?: string;                // Formatted statistical report
}
```

## Technical Implementation

### 1. Real Claude Agent SDK Integration

```typescript
class DataAnalyzerService {
  /**
   * Analyze data and recommend tests
   */
  async analyze(options: AnalysisOptions): Promise<AnalysisResult> {
    // Step 1: Load or use provided data
    const data = await this.loadData(options);

    // Step 2: Use Claude to recommend tests
    const recommendations = await this.recommendTests(data, options);

    // Step 3: Run recommended tests
    const results = await this.runTests(data, recommendations);

    // Step 4: Generate visualizations
    const visualizations = await this.generateVisualizations(data, results);

    // Step 5: Create report
    const report = await this.generateReport(results, visualizations);

    return {
      summary: recommendations.summary,
      recommendations: recommendations.tests,
      descriptive: results.descriptive,
      testResults: results.inferential,
      visualizations,
      assumptions: results.assumptions,
      report
    };
  }

  /**
   * Use Claude to recommend statistical tests
   */
  private async recommendTests(data: Data, options: AnalysisOptions): Promise<Recommendations> {
    // Real Claude Agent SDK call - no mocks!
    const response = await query({
      prompt: `Analyze this research data and recommend appropriate statistical tests.

Data characteristics:
- Type: ${data.type}
- Sample size: ${data.n}
- Groups: ${data.groups?.length || 1}
- Variables: ${data.variables?.length || 1}

Research goal: ${options.analysisType || 'comprehensive analysis'}

Recommend:
1. Which descriptive statistics to calculate
2. Which inferential tests are appropriate
3. Assumptions to check
4. Effect sizes to calculate
5. Visualizations to create

Return JSON with detailed recommendations.`,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1
      }
    });

    return this.parseRecommendations(response);
  }
}
```

### 2. Statistical Test Execution

```typescript
class StatisticalTests {
  /**
   * Run t-test
   */
  async tTest(group1: number[], group2: number[], type: 'independent' | 'paired'): Promise<TestResult> {
    const result = await this.executePython(`
import scipy.stats as stats
import numpy as np

group1 = ${JSON.stringify(group1)}
group2 = ${JSON.stringify(group2)}

if '${type}' == 'independent':
    statistic, p_value = stats.ttest_ind(group1, group2)
else:
    statistic, p_value = stats.ttest_rel(group1, group2)

# Calculate effect size (Cohen's d)
from scipy.stats import combine_pvalues
import math

n1, n2 = len(group1), len(group2)
pooled_std = math.sqrt(((n1-1)*np.var(group1, ddof=1) + (n2-1)*np.var(group2, ddof=1)) / (n1+n2-2))
cohens_d = (np.mean(group1) - np.mean(group2)) / pooled_std

print(json.dumps({
  "statistic": float(statistic),
  "pValue": float(p_value),
  "effectSize": float(cohens_d),
  "significant": p_value < 0.05
}))
`);

    return {
      testName: `${type}-t-test`,
      ...JSON.parse(result)
    };
  }

  /**
   * Run ANOVA
   */
  async anova(groups: number[][]): Promise<TestResult> {
    const result = await this.executePython(`
import scipy.stats as stats
from scipy.stats import f_oneway
import numpy as np

groups = ${JSON.stringify(groups)}

statistic, p_value = f_oneway(*groups)

# Calculate effect size (eta-squared)
grand_mean = np.mean([np.mean(g) for g in groups])
ss_between = sum([len(g) * (np.mean(g) - grand_mean)**2 for g in groups])
ss_total = sum([sum((x - grand_mean)**2 for x in g) for g in groups])
eta_squared = ss_between / ss_total

print(json.dumps({
  "statistic": float(statistic),
  "pValue": float(p_value),
  "effectSize": float(eta_squared),
  "significant": p_value < 0.05
}))
`);

    return {
      testName: 'one-way-anova',
      ...JSON.parse(result)
    };
  }
}
```

### 3. Descriptive Statistics

```typescript
class DescriptiveStatistics {
  /**
   * Calculate comprehensive descriptive statistics
   */
  async calculate(data: number[]): Promise<DescriptiveResult> {
    const result = await this.executePython(`
import numpy as np
import scipy.stats as stats
from scipy import stats

data = ${JSON.stringify(data)}

n = len(data)
mean = np.mean(data)
median = np.median(data)
std = np.std(data, ddof=1)
variance = np.var(data, ddof=1)
minimum = np.min(data)
maximum = np.max(data)
quartiles = np.percentile(data, [25, 50, 75])

# Confidence interval
sem = stats.sem(data)
ci = stats.t.interval(0.95, n-1, loc=mean, scale=sem)

# Normality test (Shapiro-Wilk)
statistic, p_value = stats.shapiro(data)

print(json.dumps({
  "n": n,
  "mean": float(mean),
  "median": float(median),
  "std": float(std),
  "variance": float(variance),
  "min": float(minimum),
  "max": float(maximum),
  "quartiles": quartiles.tolist(),
  "confidenceInterval": [float(ci[0]), float(ci[1])],
  "normalityTest": {
    "statistic": float(statistic),
    "pValue": float(p_value),
    "isNormal": p_value > 0.05
  }
}))
`);

    return JSON.parse(result);
  }
}
```

### 4. Visualization Generation

```typescript
class VisualizationGenerator {
  /**
   * Generate visualization code
   */
  async generateVisualization(data: Data, type: string): Promise<Visualization> {
    const codeMap = {
      'histogram': this.generateHistogram(data),
      'boxplot': this.generateBoxPlot(data),
      'scatter': this.generateScatter(data),
      'bar': this.generateBarChart(data),
      'violin': this.generateViolin(data),
      'heatmap': this.generateHeatmap(data),
      'line': this.generateLine(data)
    };

    return {
      type,
      description: this.getDescription(type),
      code: codeMap[type] || this.generateDefault(data),
      suggested: true
    };
  }

  private generateHistogram(data: Data): string {
    return `
import matplotlib.pyplot as plt
import numpy as np

data = ${JSON.stringify(data.values)}

plt.figure(figsize=(10, 6))
plt.hist(data, bins=30, edgecolor='black', alpha=0.7)
plt.xlabel('Value')
plt.ylabel('Frequency')
plt.title('Distribution of Data')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('histogram.png', dpi=300)
`;
  }

  private generateBoxPlot(data: Data): string {
    return `
import matplotlib.pyplot as plt

data = ${JSON.stringify(data.values)}

plt.figure(figsize=(8, 6))
plt.boxplot(data, vert=True, patch_artist=True)
plt.ylabel('Value')
plt.title('Box Plot of Data')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('boxplot.png', dpi=300)
`;
  }
}
```

## Usage Examples

### Example 1: Descriptive Statistics
```typescript
const result = await analyzer.analyze({
  data: {
    values: [23, 25, 28, 30, 32, 33, 35, 36, 38, 40]
  },
  analysisType: 'descriptive'
});

console.log(`Mean: ${result.descriptive.mean}`);
console.log(`SD: ${result.descriptive.std}`);
console.log(`95% CI: ${result.descriptive.confidenceInterval}`);
```

### Example 2: t-test
```typescript
const result = await analyzer.analyze({
  data: {
    values: [
      [23, 25, 28, 30, 32],  // Control group
      [28, 30, 33, 35, 38]   // Treatment group
    ],
    groups: ['control', 'treatment']
  },
  test: 't-test'
});

console.log(`t-statistic: ${result.testResults[0].statistic}`);
console.log(`p-value: ${result.testResults[0].pValue}`);
console.log(`Cohen's d: ${result.testResults[0].effectSize}`);
```

### Example 3: ANOVA
```typescript
const result = await analyzer.analyze({
  data: {
    values: [
      [10, 12, 15, 14, 13],  // Group A
      [18, 20, 19, 21, 20],  // Group B
      [25, 23, 24, 26, 25]   // Group C
    ],
    groups: ['A', 'B', 'C']
  },
  test: 'anova'
});
```

### Example 4: Generate Visualization Code
```typescript
const result = await analyzer.analyze({
  data: {
    values: [1, 2, 2, 3, 3, 3, 4, 4, 5]
  },
  visualizationType: 'histogram',
  generateCode: true
});

console.log(result.visualizations[0].code);
// Prints Python matplotlib code
```

## Statistical Tests Supported

### Parametric Tests
- **Independent t-test**: Two groups, independent samples
- **Paired t-test**: Two groups, paired samples
- **One-way ANOVA**: Three or more groups
- **Two-way ANOVA**: Two independent variables
- **Repeated Measures ANOVA**: Within-subjects design
- **Pearson Correlation**: Linear relationship between continuous variables
- **Linear Regression**: Predict outcome from predictors
- **Multiple Regression**: Multiple predictors

### Non-Parametric Tests
- **Mann-Whitney U**: Alternative to independent t-test
- **Wilcoxon Signed-Rank**: Alternative to paired t-test
- **Kruskal-Wallis**: Alternative to one-way ANOVA
- **Friedman Test**: Alternative to repeated measures ANOVA
- **Spearman Correlation**: Rank-based correlation

### Categorical Tests
- **Chi-square Goodness of Fit**: Test distribution
- **Chi-square Independence**: Test association
- **Fisher's Exact**: Small sample contingency tables

## Visualization Types

1. **Histogram**: Distribution of single variable
2. **Box Plot**: Distribution with outliers
3. **Violin Plot**: Density + box plot
4. **Scatter Plot**: Relationship between two variables
5. **Bar Chart**: Categorical comparisons
6. **Line Plot**: Trends over time
7. **Heatmap**: Correlation matrices
8. **Error Bar Plot**: Means with confidence intervals

## Best Practices

1. **Check Assumptions**: Always verify test assumptions
2. **Report Effect Sizes**: Include effect sizes with p-values
3. **Confidence Intervals**: Report 95% CIs
4. **Visualize Data**: Plot before analyzing
5. **Document Methods**: Describe all statistical procedures
6. **Multiple Comparisons**: Apply corrections when needed
7. **Sample Size**: Ensure adequate power

## Related Skills

- **experiment-runner**: Execute analysis code
- **pdf-analyzer**: Include results in papers
- **citation-manager**: Cite statistical methods
- **conversational-editor**: Natural language analysis interface

## Setup and Configuration

### Python Dependencies
```bash
pip install numpy scipy pandas matplotlib seaborn statsmodels
```

### R Dependencies (alternative)
```r
install.packages(c("ggplot2", "dplyr", "stats", "effectsize"))
```

### Configuration
```typescript
const analyzer = new DataAnalyzerService({
  defaultAlpha: 0.05,
  defaultPower: 0.8,
  preferPython: true,
  generateCode: true
});
```
