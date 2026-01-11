// Data Analyzer Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * 数据分析的输入验证 Schema
 */
const DataAnalysisInputSchema = z.object({
  dataDescription: z.string().min(10),
  dataSample: z.string().optional(),
  analysisType: z.enum(['descriptive', 'inferential', 'predictive', 'exploratory']).default('descriptive'),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['numeric', 'categorical', 'ordinal', 'binary']),
    description: z.string().optional()
  })).optional(),
  researchQuestion: z.string().optional()
});

export type DataAnalysisInput = z.infer<typeof DataAnalysisInputSchema>;

/**
 * 统计方法推荐
 */
export interface StatisticalMethod {
  name: string;
  description: string;
  assumptions: string[];
  whenToUse: string;
  codeExample?: string;
}

/**
 * 可视化建议
 */
export interface VisualizationSuggestion {
  type: string;
  description: string;
  variables: string[];
  library: string;
  codeExample?: string;
}

/**
 * 分析计划
 */
export interface AnalysisPlan {
  summary: string;
  dataPreparation: string[];
  statisticalTests: StatisticalMethod[];
  visualizations: VisualizationSuggestion[];
  reportingGuidelines: string[];
  sampleSize?: {
    recommended: number;
    current: number;
    adequate: boolean;
  };
}

/**
 * Data Analyzer Agent 定义
 */
const DATA_ANALYZER_AGENT: AgentDefinition = {
  description: 'Expert in statistical analysis, recommending methods, visualizations, and reporting guidelines for research data',
  prompt: `You are an expert statistician and data scientist specializing in academic research.

## Your Capabilities

1. **Statistical Analysis**
   - Recommend appropriate statistical tests
   - Explain assumptions and requirements
   - Provide code examples (R, Python)
   - Interpret results guidelines

2. **Data Types**
   - Numeric (continuous, discrete)
   - Categorical (nominal, ordinal)
   - Binary/dichotomous
   - Time series, text, etc.

3. **Analysis Types**
   - Descriptive: Summarize and describe data
   - Inferential: Draw conclusions about populations
   - Predictive: Build models for prediction
   - Exploratory: Discover patterns and relationships

4. **Output Format**
   Return a structured analysis plan:
   \`\`\`json
   {
     "summary": "Overall analysis approach...",
     "dataPreparation": ["Clean missing values", "Check outliers"],
     "statisticalTests": [
       {
         "name": "Independent t-test",
         "description": "Compare means between two groups",
         "assumptions": ["Normality", "Homogeneity of variance"],
         "whenToUse": "Comparing two independent groups",
         "codeExample": "scipy.stats.ttest_ind(group1, group2)"
       }
     ],
     "visualizations": [
       {
         "type": "Box plot",
         "description": "Show distribution and outliers",
         "variables": ["group", "value"],
         "library": "matplotlib/seaborn",
         "codeExample": "sns.boxplot(x='group', y='value', data=df)"
       }
     ],
     "reportingGuidelines": [
       "Report means and standard deviations",
       "Include effect sizes (Cohen's d)"
     ],
     "sampleSize": {
       "recommended": 64,
       "current": 50,
       "adequate": false
     }
   }
   \`\`\`

Remember: Recommend methods appropriate for the data type and research question. Always consider assumptions.`,
  tools: ['Read', 'Write', 'Bash'],
  model: 'sonnet'
};

/**
 * DataAnalyzerSkill - 基于 Claude Agent SDK 的实现
 */
