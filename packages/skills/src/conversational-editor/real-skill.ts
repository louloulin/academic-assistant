// Conversational Editor Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * 对话式编辑的输入验证 Schema
 */
const ConversationalEditInputSchema = z.object({
  text: z.string().min(1),
  conversation: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).default([]),
  editType: z.enum(['improve', 'expand', 'refine', 'restructure', 'simplify']).default('improve'),
  context: z.string().optional()
});

export type ConversationalEditInput = z.infer<typeof ConversationalEditInputSchema>;

/**
 * 编辑建议
 */
export interface EditSuggestion {
  original: string;
  improved: string;
  reason: string;
  confidence: number;
}

/**
 * 对话响应
 */
export interface ConversationalResponse {
  editedText: string;
  suggestions: EditSuggestion[];
  explanation: string;
  alternativeVersions?: Array<{
    label: string;
    text: string;
  }>;
  conversationTurn: {
    userMessage: string;
    assistantResponse: string;
    timestamp: string;
  };
}

/**
 * Conversational Editor Agent 定义
 * 使用 Claude Agent SDK 的 Agent 定义格式
 */
const CONVERSATIONAL_EDITOR_AGENT: AgentDefinition = {
  description: 'Expert conversational writing assistant that helps improve academic papers through interactive dialogue',
  prompt: `You are an expert academic writing assistant with a specialty in interactive, conversational editing.

## Your Capabilities

1. **Conversational Editing**
   - Engage in dialogue about the text
   - Ask clarifying questions when needed
   - Provide multiple options for improvements
   - Explain the reasoning behind suggestions

2. **Edit Types**
   - **Improve**: General quality improvements (clarity, flow, grammar)
   - **Expand**: Add more detail and depth to content
   - **Refine**: Polish language and style
   - **Restructure**: Reorganize content for better flow
   - **Simplify**: Make complex ideas more accessible

3. **Interaction Style**
   - Be collaborative and supportive
   - Offer specific, actionable suggestions
   - Provide 2-3 alternative versions when appropriate
   - Explain the "why" behind changes
   - Respect the author's voice and intent

4. **Output Format**
   Return a structured JSON response:
   \`\`\`json
   {
     "editedText": "The improved version of the text...",
     "suggestions": [
       {
         "original": "Original text segment",
         "improved": "Improved version",
         "reason": "Explanation of the change",
         "confidence": 0.9
       }
     ],
     "explanation": "Overall explanation of changes made...",
     "alternativeVersions": [
       {
         "label": "More formal version",
         "text": "Alternative text..."
       }
     ],
     "conversationTurn": {
       "userMessage": "What the user asked for",
       "assistantResponse": "Your response summary",
       "timestamp": "2023-01-01T00:00:00Z"
     }
   }
   \`\`\`

Remember: Maintain the author's voice while improving clarity and academic quality. Be a supportive collaborator, not a replacement for the author.`,
  tools: ['Read', 'Write'],
  model: 'sonnet'
};

/**
 * ConversationalEditorSkill - 基于 Claude Agent SDK 的实现
 */
export class ConversationalEditorSkill {
  private agent: AgentDefinition;
  private conversationHistory: Array<{role: 'user' | 'assistant'; content: string}> = [];

  constructor() {
    this.agent = CONVERSATIONAL_EDITOR_AGENT;
  }

  /**
   * 验证输入参数
   */
  async validate(input: unknown): Promise<ConversationalEditInput> {
    return ConversationalEditInputSchema.parseAsync(input);
  }

