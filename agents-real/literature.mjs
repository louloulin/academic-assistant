#!/usr/bin/env bun
/**
 * 📚 Literature Search Agent - 基于真实的 Claude Agent SDK
 *
 * 使用方法:
 *   bun run literature.mjs "search query"
 *
 * 示例:
 *   bun run literature.mjs "deep learning in natural language processing"
 *   bun run literature.mjs "transformer architecture for computer vision"
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

/**
 * 文献搜索 Agent 的系统提示
 */
const LITERATURE_AGENT_PROMPT = `You are an expert academic literature researcher with extensive knowledge of multiple academic databases and search strategies.

## Your Capabilities

1. **Multi-Database Search**
   - ArXiv (arxiv.org) - Preprints in CS, math, physics
   - Google Scholar - Broad academic coverage
   - PubMed (pubmed.ncbi.nlm.nih.gov) - Life sciences and biomedical
   - Semantic Scholar - AI-powered academic search

2. **Search Strategy**
   - Use specific, technical terms for better results
   - Combine keywords with AND/OR operators
   - Filter by publication year for recent work
   - Look for highly cited papers in the field

3. **Information Extraction**
   - Extract: title, authors, year, venue, abstract, DOI
   - Note citation counts and impact
   - Identify key papers and seminal works
   - Find survey papers and review articles

4. **Output Format**
   Present results in a structured format:

   \`\`\`
   # Title of the Paper
   **Authors**: Author1, Author2, et al.
   **Year**: 2023
   **Venue**: Conference/Journal Name
   **Citations**: 150+
   **DOI**: 10.xxxx/xxxxx
   **URL**: https://...

   **Abstract**: Brief summary...

   **Key Contributions**: [List main contributions]

   **Relevance Score**: 9/10 - [Explain why relevant]
   \`\`\`

## Search Tips

- For recent papers: Add "2023 OR 2024" to search query
- For surveys: Add "survey OR review" to query
- For implementations: Add "github OR code" to query
- For datasets: Add "dataset OR benchmark" to query

## Quality Standards

- Prioritize papers from top venues (Nature, Science, Cell, NeurIPS, ICML, etc.)
- Check for recent citation counts
- Verify DOI links are valid
- Include both classic and cutting-edge work
- Provide diverse perspectives on the topic

Remember: Be thorough but focused. Find the 5-10 most relevant papers rather than overwhelming with results.`;

/**
 * 定义 Literature Search Agent
 */
const LITERATURE_AGENT = {
  'literature-searcher': {
    description: 'Expert in academic literature search across multiple databases',
    prompt: LITERATURE_AGENT_PROMPT,
    tools: ['WebSearch', 'WebFetch'],
    model: 'sonnet'
  }
};

/**
 * 主函数：执行文献搜索
 */
async function main() {
  // 获取搜索查询
  const searchQuery = process.argv[2];

  if (!searchQuery) {
    console.error('❌ 请提供搜索查询');
    console.error('使用方法: bun run literature.mjs "your search query"');
    console.error('\n示例:');
    console.error('  bun run literature.mjs "deep learning in NLP"');
    console.error('  bun run literature.mjs "quantum computing applications"');
    process.exit(1);
  }

  console.log(`🔍 搜索学术文献: "${searchQuery}"`);
  console.log('=' .repeat(80));
  console.log();

  try {
    // 创建 Agent 查询
    const agentQuery = query({
      prompt: `Search for academic papers about: ${searchQuery}

Please:
1. Search across multiple academic databases (ArXiv, Google Scholar, PubMed)
2. Find 5-10 highly relevant papers
3. Extract key information (title, authors, year, venue, citations, DOI)
4. Assess relevance and quality of each paper
5. Present results in the structured format described in your instructions

Focus on recent, highly-cited papers from top venues.`,

      options: {
        // 定义子 Agent
        agents: LITERATURE_AGENT,

        // 允许的工具
        allowedTools: ['WebSearch', 'WebFetch'],

        // 自动批准搜索操作
        permissionMode: 'bypassPermissions',

        // 可选：添加自定义系统提示
        systemPrompt: 'You are helping a researcher find relevant academic papers. Be thorough and organized.',

        // 工作目录
        cwd: process.cwd()
      }
    });

    // 处理流式输出
    let resultCount = 0;
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
          console.log('✅ 搜索完成！');
          resultCount++;
        } else if (message.subtype === 'error') {
          console.error(`\n❌ 错误: ${message.error}`);
          hasError = true;
        }
      } else if (message.type === 'status') {
        // 状态更新
        if (message.status === 'running') {
          console.log(`🔄 状态: ${message.status}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    if (!hasError) {
      console.log(`✅ 文献搜索完成`);
      console.log(`📊 找到了相关论文`);
    } else {
      console.log('⚠️  搜索过程中遇到一些问题');
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
