// Data Analysis Skill
import type { ISkill, Task, SkillConfig } from '@assistant/core';
import { validateInput } from '@assistant/utils';
import { z } from 'zod';
import { log } from '@assistant/utils';
import { SkillType, TaskStatus } from '@assistant/core';

const DataAnalysisInputSchema = z.object({
  dataDescription: z.string().min(10),
  researchQuestions: z.array(z.string()).min(1),
  dataType: z.enum([
    'numerical',
    'categorical',
    'time-series',
    'text',
    'mixed'
  ]).default('mixed'),
  sampleSize: z.number().optional(),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['numerical', 'categorical', 'ordinal']),
    description: z.string().optional()
  })).optional(),
  analysisGoal: z.enum([
    'description',
    'comparison',
    'relationship',
    'prediction',
    'classification'
  ]).default('description')
});

export type DataAnalysisInput = z.infer<typeof DataAnalysisInputSchema>;

export interface DataAnalysisPlan {
  summary: AnalysisSummary;
  preparation: DataPreparation;
  analyses: RecommendedAnalysis[];
  visualizations: Visualization[];
  reporting: ReportingGuidelines;
}

export interface AnalysisSummary {
  dataType: string;
  analysisGoal: string;
  recommendedApproach: string;
  sampleSizeAdequate: boolean;
  powerAnalysis?: PowerAnalysis;
}

export interface PowerAnalysis {
  currentPower: number;
  recommendedSampleSize: number;
  effectSize: string;
}

export interface DataPreparation {
  steps: PreparationStep[];
  qualityChecks: QualityCheck[];
}

export interface PreparationStep {
  step: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
}

export interface QualityCheck {
  check: string;
  method: string;
  rationale: string;
}

export interface RecommendedAnalysis {
  name: string;
  description: string;
  assumptions: string[];
  assumptionsCheck: string;
  interpretation: string;
  reporting: string;
  alternatives: string[];
}

export interface Visualization {
  type: string;
  purpose: string;
  description: string;
  bestFor: string[];
  tips: string[];
}

export interface ReportingGuidelines {
  essential: string[];
  recommended: string[];
  format: string[];
}

const skillConfig: SkillConfig = {
  id: 'data-analysis',
  type: SkillType.DATA_ANALYSIS,
  name: 'Data Analysis',
  description: 'Provide statistical analysis recommendations and guidance',
  version: '1.0.0',
  enabled: true
};

export class DataAnalysisSkill implements ISkill {
  readonly id = skillConfig.id;
  readonly name = skillConfig.name;
  readonly description = skillConfig.description;
  readonly version = skillConfig.version;
  readonly config = skillConfig;

  canHandle<T>(task: Task<T>): boolean {
    return task.assignedAgent === undefined ||
      (task.requiredSkills !== undefined && task.requiredSkills.includes(this.id));
  }

  async validate<T>(input: T): Promise<boolean> {
    try {
      await validateInput(DataAnalysisInputSchema, input);
      return true;
    } catch {
      return false;
    }
  }

  async execute<T, U>(task: Task<T, U>): Promise<Task<T, U>> {
    const validatedInput = await validateInput(DataAnalysisInputSchema, task.input as any);

    log.info(`Generating data analysis plan for ${validatedInput.analysisGoal}`);

    const plan = await this.generateAnalysisPlan(validatedInput);

    log.info(`Analysis plan generated - ${plan.analyses.length} analyses recommended`);

    return {
      ...task,
      output: plan as U,
      status: TaskStatus.COMPLETED,
      updatedAt: new Date()
    };
  }

  private async generateAnalysisPlan(input: DataAnalysisInput): Promise<DataAnalysisPlan> {
    const { dataDescription, researchQuestions, dataType, sampleSize, variables, analysisGoal } = input;

    // Generate summary
    const summary = this.generateSummary(dataType, analysisGoal, sampleSize);

    // Generate preparation steps
    const preparation = this.generatePreparation(dataType, variables);

    // Generate recommended analyses
    const analyses = this.generateAnalyses(dataType, analysisGoal, variables);

    // Generate visualization recommendations
    const visualizations = this.generateVisualizations(dataType, analysisGoal);

    // Generate reporting guidelines
    const reporting = this.generateReporting(analysisGoal);

    return {
      summary,
      preparation,
      analyses,
      visualizations,
      reporting
    };
  }

