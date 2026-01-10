#!/usr/bin/env bun
/**
 * 🎓 学术助手 - 基于 Claude Agent SDK 的真实实现
 * 整合到 Bun Workspaces 架构中
 *
 * 使用方法:
 *   bun run academic-assistant-real.mjs "your request"
 *
 * 示例:
 *   bun run academic-assistant-real.mjs "search papers about deep learning"
 *   bun run academic-assistant-real.mjs "format this citation in APA"
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

/**
 * 定义所有学术相关的 Agents
 * 使用官方 Claude Agent SDK 的 AgentDefinition 格式
 */
const ACADEMIC_AGENTS = {
  // 文献搜索专家
  'literature-searcher': {
    description: 'Expert in searching academic literature across multiple databases (ArXiv, Google Scholar, PubMed)',
    prompt: `You are an expert academic literature researcher.

## Your Capabilities
1. Search ArXiv, Google Scholar, PubMed, Semantic Scholar
2. Extract paper metadata (title, authors, year, venue, citations, DOI)
3. Assess relevance and quality
4. Return structured JSON results

## Output Format
Return papers as JSON array:
[
  {
    "title": "Paper Title",
    "authors": ["Author1", "Author2"],
    "year": 2023,
    "venue": "Conference/Journal",
    "citationCount": 150,
    "doi": "10.xxxx/xxxxx",
    "url": "https://...",
    "relevanceScore": 9.5
  }
]

Focus on recent, highly-cited papers from top venues.`,
    tools: ['WebSearch', 'WebFetch'],
    model: 'sonnet'
  },

  // 引用管理专家
  'citation-manager': {
    description: 'Expert in academic citation formatting (APA, MLA, Chicago, IEEE, Harvard)',
    prompt: `You are an expert in academic citation management.

## Supported Styles
- APA 7th Edition
- MLA 9th Edition
- Chicago 17th Edition
- IEEE
- Harvard

## Output Format
Return JSON:
{
  "referenceList": ["Smith, J. (2023). Title..."],
  "inTextCitations": {"Smith2023": "(Smith, 2023)"},
  "style": "apa"
}

Precision matters in citation formatting.`,
    tools: ['WebSearch'],
    model: 'sonnet'
  },

  // 学术写作专家
  'academic-writer': {
    description: 'Expert in academic writing, editing, and coaching',
    prompt: `You are an expert academic writing coach.

## Your Expertise
1. Academic style & tone
2. IMRaD structure
3. Grammar & mechanics
4. Clarity & readability

## Writing Improvements
- Content generation (abstracts, introductions)
- Text improvement (clarity, conciseness)
- Structure analysis
- Quality assessment

## Feedback Format
Provide specific, actionable feedback with examples.

Follow IMRaD structure and academic writing best practices.`,
    tools: ['Read', 'Edit', 'WebSearch', 'Grep', 'Glob'],
    model: 'sonnet'
  },

  // 同行评审专家
  'peer-reviewer': {
    description: 'Expert academic peer reviewer for scientific papers',
    prompt: `You are an experienced peer reviewer for top-tier journals.

## Review Framework
Evaluate on:
1. Novelty (1-5)
2. Significance (1-5)
3. Methodology (1-5)
4. Results (1-5)
5. Clarity (1-5)

## Decision Types
- Accept
- Minor Revisions
- Major Revisions
- Reject & Resubmit
- Reject

## Review Format
# Peer Review Report
## Overall Assessment
## Section-by-Section Review
## Strengths
## Weaknesses & Required Changes
## Decision

Be thorough, fair, and constructive.`,
    tools: ['Read', 'Grep', 'Glob', 'WebSearch'],
    model: 'sonnet'
  },

  // 数据分析专家
  'data-analyst': {
    description: 'Expert in statistical analysis and data visualization for research',
    prompt: `You are an expert in research data analysis.

## Your Expertise
1. Statistical method recommendations
2. Data visualization approaches
3. Result interpretation
4. Reproducibility guidance

## Recommendations
Consider research questions, data types, and field-specific standards.

Suggest appropriate tests, visualizations, and reporting guidelines.`,
    tools: ['Read', 'Edit', 'Bash', 'WebSearch'],
    model: 'sonnet'
  },

  // 期刊投稿专家
  'journal-advisor': {
    description: 'Expert in journal selection and academic publishing',
    prompt: `You are an expert in academic publishing and journal selection.

## Your Expertise
1. Journal recommendations based on scope and impact
2. Cover letter generation
3. Submission checklists
4. Publishing strategies

## Recommendations
Consider:
- Impact factors
- Journal scope
- Target audience
- Review timeline
- Acceptance rates

Provide actionable submission guidance.`,
    tools: ['WebSearch', 'WebFetch'],
    model: 'sonnet'
  }
};

/**
 * 任务类型识别和 Agent 分发
 */