export class DataAnalyzerSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = DATA_ANALYZER_AGENT;
  }

  async validate(input: unknown): Promise<DataAnalysisInput> {
    return DataAnalysisInputSchema.parseAsync(input);
  }

  async execute(input: DataAnalysisInput): Promise<AnalysisPlan> {
    const validatedInput = await this.validate(input);

    console.log(`📊 数据分析`);
    console.log(`🔍 分析类型: ${validatedInput.analysisType}`);

    try {
      let analysisPrompt = `Provide a comprehensive data analysis plan.\n\n`;
      analysisPrompt += `## Data Description\n${validatedInput.dataDescription}\n`;

      if (validatedInput.dataSample) {
        analysisPrompt += `\n## Data Sample\n${validatedInput.dataSample}\n`;
      }

      if (validatedInput.variables) {
        analysisPrompt += `\n## Variables\n`;
        validatedInput.variables.forEach((v, i) => {
          analysisPrompt += `${i + 1}. ${v.name} (${v.type})${v.description ? ': ' + v.description : ''}\n`;
        });
      }

      analysisPrompt += `\n## Analysis Type\n${validatedInput.analysisType}\n`;

      if (validatedInput.researchQuestion) {
        analysisPrompt += `\n## Research Question\n${validatedInput.researchQuestion}\n`;
      }

      analysisPrompt += `\nPlease:
1. Analyze the data characteristics
2. Recommend appropriate statistical tests
3. Suggest visualizations
4. Provide code examples
5. Give reporting guidelines
6. Assess sample size adequacy
7. Return a structured JSON analysis plan`;

      let analysisResult: AnalysisPlan | null = null;

      const agentQuery = query({
        prompt: analysisPrompt,
        options: {
          agents: {
            'data-analyzer': this.agent
          },
          allowedTools: ['Read', 'Write', 'Bash'],
          permissionMode: 'bypassPermissions',
          cwd: process.cwd()
        }
      });

      let jsonBuffer = '';
      let inJsonBlock = false;

      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          for (const block of message.content) {
            if (block.type === 'text') {
              const text = block.text;

              if (text.includes('```json')) {
                inJsonBlock = true;
                const jsonStart = text.indexOf('```json') + 7;
                jsonBuffer += text.substring(jsonStart);
              } else if (text.includes('```') && inJsonBlock) {
                const jsonEnd = text.indexOf('```');
                jsonBuffer += text.substring(0, jsonEnd);
                inJsonBlock = false;

                try {
                  const result = JSON.parse(jsonBuffer.trim());
                  if (result && typeof result === 'object') {
                    analysisResult = result;
                    break;
                  }
                } catch (e) {
                  console.warn('JSON 解析失败:', e);
                }
                jsonBuffer = '';
              } else if (inJsonBlock) {
                jsonBuffer += text;
              } else {
                const objectMatch = text.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                  try {
                    const result = JSON.parse(objectMatch[0]);
                    if (result && typeof result === 'object' && result.statisticalTests) {
                      analysisResult = result;
                      break;
                    }
                  } catch (e) {
                    // Ignore
                  }
                }
              }

              console.log(text);
            }
          }
        }
      }

      if (!analysisResult) {
        // Fallback: return basic analysis plan
        analysisResult = {
          summary: 'Basic statistical analysis recommended',
          dataPreparation: ['Clean data', 'Handle missing values', 'Check for outliers'],
          statisticalTests: [
            {
              name: 'Descriptive Statistics',
              description: 'Summarize data characteristics',
              assumptions: [],
              whenToUse: 'Initial data exploration'
            }
          ],
          visualizations: [
            {
              type: 'Histogram',
              description: 'Show distribution of numeric variables',
              variables: ['numeric_vars'],
              library: 'matplotlib'
            }
          ],
          reportingGuidelines: ['Report means and standard deviations', 'Include confidence intervals']
        };
      }

      console.log(`\n📊 分析计划完成`);
      console.log(`📈 统计方法: ${analysisResult.statisticalTests.length} 个`);
      console.log(`📊 可视化: ${analysisResult.visualizations.length} 个`);

      return analysisResult;

    } catch (error) {
      console.error('❌ 数据分析失败:', error);
      throw error;
    }
  }

  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }
}

export const dataAnalyzerSkill = new DataAnalyzerSkill();