  private generateSummary(dataType: string, analysisGoal: string, sampleSize?: number): AnalysisSummary {
    const recommendedApproach = this.getRecommendedApproach(dataType, analysisGoal);
    const sampleSizeAdequate = sampleSize ? this.assessSampleSize(sampleSize, dataType) : true;

    const summary: AnalysisSummary = {
      dataType,
      analysisGoal,
      recommendedApproach,
      sampleSizeAdequate
    };

    if (sampleSize && !sampleSizeAdequate) {
      summary.powerAnalysis = this.calculatePowerAnalysis(sampleSize);
    }

    return summary;
  }

  private getRecommendedApproach(dataType: string, analysisGoal: string): string {
    const approaches: Record<string, Record<string, string>> = {
      numerical: {
        description: 'Descriptive statistics and data visualization',
        comparison: 'Parametric (t-tests, ANOVA) or non-parametric tests',
        relationship: 'Correlation analysis (Pearson/Spearman)',
        prediction: 'Regression analysis (linear, multiple)',
        classification: 'Discriminant analysis or logistic regression'
      },
      categorical: {
        description: 'Frequency tables and bar charts',
        comparison: 'Chi-square tests or Fisher exact test',
        relationship: 'Chi-square test of independence',
        prediction: 'Logistic regression',
        classification: 'Decision trees or naive Bayes'
      },
      'time-series': {
        description: 'Time plots and decomposition',
        comparison: 'Before-after analysis',
        relationship: 'Cross-correlation analysis',
        prediction: 'ARIMA or exponential smoothing',
        classification: 'Time-series classification'
      },
      text: {
        description: 'Word frequency and text mining',
        comparison: 'Sentiment analysis comparison',
        relationship: 'Topic modeling',
        prediction: 'Text classification',
        classification: 'Naive Bayes or SVM'
      },
      mixed: {
        description: 'Multivariate descriptive statistics',
        comparison: 'Mixed models or MANOVA',
        relationship: 'Mixed correlation analysis',
        prediction: 'Multiple regression or SEM',
        classification: 'Mixed classification methods'
      }
    };

    return approaches[dataType]?.[analysisGoal] || 'Consult with statistician for complex analysis';
  }

  private assessSampleSize(sampleSize: number, dataType: string): boolean {
    const minSizes: Record<string, number> = {
      numerical: 30,
      categorical: 50,
      'time-series': 20,
      text: 100,
      mixed: 50
    };

    return sampleSize >= (minSizes[dataType] || 30);
  }

  private calculatePowerAnalysis(currentSampleSize: number): PowerAnalysis {
    // Simplified power analysis
    const recommendedSize = Math.max(100, Math.round(currentSampleSize * 1.5));
    const currentPower = Math.min(0.8, (currentSampleSize / recommendedSize) * 0.8);

    return {
      currentPower: Math.round(currentPower * 100) / 100,
      recommendedSampleSize: recommendedSize,
      effectSize: currentSampleSize < 50 ? 'large' : currentSampleSize < 100 ? 'medium' : 'small'
    };
  }