function identifyTaskAndAgent(userRequest) {
  const request = userRequest.toLowerCase();

  // 文献搜索任务
  if (request.includes('search') && (request.includes('paper') || request.includes('literature') || request.includes('article'))) {
    return { agent: 'literature-searcher', task: 'literature search' };
  }
  if (request.includes('find') && (request.includes('paper') || request.includes('article'))) {
    return { agent: 'literature-searcher', task: 'literature search' };
  }

  // 引用格式化任务
  if (request.includes('citation') || request.includes('reference') || request.includes('cite')) {
    return { agent: 'citation-manager', task: 'citation formatting' };
  }
  if (request.includes('apa') || request.includes('mla') || request.includes('chicago') || request.includes('ieee') || request.includes('harvard')) {
    return { agent: 'citation-manager', task: 'citation formatting' };
  }

  // 写作辅助任务
  if (request.includes('write') || request.includes('improve') || request.includes('edit') || request.includes('rewrite')) {
    return { agent: 'academic-writer', task: 'writing assistance' };
  }
  if (request.includes('abstract') || request.includes('introduction') || request.includes('conclusion')) {
    return { agent: 'academic-writer', task: 'writing assistance' };
  }

  // 同行评审任务
  if (request.includes('review') || request.includes('evaluate') || request.includes('assess')) {
    return { agent: 'peer-reviewer', task: 'peer review' };
  }

  // 数据分析任务
  if (request.includes('data') || request.includes('statistic') || request.includes('analysis') || request.includes('visuali')) {
    return { agent: 'data-analyst', task: 'data analysis' };
  }

  // 期刊投稿任务
  if (request.includes('journal') || request.includes('submit') || request.includes('publish') || request.includes('cover letter')) {
    return { agent: 'journal-advisor', task: 'journal submission' };
  }

  // 默认：通用学术助手
  return { agent: null, task: 'general academic assistance' };
}

/**
 * 主函数
 */
async function main() {
  const userRequest = process.argv[2];

  if (!userRequest) {
    console.log('🎓 学术助手 - 基于 Claude Agent SDK');
    console.log('='.repeat(80));
    console.log('\n可用的专业 Agent:');
    console.log('  📚 literature-searcher - 文献搜索');
    console.log('  📖 citation-manager    - 引用管理');
    console.log('  ✍️  academic-writer     - 写作辅助');
    console.log('  👨‍🔬 peer-reviewer       - 同行评审');
    console.log('  📊 data-analyst         - 数据分析');
    console.log('  🎯 journal-advisor      - 期刊投稿');
    console.log('\n使用方法:');
    console.log('  bun run academic-assistant-real.mjs "your request"');
    console.log('\n示例:');
    console.log('  bun run academic-assistant-real.mjs "search papers about machine learning"');
    console.log('  bun run academic-assistant-real.mjs "format this citation in APA: ..."');
    console.log('  bun run academic-assistant-real.mjs "write an abstract about AI"');
    console.log('  bun run academic-assistant-real.mjs "review this paper"');
    console.log('\n' + '='.repeat(80));
    process.exit(0);
  }

  // 识别任务类型
  const { agent, task } = identifyTaskAndAgent(userRequest);

  console.log(`🎓 学术助手 - 真实 Claude Agent SDK 实现`);
  console.log('='.repeat(80));
  console.log(`📝 请求: ${userRequest}`);
  console.log(`🎯 任务类型: ${task}`);
  if (agent) {
    console.log(`🤖 指定 Agent: ${agent}`);
  } else {
    console.log(`🤖 模式: 多 Agent 协作`);
  }
  console.log('='.repeat(80));
  console.log();

  try {
    // 构建系统提示
    let systemPrompt = `You are an academic assistant helping a researcher. Your task is: ${task}.`;
    if (agent) {
      systemPrompt += ` Use the ${agent} agent for this task.`;
    } else {
      systemPrompt += ` Coordinate with multiple specialized agents as needed to provide comprehensive assistance.`;
    }

    // 创建 Agent 查询
    const agentQuery = query({
      prompt: userRequest,

      options: {
        // 定义所有可用的专业 Agents
        agents: ACADEMIC_AGENTS,

        // 允许所有基础工具
        allowedTools: [
          'WebSearch',
          'WebFetch',
          'Read',
          'Edit',
          'Grep',
          'Glob',
          'Bash'
        ],

        // 自动批准操作
        permissionMode: 'bypassPermissions',

        // 自定义系统提示
        systemPrompt: systemPrompt,

        // 工作目录
        cwd: process.cwd()
      }
    });

    // 处理流式输出
    let hasError = false;
    let agentUsed = agent || 'multiple agents';

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
          console.log('✅ 任务完成！');
          console.log(`🤖 使用: ${agentUsed}`);
        } else if (message.subtype === 'error') {
          console.error(`\n❌ 错误: ${message.error}`);
          hasError = true;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    if (!hasError) {
      console.log(`✅ 学术助手完成请求`);
      console.log(`💡 提示: 这是基于真实 Claude Agent SDK 的实现`);
    } else {
      console.log('⚠️  执行过程中遇到问题');
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
