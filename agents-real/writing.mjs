#!/usr/bin/env bun
/**
 * ✍️ Academic Writing Agent - 基于真实的 Claude Agent SDK
 *
 * 使用方法:
 *   bun run writing.mjs "help me write..."
 *
 * 示例:
 *   bun run writing.mjs "write an abstract for a paper about AI in healthcare"
 *   bun run writing.mjs "improve the clarity of this paragraph: ..."
 *   bun run writing.mjs "check my writing for academic tone"
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * 学术写作 Agent 的系统提示
 */
const WRITING_AGENT_PROMPT = `You are an expert academic writing coach with decades of experience helping researchers improve their scholarly writing.

## Your Expertise

1. **Academic Style & Tone**
   - Formal, objective, and precise language
   - Appropriate use of technical terminology
   - Clear and concise expression
   - Active vs. passive voice balance
   - Avoid colloquialisms and ambiguous terms

2. **Structure & Organization**
   - IMRaD format (Introduction, Methods, Results, and Discussion)
   - Logical flow and coherence
   - Effective paragraph structure
   - Transition words and phrases
   - Section headings and subheadings

3. **Grammar & Mechanics**
   - Subject-verb agreement
   - Proper use of articles (a, an, the)
   - Punctuation in academic writing
   - Citations and references
   - Number and unit formatting

4. **Clarity & Readability**
   - Sentence length and complexity
   - Avoiding jargon overload
   - Explaining complex concepts
   - Active vs. passive constructions
   - Eliminating wordiness

## Writing Improvements You Can Provide

### Content Generation
- Write abstracts, introductions, conclusions
- Develop literature reviews
- Create methodology sections
- Draft discussion points
- Generate hypotheses

### Text Improvement
- Enhance clarity and conciseness
- Improve flow and coherence
- Strengthen arguments
- Refine vocabulary
- Fix grammatical issues

### Structure Analysis
- Evaluate overall organization
- Suggest restructuring
- Improve paragraph transitions
- Enhance logical flow
- Balance section lengths

### Quality Assessment
- Assess academic tone
- Check for bias
- Evaluate argument strength
- Identify weak areas
- Suggest improvements

## Feedback Format

When providing feedback on existing text:

\`\`\`
## Overall Assessment
[General impression and main issues]

## Specific Issues

### 1. Clarity
- Issue: [description]
- Suggestion: [improvement]
- Revised: [example]

### 2. Grammar/Mechanics
[Similar format for other categories]

### 3. Style & Tone
[Similar format for other categories]

## Revised Version
[Full text with improvements applied]

## Key Changes Made
- [List of major improvements]
\`\`\`

## Academic Writing Best Practices

1. **Be Specific**
   - Use precise terminology
   - Provide concrete examples
   - Avoid vague statements

2. **Be Concise**
   - Eliminate unnecessary words
   - Prefer simple over complex
   - Remove redundancy

3. **Be Objective**
   - Avoid emotional language
   - Present balanced view
   - Acknowledge limitations

4. **Be Precise**
   - Define technical terms
   - Use numbers and data
   - Specify conditions

5. **Be Organized**
   - Follow standard structure
   - Use clear headings
   - Maintain logical flow

## Special Considerations

- **Non-native English speakers**: Be patient and explain corrections
- **Different disciplines**: Adapt to field-specific conventions
- **Document types**: Adjust for papers, theses, grants, etc.
- **Target venue**: Consider journal/conference requirements

Remember: Your goal is to help researchers communicate their work effectively and professionally. Be constructive, specific, and educational in your feedback.`;

/**
 * 定义 Writing Agent
 */
const WRITING_AGENT = {
  'academic-writer': {
    description: 'Expert in academic writing, editing, and coaching',
    prompt: WRITING_AGENT_PROMPT,
    tools: ['Read', 'Edit', 'WebSearch', 'Grep', 'Glob'],
    model: 'sonnet'
  }
};

/**
 * 从文件读取文本
 */
async function readTextFromFile(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return await readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ 读取文件失败: ${error.message}`);
    return null;
  }
}

/**
 * 主函数：执行写作辅助
 */
async function main() {
  // 获取用户输入
  const userRequest = process.argv[2];
  const fileFlag = process.argv[3];

  if (!userRequest) {
    console.error('❌ 请提供写作请求');
    console.error('使用方法: bun run writing.mjs "your request" [file_path]');
    console.error('\n示例:');
    console.error('  bun run writing.mjs "write an abstract about AI in healthcare"');
    console.error('  bun run writing.mjs "improve this text" path/to/text.txt');
    console.error('  bun run writing.mjs "check for academic tone" my-paper.md');
    process.exit(1);
  }

  console.log(`✍️ 学术写作助手`);
  console.log('=' .repeat(80));
  console.log(`请求: ${userRequest}`);
  console.log();

  // 如果指定了文件，读取文件内容
  let fileContent = null;
  let fileName = null;
  if (fileFlag && !fileFlag.startsWith('-')) {
    fileContent = await readTextFromFile(fileFlag);
    if (fileContent) {
      fileName = fileFlag;
      console.log(`📄 已读取文件: ${fileName}`);
      console.log(`   内容长度: ${fileContent.length} 字符`);
      console.log();
    }
  }

  try {
    // 构建提示词
    let prompt = `Writing assistance request: ${userRequest}`;

    if (fileContent && fileName) {
      prompt += `\n\nFile content from ${fileName}:\n\n${fileContent}\n\n`;
      prompt += `Please analyze the provided text and ${userRequest.toLowerCase()}`;
    }

    prompt += `\n\nPlease:
1. Understand the writing task or text improvement needed
2. Provide specific, actionable feedback
3. Show examples and revisions where appropriate
4. Explain the reasoning behind your suggestions
5. Consider academic writing standards in the relevant field`;

    // 创建 Agent 查询
    const agentQuery = query({
      prompt: prompt,

      options: {
        // 定义子 Agent
        agents: WRITING_AGENT,

        // 允许的工具
        allowedTools: ['Read', 'Edit', 'WebSearch', 'Grep', 'Glob'],

        // 自动批准操作
        permissionMode: 'bypassPermissions',

        // 自定义系统提示
        systemPrompt: 'You are an expert academic writing coach. Provide constructive, specific feedback and help improve scholarly writing.',

        // 工作目录
        cwd: process.cwd()
      }
    });

    // 处理流式输出
    let hasError = false;

    for await (const message of agentQuery) {
      // 处理不同类型的消息
      if (message.type === 'assistant') {
        // Claude 的回复
        for (const block of message.content) {
          if (block.type === 'text') {
            console.log(block.text);
          } else if (block.type === 'tool_use') {
            console.log(`\n🔧 使用工具: ${block.name}\n`);
          }
        }
      } else if (message.type === 'result') {
        // 最终结果
        if (message.subtype === 'success') {
          console.log('\n' + '='.repeat(80));
          console.log('✅ 写作辅助完成！');
        } else if (message.subtype === 'error') {
          console.error(`\n❌ 错误: ${message.error}`);
          hasError = true;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    if (!hasError) {
      console.log(`✅ 写作建议已提供`);
    } else {
      console.log('⚠️  处理过程中遇到问题');
    }

  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    if (error.message.includes('API key')) {
      console.error('\n💡 请确保已设置 ANTHROPIC_API_KEY 环境变量');
      console.error('   export ANTHROPIC_API_KEY=your_api_key_here');
    }
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error);
