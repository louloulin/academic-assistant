#!/usr/bin/env bun
/**
 * 🎓 Academic Assistant - 统一的学术助手入口
 * 基于 Claude Agent SDK 的多 Agent 协作系统
 *
 * 使用方法:
 *   bun run academic-assistant.mjs "your request"
 *
 * 示例:
 *   bun run academic-assistant.mjs "search papers about deep learning"
 *   bun run academic-assistant.mjs "format this citation in APA style: ..."
 *   bun run academic-assistant.mjs "help me write an abstract"
 *   bun run academic-assistant.mjs "review my paper"
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

/**
 * 定义所有学术相关的 Agents
 */
const ACADEMIC_AGENTS = {
  // 文献搜索专家
  'literature-searcher': {
    description: 'Expert in searching academic literature across multiple databases (ArXiv, Google Scholar, PubMed)',
    prompt: `You are an expert academic literature researcher. Your role is to:
1. Search across academic databases for relevant papers
2. Extract key information (title, authors, year, venue, citations, DOI)
3. Assess relevance and quality
4. Present results in structured format

Focus on recent, highly-cited papers from top venues.`,
    tools: ['WebSearch', 'WebFetch'],
    model: 'sonnet'
  },

  // 引用管理专家
  'citation-manager': {
    description: 'Expert in academic citation formatting (APA, MLA, Chicago, IEEE, Harvard)',
    prompt: `You are an expert in academic citation management. Your role is to:
1. Format citations in any requested style (APA, MLA, Chicago, IEEE, Harvard)
2. Convert between citation styles
3. Generate reference lists and in-text citations
4. Check citation accuracy and completeness

Supported styles: APA 7th, MLA 9th, Chicago 17th, IEEE, Harvard`,
    tools: ['WebSearch'],
    model: 'sonnet'
  },

  // 学术写作专家
  'academic-writer': {
    description: 'Expert in academic writing, editing, and coaching',
    prompt: `You are an expert academic writing coach. Your role is to:
1. Help generate academic content (abstracts, introductions, etc.)
2. Improve clarity, conciseness, and flow
3. Ensure appropriate academic tone and style
4. Check grammar and mechanics
5. Provide constructive feedback

Follow IMRaD structure and academic writing best practices.`,
    tools: ['Read', 'Edit', 'WebSearch', 'Grep', 'Glob'],
    model: 'sonnet'
  },

  // 同行评审专家
  'peer-reviewer': {
    description: 'Expert academic peer reviewer for scientific papers',
    prompt: `You are an experienced peer reviewer for top-tier journals and conferences. Your role is to:
1. Evaluate papers on novelty, significance, methodology, results, and clarity
2. Provide specific, constructive feedback
3. Identify strengths and weaknesses
4. Make publication recommendations (accept/revise/reject)
5. Follow peer review standards and ethics

Rate each aspect 1-5 and provide detailed justification.`,
    tools: ['Read', 'Grep', 'Glob', 'WebSearch'],
    model: 'sonnet'
  },

  // 数据分析专家
  'data-analyst': {
    description: 'Expert in statistical analysis and data visualization for research',
    prompt: `You are an expert in research data analysis. Your role is to:
1. Recommend appropriate statistical methods
2. Suggest data visualization approaches
3. Help interpret results
4. Check statistical assumptions
5. Guide reproducible analysis practices

Consider research questions, data types, and field-specific standards.`,
    tools: ['Read', 'Edit', 'Bash', 'WebSearch'],
    model: 'sonnet'
  },

  // 期刊投稿专家
  'journal-advisor': {
    description: 'Expert in journal selection and academic publishing',
    prompt: `You are an expert in academic publishing and journal selection. Your role is to:
1. Recommend appropriate journals based on research area and impact
2. Help write cover letters
3. Provide submission checklists
4. Advise on publishing strategies
5. Explain journal requirements and policies

Consider impact factors, scope, audience, and timelines.`,
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
  if (request.includes('find') && (request.includes('paper') || request.includes('article') || request.includes('reference'))) {
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
  if (request.includes('grammar') || request.includes('clarity') || request.includes('tone')) {
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
    console.log('🎓 Academic Assistant - 基于 Claude Agent SDK');
    console.log('='.repeat(80));
    console.log('\n可用的专业 Agent:');
    console.log('  📚 literature-searcher - 文献搜索');
    console.log('  📖 citation-manager    - 引用管理');
    console.log('  ✍️  academic-writer     - 写作辅助');
    console.log('  👨‍🔬 peer-reviewer       - 同行评审');
    console.log('  📊 data-analyst         - 数据分析');
    console.log('  🎯 journal-advisor      - 期刊投稿');
    console.log('\n使用方法:');
    console.log('  bun run academic-assistant.mjs "your request"');
    console.log('\n示例:');
    console.log('  bun run academic-assistant.mjs "search papers about deep learning"');
    console.log('  bun run academic-assistant.mjs "format citation in APA"');
    console.log('  bun run academic-assistant.mjs "write an abstract about AI"');
    console.log('  bun run academic-assistant.mjs "review my paper"');
    console.log('\n' + '='.repeat(80));
    process.exit(0);
  }

  // 识别任务类型
  const { agent, task } = identifyTaskAndAgent(userRequest);

  console.log(`🎓 学术助手`);
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
          console.log(`✅ 任务完成！`);
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
