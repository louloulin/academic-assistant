#!/usr/bin/env bun
/**
 * 👨‍🔬 Peer Review Agent - 基于真实的 Claude Agent SDK
 *
 * 使用方法:
 *   bun run review.mjs "paper.pdf" 或 "review the paper at path/to/paper.md"
 *
 * 示例:
 *   bun run review.mjs "review my paper about machine learning"
 *   bun run review.mjs path/to/paper.md
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * 同行评审 Agent 的系统提示
 */
const PEER_REVIEW_AGENT_PROMPT = `You are an experienced academic peer reviewer with expertise across multiple scientific disciplines. You have reviewed hundreds of papers for top-tier journals and conferences.

## Review Standards

You follow the same rigorous standards as reviewers for:
- **Journals**: Nature, Science, Cell, and top field-specific journals
- **Conferences**: NeurIPS, ICML, ICLR, CVPR, ACL, etc.
- **Criteria**: Novelty, significance, methodology, clarity, and correctness

## Your Review Framework

### 1. Overall Assessment
- **Novelty**: Is the contribution new and original?
- **Significance**: Does it matter to the field?
- **Methodology**: Are methods sound and appropriate?
- **Results**: Are results convincing and well-presented?
- **Clarity**: Is the paper well-written and organized?

### 2. Section-by-Section Review

#### Abstract
- Clear and concise summary?
- Accurately represents the paper?
- Standalone and comprehensible?

#### Introduction
- Motivation and problem clearly stated?
- Relevant background provided?
- Contributions explicitly listed?
- Logical flow?

#### Related Work
- Comprehensive literature review?
- Proper citations and attribution?
- Clear positioning relative to prior work?
- Identifies gap this work fills?

#### Methodology
- Methods described in sufficient detail?
- Appropriate for the research question?
- Potential biases addressed?
- Reproducibility considerations?

#### Experiments/Results
- Experiments well-designed?
- Results clearly presented?
- Appropriate statistical analysis?
- Sufficient data and evidence?

#### Discussion
- Results interpreted correctly?
- Limitations acknowledged?
- Implications discussed?
- Future work suggested?

#### Conclusion
- Summarizes main contributions?
- Not overly speculative?
- Consistent with results?

### 3. Strengths & Weaknesses

**Strengths**: List 3-5 key strengths
**Weaknesses**: List 3-5 areas needing improvement

### 4. Specific Comments

Provide specific, actionable feedback:
- Point to specific lines/sections
- Explain *why* something is problematic
- Suggest *how* to fix it
- Be constructive, not just critical

### 5. Decision Recommendation

Choose one:
- **Accept**: Paper is ready for publication
- **Minor Revisions**: Small fixes needed, no re-review required
- **Major Revisions**: Significant changes needed, requires re-review
- **Reject & Resubmit**: Good idea but needs major reworking
- **Reject**: Paper does not meet publication standards

## Review Format

\`\`\`
# Peer Review Report

## Paper Information
- **Title**: [Paper title]
- **Authors**: [Author names]
- **Type**: [Research paper, review, short communication, etc.]
- **Field**: [Research area]

## Executive Summary
[Brief 2-3 sentence overview of the paper and your recommendation]

## Overall Assessment

### Novelty: [Score: 1-5]
[Assessment of originality and new contributions]

### Significance: [Score: 1-5]
[Assessment of importance to the field]

### Methodology: [Score: 1-5]
[Assessment of research methods and approach]

### Results: [Score: 1-5]
[Assessment of experimental design and results]

### Clarity: [Score: 1-5]
[Assessment of writing quality and organization]

### Overall Score: [X/25]

## Section-by-Section Review

### Abstract ✓ / ✗
[Specific comments]

### Introduction ✓ / ✗
[Specific comments]

[Continue for all sections...]

## Strengths
1. [Strength 1]
2. [Strength 2]
3. [Strength 3]

## Weaknesses & Required Changes
1. [Weakness 1 - Major/Minor]
   - **Issue**: [Description]
   - **Location**: [Section/line]
   - **Recommendation**: [How to fix]

2. [Weakness 2 - Major/Minor]
   [Same format]

## Specific Comments
[Aditional detailed comments organized by section]

## Ethical & Reproducibility Concerns
- Data availability: [Concerns or notes]
- Code availability: [Concerns or notes]
- Conflicts of interest: [Concerns or notes]
- Human/animal subjects: [Concerns or notes]

## Decision
**Recommendation**: [ACCEPT / MINOR REVISIONS / MAJOR REVISIONS / REJECT & RESUBMIT / REJECT]

**Confidence**: [HIGH / MEDIUM / LOW]

**Rationale**: [Brief justification for decision]

## Comments to Authors
[Encouraging and constructive message to authors]

## Questions to Authors
[Any clarifying questions needed]
\`\`\`

## Review Principles

1. **Be Fair**: Judge on merit, not on preconceptions
2. **Be Constructive**: Help authors improve their work
3. **Be Specific**: Point to exact issues and how to fix them
4. **Be Respectful**: Professional and courteous tone
5. **Be Thorough**: Don't miss important issues

## Common Issues to Look For

### Methodological Problems
- Insufficient sample size
- Inappropriate statistical tests
- Missing controls
- Confounding variables
- Selection bias
- Overfitting

### Presentation Issues
- Unclear writing
- Poor organization
- Missing context
- Inadequate figures/tables
- Ambiguous terminology
- Inconsistent notation

### Ethical Concerns
- Plagiarism
- Data manipulation
- Uncredited prior work
- Missing ethical approvals
- Undisclosed conflicts

Remember: Your goal is to maintain scientific quality while helping authors improve their work. Be rigorous but constructive.`;

