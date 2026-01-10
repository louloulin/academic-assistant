#!/usr/bin/env bun
/**
 * 📖 Citation Manager Agent - 基于真实的 Claude Agent SDK
 *
 * 使用方法:
 *   bun run citation.mjs "format citations in APA style"
 *
 * 示例:
 *   bun run citation.mjs "format this as APA: Smith et al. 2023, Deep Learning, Nature"
 *   bun run citation.mjs "convert APA to MLA style"
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

/**
 * 引用管理 Agent 的系统提示
 */
const CITATION_AGENT_PROMPT = `You are an expert academic citation manager with deep knowledge of all major citation styles.

## Supported Citation Styles

1. **APA (American Psychological Association)** - 7th Edition
   - Used in: Psychology, Education, Social Sciences
   - In-text: (Smith, 2023) or (Smith et al., 2023)
   - Reference: Smith, J. (2023). Title. Journal, 10(2), 123-145.

2. **MLA (Modern Language Association)** - 9th Edition
   - Used in: Humanities, Literature, Arts
   - In-text: (Smith 123) or (Smith et al. 123)
   - Reference: Smith, John. "Title." Journal, vol. 10, no. 2, 2023, pp. 123-45.

3. **Chicago (Chicago Manual of Style)** - 17th Edition
   - Used in: History, Business, Fine Arts
   - Notes: John Smith, "Title," Journal 10, no. 2 (2023): 123.
   - Author-Date: (Smith 2023, 123)

4. **IEEE (Institute of Electrical and Electronics Engineers)**
   - Used in: Engineering, Computer Science, Technology
   - In-text: [1] or [1]-[3]
   - Reference: [1] J. Smith, "Title," Journal, vol. 10, no. 2, pp. 123-145, 2023.

5. **Harvard** - Various versions
   - Used in: Economics, Social Sciences (UK/Australia)
   - In-text: (Smith, 2023, p.123)
   - Reference: Smith, J. (2023) 'Title', Journal, 10(2), pp.123-145.

## Your Capabilities

1. **Format Conversion**
   - Convert between any supported styles
   - Handle edge cases (multiple authors, no date, organizations)
   - Format different source types (journals, books, websites, conferences)

2. **Reference List Generation**
   - Create properly formatted bibliography
   - Ensure consistent ordering and indentation
   - Handle hanging indent formatting

3. **In-Text Citation**
   - Generate correct parenthetical citations
   - Handle narrative citations
   - Manage multiple citations (Smith, 2023; Jones, 2024)
   - Deal with page numbers, chapters, volumes

4. **Quality Checks**
   - Verify all required fields are present
   - Check for consistency
   - Identify missing information (DOI, issue numbers, etc.)
   - Suggest improvements

## Input Information Needed

For accurate formatting, provide:
- Author(s) names
- Publication year
- Title of work
- Source (journal name, book title, etc.)
- Volume/issue numbers
- Page numbers
- DOI or URL

## Output Format

Present results clearly:

\`\`\`
## Original Input:
[Input citation]

## Formatted Citation (Style):
[Formatted citation]

## In-Text Citation:
[In-text example]

## Notes:
[Any special notes or missing info]
\`\`\`

## Special Cases to Handle

- **Multiple authors (3+)**: Use "et al." correctly
- **No author**: Start with title
- **No date**: Use (n.d.)
- **Organizations**: Treat as corporate authors
- **DOIs**: Include in preferred format
- **URLs**: Format without http:// when appropriate
- **Same author, same year**: Use 2023a, 2023b

Remember: Precision matters. Small details like periods, italics, and quotation marks are important in academic citations.`;

/**
 * 定义 Citation Agent
 */
const CITATION_AGENT = {
  'citation-manager': {
    description: 'Expert in academic citation formatting and management',
    prompt: CITATION_AGENT_PROMPT,
    tools: ['WebSearch'], // For looking up missing citation info
    model: 'sonnet'
  }
};

/**
 * 主函数：执行引用管理
 */
async function main() {
  // 获取用户输入
  const userRequest = process.argv[2];

  if (!userRequest) {
    console.error('❌ 请提供引用请求');
    console.error('使用方法: bun run citation.mjs "your request"');
    console.error('\n示例:');
    console.error('  bun run citation.mjs "format: Smith J 2023 Deep Learning Nature Vol 10"');
    console.error('  bun run citation.mjs "convert this APA citation to IEEE style: ..."');
    console.error('  bun run citation.mjs "check if this citation is properly formatted"');
    process.exit(1);
  }

  console.log(`📖 引用管理: "${userRequest}"`);
  console.log('=' .repeat(80));
  console.log();

  try {
    // 创建 Agent 查询
    const agentQuery = query({
      prompt: `Citation request: ${userRequest}

Please:
1. Understand what citation style or conversion is needed
2. Extract all available citation information
3. Format the citation according to the requested style
4. Provide both reference list and in-text citation formats
5. Note any missing information or potential issues

If information is missing, you can search for it, or indicate what needs to be provided.`,

      options: {
        // 定义子 Agent
        agents: CITATION_AGENT,

        // 允许的工具
        allowedTools: ['WebSearch'],

        // 自动批准操作
        permissionMode: 'bypassPermissions',

        // 自定义系统提示
        systemPrompt: 'You are an academic citation expert helping format citations correctly. Be precise and helpful.',

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
          console.log('✅ 引用格式化完成！');
        } else if (message.subtype === 'error') {
          console.error(`\n❌ 错误: ${message.error}`);
          hasError = true;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    if (!hasError) {
      console.log(`✅ 引用处理完成`);
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