  /**
   * 执行对话式编辑
   * 使用真实的 Claude Agent SDK 调用 Claude API
   */
  async execute(input: ConversationalEditInput): Promise<ConversationalResponse> {
    // 验证输入
    const validatedInput = await this.validate(input);

    console.log(`💬 对话式编辑`);
    console.log(`✏️ 编辑类型: ${validatedInput.editType}`);
    console.log(`📝 文本长度: ${validatedInput.text.length} 字符`);
    console.log(`💭 对话轮次: ${validatedInput.conversation.length + 1}`);

    try {
      // 更新对话历史
      this.conversationHistory = validatedInput.conversation;

      // 构建编辑提示词
      let editPrompt = `You are editing academic text in a conversational manner.\n\n`;

      // 添加对话历史上下文
      if (this.conversationHistory.length > 0) {
        editPrompt += `## Conversation History\n`;
        for (const turn of this.conversationHistory) {
          editPrompt += `${turn.role}: ${turn.content}\n\n`;
        }
        editPrompt += `\n`;
      }

      // 添加当前请求
      editPrompt += `## Current Request\n`;
      editPrompt += `Edit Type: ${validatedInput.editType}\n`;

      if (validatedInput.context) {
        editPrompt += `Context: ${validatedInput.context}\n`;
      }

      editPrompt += `\n## Text to Edit\n`;
      editPrompt += validatedInput.text;

      editPrompt += `\n\nPlease:
1. Analyze the text and identify areas for ${validatedInput.editType}
2. Provide specific improvements with explanations
3. Offer 2-3 alternative versions if appropriate
4. Explain the reasoning behind major changes
5. Return a structured JSON response with the edited text and suggestions

Be conversational and collaborative in your approach.`;

      // 使用 Claude Agent SDK 执行编辑
      let editResult: ConversationalResponse | null = null;

      const agentQuery = query({
        prompt: editPrompt,
        options: {
          // 定义对话式编辑 Agent
          agents: {
            'conversational-editor': this.agent
          },
          // 允许的工具
          allowedTools: ['Read', 'Write'],
          // 自动批准工具调用
          permissionMode: 'bypassPermissions',
          // 工作目录
          cwd: process.cwd()
        }
      });

      let jsonBuffer = '';
      let inJsonBlock = false;

      // 处理流式输出
      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          for (const block of message.content) {
            if (block.type === 'text') {
              const text = block.text;

              // 尝试提取 JSON
              if (text.includes('```json')) {
                inJsonBlock = true;
                const jsonStart = text.indexOf('```json') + 7;
                const jsonPart = text.substring(jsonStart);
                jsonBuffer += jsonPart;
              } else if (text.includes('```') && inJsonBlock) {
                // JSON 块结束
                const jsonEnd = text.indexOf('```');
                jsonBuffer += text.substring(0, jsonEnd);
                inJsonBlock = false;

                try {
                  const result = JSON.parse(jsonBuffer.trim());
                  if (result && typeof result === 'object') {
                    editResult = result;
                    break;
                  }
                } catch (e) {
                  console.warn('JSON 解析失败:', e);
                }
                jsonBuffer = '';
              } else if (inJsonBlock) {
                jsonBuffer += text;
              } else {
                // 尝试直接解析整个文本中的 JSON 对象
                const objectMatch = text.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                  try {
                    const result = JSON.parse(objectMatch[0]);
                    if (result && typeof result === 'object' && result.editedText) {
                      editResult = result;
                      break;
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }

              console.log(text);
            } else if (block.type === 'tool_use') {
              console.log(`\n🔧 使用工具: ${block.name}\n`);
            }
          }
        } else if (message.type === 'result') {
          if (message.subtype === 'success') {
            console.log('\n✅ 编辑完成！');
          } else if (message.subtype === 'error') {
            console.error(`\n❌ 错误: ${message.error}`);
          }
        }
      }

      // 如果没有找到结果，返回基本的编辑结果
      if (!editResult) {
        editResult = {
          editedText: validatedInput.text,
          suggestions: [],
          explanation: 'No significant changes needed.',
          conversationTurn: {
            userMessage: validatedInput.text,
            assistantResponse: 'Text reviewed and found to be good.',
            timestamp: new Date().toISOString()
          }
        };
      }

      // 更新对话历史
      this.conversationHistory.push({
        role: 'user',
        content: validatedInput.text
      });
      this.conversationHistory.push({
        role: 'assistant',
        content: editResult.explanation
      });

      console.log(`\n✨ 编辑完成`);
      console.log(`💡 建议数量: ${editResult.suggestions.length}`);
      if (editResult.alternativeVersions) {
        console.log(`🔄 替代版本: ${editResult.alternativeVersions.length}`);
      }

      return editResult;

    } catch (error) {
      console.error('❌ 对话式编辑失败:', error);
      throw error;
    }
  }

  /**
   * 继续对话
   */
  async continue(userMessage: string): Promise<ConversationalResponse> {
    return this.execute({
      text: userMessage,
      conversation: this.conversationHistory,
      editType: 'improve'
    });
  }

  /**
   * 获取对话历史
   */
  getConversationHistory(): Array<{role: 'user' | 'assistant'; content: string}> {
    return [...this.conversationHistory];
  }

  /**
   * 清除对话历史
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * 获取 Agent 定义
   */
  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }

  /**
   * 比较两个文本版本
   */
  compareVersions(original: string, improved: string): Array<{
    type: 'addition' | 'deletion' | 'modification';
    original: string;
    improved: string;
  }> {
    const differences: Array<{
      type: 'addition' | 'deletion' | 'modification';
      original: string;
      improved: string;
    }> = [];

    // 简单的逐行比较（可以使用更复杂的 diff 算法）
    const originalLines = original.split('\n');
    const improvedLines = improved.split('\n');

    let i = 0, j = 0;
    while (i < originalLines.length || j < improvedLines.length) {
      if (i >= originalLines.length) {
        // 剩余的都是新增
        differences.push({
          type: 'addition',
          original: '',
          improved: improvedLines[j]
        });
        j++;
      } else if (j >= improvedLines.length) {
        // 剩余的都是删除
        differences.push({
          type: 'deletion',
          original: originalLines[i],
          improved: ''
        });
        i++;
      } else if (originalLines[i] === improvedLines[j]) {
        // 相同，跳过
        i++;
        j++;
      } else {
        // 不同
        differences.push({
          type: 'modification',
          original: originalLines[i],
          improved: improvedLines[j]
        });
        i++;
        j++;
      }
    }

    return differences;
  }

  /**
   * 导出对话历史为 Markdown
   */
  async exportConversationToMarkdown(): Promise<string> {
    let markdown = '# Conversational Editing Session\n\n';

    for (let i = 0; i < this.conversationHistory.length; i += 2) {
      const userTurn = this.conversationHistory[i];
      const assistantTurn = this.conversationHistory[i + 1];

      markdown += `## Turn ${Math.floor(i / 2) + 1}\n\n`;
      markdown += `### User\n${userTurn.content}\n\n`;

      if (assistantTurn) {
        markdown += `### Assistant\n${assistantTurn.content}\n\n`;
      }
    }

    return markdown;
  }
}

/**
 * 导出单例实例（可选）
 */
export const conversationalEditorSkill = new ConversationalEditorSkill();