  private generatePreparation(dataType: string, variables?: any[]): DataPreparation {
    const steps: PreparationStep[] = [
      {
        step: 'Data Cleaning',
        description: 'Handle missing values, outliers, and inconsistencies',
        priority: 'essential'
      },
      {
        step: 'Data Transformation',
        description: 'Normalize, standardize, or transform variables as needed',
        priority: 'recommended'
      },
      {
        step: 'Variable Selection',
        description: 'Identify and select relevant variables for analysis',
        priority: 'essential'
      }
    ];

    const qualityChecks: QualityCheck[] = [
      {
        check: 'Missing Data Analysis',
        method: 'Examine patterns of missingness (MCAR, MAR, MNAR)',
        rationale: 'Determines appropriate imputation strategy'
      },
      {
        check: 'Outlier Detection',
        method: 'Visual (boxplots) and statistical (z-scores, IQR)',
        rationale: 'Outliers can significantly influence results'
      },
      {
        check: 'Assumption Testing',
        method: 'Normality, homoscedasticity, linearity checks',
        rationale: 'Ensures appropriate statistical tests are used'
      },
      {
        check: 'Reliability Analysis',
        method: 'Cronbach\'s alpha for multi-item scales',
        rationale: 'Assesses internal consistency of measures'
      }
    ];

    if (dataType === 'numerical' || dataType === 'mixed') {
      steps.push({
        step: 'Normality Assessment',
        description: 'Check if data follows normal distribution',
        priority: 'recommended'
      });
    }

    return { steps, qualityChecks };
  }

  private generateAnalyses(dataType: string, analysisGoal: string, variables?: any[]): RecommendedAnalysis[] {
    const analyses: RecommendedAnalysis[] = [];

    // Descriptive statistics (always included)
    analyses.push({
      name: 'Descriptive Statistics',
      description: 'Summarize data using measures of central tendency and dispersion',
      assumptions: ['Random sampling', 'Independent observations'],
      assumptionsCheck: 'Examine sampling method and study design',
      interpretation: 'Report means, standard deviations, ranges for numerical data; frequencies and percentages for categorical data',
      reporting: 'Use tables for clear presentation of descriptive statistics',
      alternatives: ['Non-parametric equivalents if assumptions violated']
    });

    // Goal-specific analyses
    switch (analysisGoal) {
      case 'description':
        analyses.push({
          name: 'Exploratory Data Analysis',
          description: 'Visual exploration and pattern identification',
          assumptions: [],
          assumptionsCheck: 'None required for exploratory analysis',
          interpretation: 'Identify patterns, trends, and relationships in data',
          reporting: 'Use multiple visualization methods',
          alternatives: ['Confirmatory analysis for hypothesis testing']
        });
        break;

      case 'comparison':
        if (dataType === 'numerical') {
          analyses.push({
            name: 't-test / ANOVA',
            description: 'Compare means between two or more groups',
            assumptions: ['Normal distribution', 'Homogeneity of variance', 'Independent observations'],
            assumptionsCheck: 'Shapiro-Wilk test (normality), Levene\'s test (homogeneity)',
            interpretation: 'Report t/F-statistic, degrees of freedom, p-value, effect size (Cohen\'s d, eta squared)',
            reporting: 'Include means ± SD for each group, test statistics, p-values, confidence intervals',
            alternatives: ['Mann-Whitney U test', 'Kruskal-Wallis test']
          });
        } else if (dataType === 'categorical') {
          analyses.push({
            name: 'Chi-square Test',
            description: 'Test association between categorical variables',
            assumptions: ['Independent observations', 'Expected frequencies ≥ 5'],
            assumptionsCheck: 'Examine cell counts in contingency table',
            interpretation: 'Report chi-square statistic, degrees of freedom, p-value, effect size (Cramer\'s V)',
            reporting: 'Include contingency table with observed and expected frequencies',
            alternatives: ['Fisher\'s exact test (small samples)']
          });
        }
        break;

      case 'relationship':
        analyses.push({
          name: 'Correlation Analysis',
          description: 'Examine relationships between variables',
          assumptions: ['Linear relationship', 'Bivariate normality (for Pearson)'],
          assumptionsCheck: 'Scatter plots, normality tests',
          interpretation: 'Report correlation coefficient (r), p-value, confidence interval',
          reporting: 'Include correlation matrix or scatterplots with regression lines',
          alternatives: ['Spearman rank correlation (non-parametric)', 'Partial correlation']
        });
        break;

      case 'prediction':
        analyses.push({
          name: 'Regression Analysis',
          description: 'Predict outcome variable(s) from predictor variables',
          assumptions: ['Linearity', 'Independence', 'Homoscedasticity', 'Normality of residuals'],
          assumptionsCheck: 'Residual plots, Durbin-Watson test, VIF for multicollinearity',
          interpretation: 'Report coefficients, standard errors, t-statistics, p-values, R², adjusted R²',
          reporting: 'Include regression equation, coefficients table, model fit statistics',
          alternatives: ['Robust regression', 'Non-linear regression']
        });
        break;

      case 'classification':
        analyses.push({
          name: 'Classification Analysis',
          description: 'Classify cases into groups based on predictors',
          assumptions: ['Dependent variable is categorical', 'Independent observations'],
          assumptionsCheck: 'Verify variable types and study design',
          interpretation: 'Report classification accuracy, sensitivity, specificity, confusion matrix',
          reporting: 'Include classification table, error rates, variable importance',
          alternatives: ['Logistic regression', 'Decision trees', 'SVM']
        });
        break;
    }

    return analyses;
  }

