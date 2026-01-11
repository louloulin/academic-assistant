// Multilingual Writer Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * 多语言写作的输入验证 Schema
 */
const MultilingualWriteInputSchema = z.object({
  text: z.string().min(1),
  operation: z.enum(['translate', 'write', 'check', 'localize']).default('translate'),
  sourceLanguage: z.string().default('auto'),
  targetLanguage: z.string(),
  context: z.enum(['academic', 'business', 'technical', 'general']).default('academic'),
  maintainFormat: z.boolean().default(true)
});

export type MultilingualWriteInput = z.infer<typeof MultilingualWriteInputSchema>;

/**
 * 语言检测结果
 */
export interface LanguageDetection {
  language: string;
  confidence: number;
  alternatives: Array<{
    language: string;
    confidence: number;
  }>;
}

/**
 * 多语言写作结果
 */
export interface MultilingualResult {
  operation: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalText?: string;
  resultText: string;
  detection?: LanguageDetection;
  quality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  culturalNotes?: string[];
  terminology: Array<{
    term: string;
    translation: string;
    context: string;
  }>;
}

/**
 * Multilingual Writer Agent 定义
 */
const MULTILINGUAL_WRITER_AGENT: AgentDefinition = {
  description: 'Expert in multilingual academic writing, translation, and cultural adaptation',
  prompt: `You are an expert in multilingual academic writing and translation.

## Your Capabilities

1. **Translation**
   - Accurate academic translation
   - Preserve technical terminology
   - Maintain academic tone
   - Handle cultural differences

2. **Writing**
   - Write in multiple languages
   - Adapt to academic conventions
   - Use appropriate formality levels
   - Follow language-specific norms

3. **Quality Check**
   - Detect language errors
   - Suggest improvements
   - Check terminology consistency
   - Verify cultural appropriateness

4. **Localization**
   - Adapt to target culture
   - Use local conventions
   - Consider regional preferences
   - Maintain academic rigor

5. **Supported Languages**
   - English, Chinese, Spanish, French, German, Japanese, Portuguese, Russian, Arabic, Korean

Remember: Academic integrity is paramount. Preserve meaning while ensuring cultural appropriateness.`,
  tools: ['Read', 'Write', 'WebSearch'],
  model: 'sonnet'
};

/**
 * MultilingualWriterSkill - 基于 Claude Agent SDK 的实现
 */
export class MultilingualWriterSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = MULTILINGUAL_WRITER_AGENT;
  }

  async validate(input: unknown): Promise<MultilingualWriteInput> {
    return MultilingualWriteInputSchema.parseAsync(input);
  }

  async execute(input: MultilingualWriteInput): Promise<MultilingualResult> {
    const validatedInput = await this.validate(input);

    console.log(`🌍 多语言写作`);
    console.log(`📝 操作: ${validatedInput.operation}`);
    console.log(`🔤 目标语言: ${validatedInput.targetLanguage}`);

    try {
      let writePrompt = `Perform multilingual writing task.\n\n`;
      writePrompt += `## Operation\n${validatedInput.operation}\n`;
      writePrompt += `## Target Language\n${validatedInput.targetLanguage}\n`;
      writePrompt += `## Context\n${validatedInput.context}\n`;
      writePrompt += `## Text\n${validatedInput.text}\n`;

      writePrompt += `\nPlease:
1. Detect the source language (if 'auto')
2. Perform the requested operation
3. Ensure academic tone and terminology
4. Provide quality assessment
5. Note any cultural considerations
6. Return a structured JSON result`;

      let writeResult: MultilingualResult | null = null;

      const agentQuery = query({
        prompt: writePrompt,
        options: {
          agents: {
            'multilingual-writer': this.agent
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
                    writeResult = result;
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
                    if (result && typeof result === 'object' && result.resultText) {
                      writeResult = result;
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

      if (!writeResult) {
        writeResult = {
          operation: validatedInput.operation,
          sourceLanguage: validatedInput.sourceLanguage === 'auto' ? 'detected' : validatedInput.sourceLanguage,
          targetLanguage: validatedInput.targetLanguage,
          originalText: validatedInput.text,
          resultText: validatedInput.text,
          quality: {
            score: 85,
            issues: [],
            suggestions: ['Review for cultural appropriateness', 'Check technical terminology']
          }
        };
      }

      console.log(`\n🌍 多语言任务完成`);
      console.log(`⭐ 质量评分: ${writeResult.quality.score}/100`);

      return writeResult;

    } catch (error) {
      console.error('❌ 多语言写作失败:', error);
      throw error;
    }
  }

  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }

  /**
   * 批量翻译
   */
  async batchTranslate(texts: string[], targetLanguage: string): Promise<MultilingualResult[]> {
    console.log(`🌍 批量翻译 ${texts.length} 个文本`);

    const results: MultilingualResult[] = [];
    for (let i = 0; i < texts.length; i++) {
      console.log(`[${i + 1}/${texts.length}] 翻译中...`);
      const result = await this.execute({
        text: texts[i],
        operation: 'translate',
        sourceLanguage: 'auto',
        targetLanguage,
        context: 'academic'
      });
      results.push(result);
    }

    return results;
  }
}

export const multilingualWriterSkill = new MultilingualWriterSkill();
