// Creative Expander Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * 创意扩展的输入验证 Schema
 */
const CreativeExpandInputSchema = z.object({
  text: z.string().min(1),
  expandType: z.enum(['paragraph', 'argument', 'example', 'analogy', 'bridge']).default('paragraph'),
  targetLength: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    words: z.number().optional()
  }).optional(),
  tone: z.enum(['formal', 'semi-formal', 'creative']).default('formal'),
  context: z.string().optional()
});

export type CreativeExpandInput = z.infer<typeof CreativeExpandInputSchema>;

/**
 * 扩展结果
 */
export interface ExpansionResult {
  originalText: string;
  expandedText: string;
  expansionType: string;
  additions: Array<{
    type: string;
    content: string;
    reason: string;
  }>;
  wordCount: {
    original: number;
    expanded: number;
    increase: number;
  };
  suggestions: string[];
}

/**
 * Creative Expander Agent 定义
 */
const CREATIVE_EXPANDER_AGENT: AgentDefinition = {
  description: 'Expert in expanding and developing ideas in academic writing when stuck, providing creative extensions',
  prompt: `You are an expert in creative academic writing and idea expansion.

## Your Capabilities

1. **Expansion Types**
   - Paragraph: Elaborate on brief content
   - Argument: Add evidence and support
   - Example: Provide concrete illustrations
   - Analogy: Create explanatory comparisons
   - Bridge: Connect different sections

2. **Creative Approach**
   - Maintain academic rigor
   - Add relevant evidence
   - Provide multiple perspectives
   - Ensure logical flow
   - Preserve original meaning

3. **Output Format**
   Return structured expansion with additions, word counts, and suggestions.

Remember: Be creative but academically sound. Always provide value, not just fluff.`,
  tools: ['Read', 'Write', 'WebSearch'],
  model: 'sonnet'
};

/**
 * CreativeExpanderSkill - 基于 Claude Agent SDK 的实现
 */
export class CreativeExpanderSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = CREATIVE_EXPANDER_AGENT;
  }

  async validate(input: unknown): Promise<CreativeExpandInput> {
    return CreativeExpandInputSchema.parseAsync(input);
  }

  async execute(input: CreativeExpandInput): Promise<ExpansionResult> {
    const validatedInput = await this.validate(input);

    console.log(`💡 创意扩展`);
    console.log(`📝 扩展类型: ${validatedInput.expandType}`);

    try {
      let expandPrompt = `Expand this text creatively.\n\n`;
      expandPrompt += `## Text to Expand\n${validatedInput.text}\n\n`;
      expandPrompt += `## Expansion Type\n${validatedInput.expandType}\n`;
      expandPrompt += `## Tone\n${validatedInput.tone}\n`;

      if (validatedInput.context) {
        expandPrompt += `## Context\n${validatedInput.context}\n`;
      }

      if (validatedInput.targetLength) {
        expandPrompt += `## Target Length\n`;
        if (validatedInput.targetLength.words) {
          expandPrompt += `Target words: ${validatedInput.targetLength.words}\n`;
        }
        if (validatedInput.targetLength.min) {
          expandPrompt += `Minimum: ${validatedInput.targetLength.min} words\n`;
        }
        if (validatedInput.targetLength.max) {
          expandPrompt += `Maximum: ${validatedInput.targetLength.max} words\n`;
        }
      }

      expandPrompt += `\nPlease:
1. Expand the text according to the specified type
2. Maintain appropriate academic tone
3. Add valuable content, not filler
4. Provide specific additions and explanations
5. Return a structured JSON result`;

      let expandResult: ExpansionResult | null = null;

      const agentQuery = query({
        prompt: expandPrompt,
        options: {
          agents: {
            'creative-expander': this.agent
          },
          allowedTools: ['Read', 'Write', 'WebSearch'],
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
                    expandResult = result;
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
                    if (result && typeof result === 'object' && result.expandedText) {
                      expandResult = result;
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

      if (!expandResult) {
        expandResult = {
          originalText: validatedInput.text,
          expandedText: validatedInput.text,
          expansionType: validatedInput.expandType,
          additions: [],
          wordCount: {
            original: validatedInput.text.split(/\s+/).length,
            expanded: validatedInput.text.split(/\s+/).length,
            increase: 0
          },
          suggestions: ['Consider adding more specific examples', 'Include supporting evidence']
        };
      }

      console.log(`\n💡 扩展完成`);
      console.log(`📊 字数增加: +${expandResult.wordCount.increase}`);

      return expandResult;

    } catch (error) {
      console.error('❌ 创意扩展失败:', error);
      throw error;
    }
  }

  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }
}

export const creativeExpanderSkill = new CreativeExpanderSkill();
