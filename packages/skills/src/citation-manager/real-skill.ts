// Citation Manager Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * 引用样式枚举
 */
export enum CitationStyle {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  IEEE = 'ieee',
  HARVARD = 'harvard'
}

/**
 * 引用输入验证 Schema
 */
const CitationInputSchema = z.object({
  papers: z.array(z.object({
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number(),
    venue: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().optional()
  })),
  style: z.nativeEnum(CitationStyle).default(CitationStyle.APA),
  includeInText: z.boolean().default(true)
});

export type CitationInput = z.infer<typeof CitationInputSchema>;

/**
 * 格式化的引用结果
 */
export interface FormattedCitations {
  referenceList: string[];
  inTextCitations: Record<string, string>;
  style: CitationStyle;
}

/**
 * Citation Manager Agent 定义
 */
const CITATION_MANAGER_AGENT: AgentDefinition = {
  description: 'Expert in academic citation formatting and management (APA, MLA, Chicago, IEEE, Harvard)',
  prompt: `You are an expert academic citation manager with deep knowledge of all major citation styles.

## Supported Citation Styles

1. **APA (American Psychological Association)** - 7th Edition
   - Used in: Psychology, Education, Social Sciences
   - In-text: (Smith, 2023) or (Smith et al., 2023)
   - Reference: Smith, J. (2023). Title. *Journal*, 10*(2), 123-145.

2. **MLA (Modern Language Association)** - 9th Edition
   - Used in: Humanities, Literature, Arts
   - In-text: (Smith 123) or (Smith et al. 123)
   - Reference: Smith, John. "Title." *Journal*, vol. 10, no. 2, 2023, pp. 123-45.

3. **Chicago (Chicago Manual of Style)** - 17th Edition
   - Used in: History, Business, Fine Arts
   - Notes: John Smith, "Title," *Journal* 10, no. 2 (2023): 123.
   - Author-Date: (Smith 2023, 123)

4. **IEEE (Institute of Electrical and Electronics Engineers)**
   - Used in: Engineering, Computer Science, Technology
   - In-text: [1] or [1]-[3]
   - Reference: [1] J. Smith, "Title," *Journal*, vol. 10, no. 2, pp. 123-145, 2023.

5. **Harvard**
   - Used in: Economics, Social Sciences (UK/Australia)
   - In-text: (Smith, 2023, p.123)
   - Reference: Smith, J. (2023) 'Title', *Journal*, 10(2), pp.123-145.

## Output Format

Return a JSON object:
\`\`\`json
{
  "referenceList": [
    "Smith, J. (2023). Title. *Journal*, 10(2), 123-145.",
    "Doe, J. et al. (2024). Another Title. *Proceedings*, 123-130."
  ],
  "inTextCitations": {
    "Smith2023": "(Smith, 2023)",
    "Doe2024": "(Doe et al., 2024)"
  },
  "style": "apa"
}
\`\`\`

Remember: Precision matters. Small details like periods, italics, and quotation marks are important.`,
  tools: ['WebSearch'], // For looking up missing citation info
  model: 'sonnet'
};

/**
 * CitationManagerSkill - 基于 Claude Agent SDK 的实现
 */
export class CitationManagerSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = CITATION_MANAGER_AGENT;
  }

  /**
   * 验证输入参数
   */
  async validate(input: unknown): Promise<CitationInput> {
    return CitationInputSchema.parseAsync(input);
  }

  /**
   * 执行引用格式化
   */
  async execute(input: CitationInput): Promise<FormattedCitations> {
    const validatedInput = await this.validate(input);

    console.log(`📖 格式化引用`);
    console.log(`📝 样式: ${validatedInput.style.toUpperCase()}`);
    console.log(`📄 论文数量: ${validatedInput.papers.length}`);

    try {
      // 构建提示词
      let formatPrompt = `Format the following citations in ${validatedInput.style.toUpperCase()} style:\n\n`;

      validatedInput.papers.forEach((paper, index) => {
        formatPrompt += `${index + 1}. ${JSON.stringify(paper)}\n`;
      });

      formatPrompt += `\nPlease:
1. Format all references according to ${validatedInput.style.toUpperCase()} style
2. Generate in-text citations for each paper
3. Return the result as JSON with referenceList and inTextCitations fields`;

      // 执行格式化
      const agentQuery = query({
        prompt: formatPrompt,
        options: {
          agents: {
            'citation-manager': this.agent
          },
          allowedTools: ['WebSearch'],
          permissionMode: 'bypassPermissions',
          cwd: process.cwd()
        }
      });

      let result: FormattedCitations | null = null;

      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          for (const block of message.content) {
            if (block.type === 'text') {
              console.log(block.text);

              // 尝试提取 JSON 结果
              const jsonMatch = block.text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[0]);
                  if (parsed.referenceList && Array.isArray(parsed.referenceList)) {
                    result = {
                      referenceList: parsed.referenceList,
                      inTextCitations: parsed.inTextCitations || {},
                      style: validatedInput.style
                    };
                  }
                } catch (e) {
                  console.warn('JSON 解析失败:', e);
                }
              }
            }
          }
        } else if (message.type === 'result' && message.subtype === 'success') {
          console.log('\n✅ 引用格式化完成！');
        }
      }

      if (!result) {
        throw new Error('无法解析引用格式化结果');
      }

      console.log(`\n📊 格式化 ${result.referenceList.length} 条引用`);
      return result;

    } catch (error) {
      console.error('❌ 引用格式化失败:', error);
      throw error;
    }
  }

  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }
}

export const citationManagerSkill = new CitationManagerSkill();