  private generateVisualizations(dataType: string, analysisGoal: string): Visualization[] {
    const visualizations: Visualization[] = [];

    // Common visualizations for all types
    visualizations.push({
      type: 'Histogram',
      purpose: 'Show distribution of numerical variable',
      description: 'Bar chart showing frequency distribution',
      bestFor: ['numerical', 'description'],
      tips: ['Use appropriate bin sizes', 'Add normal curve for comparison']
    });

    visualizations.push({
      type: 'Box Plot',
      purpose: 'Display distribution and identify outliers',
      description: 'Shows median, quartiles, and outliers',
      bestFor: ['numerical', 'comparison'],
      tips: ['Include individual data points for small samples', 'Use for group comparisons']
    });

    if (dataType === 'numerical' || dataType === 'mixed') {
      visualizations.push({
        type: 'Scatter Plot',
        purpose: 'Show relationship between two numerical variables',
        description: 'Points representing individual cases',
        bestFor: ['numerical', 'relationship'],
        tips: ['Add trend line or regression line', 'Consider adding confidence intervals']
      });
    }

    if (analysisGoal === 'comparison') {
      visualizations.push({
        type: 'Bar Chart with Error Bars',
        purpose: 'Compare groups or conditions',
        description: 'Bar heights represent means, error bars show variability',
        bestFor: ['categorical', 'numerical', 'comparison'],
        tips: ['Use SD or SEM for error bars', 'Clearly label what error bars represent']
      });
    }

    if (dataType === 'time-series') {
      visualizations.push({
        type: 'Line Chart',
        purpose: 'Show trends over time',
        description: 'Line connecting data points in temporal order',
        bestFor: ['time-series', 'prediction'],
        tips: ['Mark individual data points', 'Use different lines for multiple series']
      });
    }

    visualizations.push({
      type: 'Heatmap',
      purpose: 'Display correlation matrix or categorical relationships',
      description: 'Color-coded grid showing values',
      bestFor: ['mixed', 'relationship'],
      tips: ['Include color legend', 'Use perceptually uniform color schemes']
    });

    return visualizations;
  }

  private generateReporting(analysisGoal: string): ReportingGuidelines {
    const essential: string[] = [
      'State research questions and hypotheses clearly',
      'Describe data collection methods and sample characteristics',
      'Report all analyses performed, including preliminary analyses',
      'Provide exact p-values rather than just significance levels',
      'Include effect sizes and confidence intervals',
      'Report descriptive statistics for all variables'
    ];

    const recommended: string[] = [
      'Include data visualizations to support findings',
      'Provide tables for comprehensive results presentation',
      'Report statistical assumptions and diagnostic tests',
      'Discuss practical significance in addition to statistical significance',
      'Include effect size interpretation',
      'Provide confidence intervals for key estimates'
    ];

    const format: string[] = [
      'Use APA 7th edition format for statistics reporting',
      'Report statistics to 2 decimal places',
      'Include degrees of freedom for test statistics',
      'Italicize statistical symbols (p, r, t, F)',
      'Spaces around mathematical symbols (=, <, >)',
      'Report exact p-values for p < .001 (e.g., p = .002)'
    ];

    return { essential, recommended, format };
  }
}