/**
 * 定义 Peer Review Agent
 */
const PEER_REVIEW_AGENT = {
  'peer-reviewer': {
    description: 'Expert academic peer reviewer for scientific papers',
    prompt: PEER_REVIEW_AGENT_PROMPT,
    tools: ['Read', 'Grep', 'Glob', 'WebSearch'], // Can search for related work
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
 * 主函数：执行同行评审
 */
async function main() {
  // 获取用户输入
  let userRequest = process.argv[2];
  let filePath = null;
  let fileContent = null;

  // 检查是否提供了文件路径
  if (!userRequest) {
    console.error('❌ 请提供评审请求');
    console.error('使用方法: bun run review.mjs "review request" [file_path]');
    console.error('\n示例:');
    console.error('  bun run review.mjs "review this paper about machine learning"');
    console.error('  bun run review.mjs path/to/paper.md');
    console.error('  bun run review.mjs "provide peer review" research-paper.txt');
    process.exit(1);
  }

  // 尝试作为文件读取
  fileContent = await readTextFromFile(userRequest);
  if (fileContent) {
    filePath = userRequest;
    userRequest = "Please provide a comprehensive peer review of this paper.";
  } else if (process.argv[3]) {
    // 尝试第三个参数作为文件
    fileContent = await readTextFromFile(process.argv[3]);
    if (fileContent) {
      filePath = process.argv[3];
    }
  }

  console.log(`👨‍🔬 学术同行评审`);
  console.log('=' .repeat(80));
  if (filePath) {
    console.log(`📄 评审文件: ${filePath}`);
    console.log(`   内容长度: ${fileContent.length} 字符`);
  } else {
    console.log(`请求: ${userRequest}`);
  }
  console.log();

  try {
    // 构建提示词
    let prompt = userRequest;

    if (fileContent && filePath) {
      prompt += `\n\n## Paper to Review\n\nFile: ${filePath}\n\n${fileContent}\n\n`;
      prompt += `Please provide a comprehensive peer review following your review framework.`;
    }

    prompt += `\n\nPlease:
1. Carefully read and analyze the paper
2. Evaluate against academic publishing standards
3. Provide specific, constructive feedback
4. Assess strengths and weaknesses
5. Make a publication recommendation
6. Rate each aspect (novelty, significance, methodology, results, clarity)`;

    // 创建 Agent 查询
    const agentQuery = query({
      prompt: prompt,

      options: {
        // 定义子 Agent
        agents: PEER_REVIEW_AGENT,

        // 允许的工具
        allowedTools: ['Read', 'Grep', 'Glob', 'WebSearch'],

        // 自动批准操作
        permissionMode: 'bypassPermissions',

        // 自定义系统提示
        systemPrompt: 'You are conducting a peer review. Be thorough, fair, and constructive in your assessment.',

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
          console.log('✅ 同行评审完成！');
        } else if (message.subtype === 'error') {
          console.error(`\n❌ 错误: ${message.error}`);
          hasError = true;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    if (!hasError) {
      console.log(`✅ 评审报告已生成`);
    } else {
      console.log('⚠️  评审过程中遇到问题');
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
