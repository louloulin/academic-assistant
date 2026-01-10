/**
 * Orchestrator Service
 *
 * 任务编排服务
 * 负责任务分解、Agent路由、结果综合
 * 充分利用Claude Agent SDK，不使用mocks
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import type { IMCPManagerService } from '../mcp/mcp-manager.service';
import { getAgentDefinition } from '@assistant/core';
import { Logger, globalMetrics } from '@assistant/infrastructure';

/**
 * 论文信息结构
 */
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  year: number;
  venue?: string;
  url: string;
  pdfUrl?: string;
  citationCount?: number;
  doi?: string;
  relevanceScore?: number;
  source?: string;
}

/**
 * 文献综述结果
 */
export interface LiteratureReviewResult {
  papers: Paper[];
  analyses: string[];
  gaps: string[];
  synthesis: string;
  metadata: {
    totalPapers: number;
    analysisCount: number;
    gapCount: number;
    duration: number;
  };
}

/**
 * 编排器服务类
 */
export class OrchestratorService {
  private logger = new Logger('Orchestrator');

  constructor(
    private mcpManager: IMCPManagerService  // 依赖接口，实现低耦合
  ) {}

  /**
   * 执行文献综述流程
   * Sequential模式: 线性执行步骤
   * @param topic 研究主题
   * @param options 选项
   * @returns 文献综述结果
   */
  async conductLiteratureReview(
    topic: string,
    options: { maxPapers?: number; analyzeTop?: number } = {}
  ): Promise<LiteratureReviewResult> {
    const { maxPapers = 50, analyzeTop = 20 } = options;
    const startTime = Date.now();

    this.logger.info('Starting literature review', { topic, maxPapers, analyzeTop });

    try {
      // Step 1: 搜索论文
      this.logger.info('Step 1: Searching papers');
      const papers = await this.executeSearchStep(topic, maxPapers);
      this.logger.info(`Found ${papers.length} papers`);

      // Step 2: 分析论文(并行处理前N篇)
      this.logger.info(`Step 2: Analyzing top ${Math.min(papers.length, analyzeTop)} papers`);
      const analyses = await this.executeAnalysisStep(papers.slice(0, Math.min(papers.length, analyzeTop)));
      this.logger.info(`Analyzed ${analyses.length} papers`);

      // Step 3: 识别研究空白
      this.logger.info('Step 3: Identifying research gaps');
      const gaps = await this.executeGapIdentificationStep(topic, papers, analyses);
      this.logger.info(`Identified ${gaps.length} research gaps`);

      // Step 4: 综合发现
      this.logger.info('Step 4: Synthesizing findings');
      const synthesis = await this.executeSynthesisStep(topic, papers, analyses, gaps);
      this.logger.info('Synthesis complete');

      const duration = Date.now() - startTime;
      this.logger.info('Literature review completed', { duration });

      return {
        papers,
        analyses,
        gaps,
        synthesis,
        metadata: {
          totalPapers: papers.length,
          analysisCount: analyses.length,
          gapCount: gaps.length,
          duration
        }
      };
    } catch (error) {
      this.logger.error('Literature review failed', error);
      throw error;
    }
  }

  /**
   * 搜索步骤 - 使用真实的Claude Agent SDK
   * @param topic 研究主题
   * @param maxPapers 最大论文数
   * @returns 论文列表
   */
  private async executeSearchStep(topic: string, maxPapers: number): Promise<Paper[]> {
    const agentDef = getAgentDefinition('literature-searcher');

    if (!agentDef) {
      throw new Error('Agent definition not found: literature-searcher');
    }

    const startTime = Date.now();
    this.logger.debug('Executing literature-searcher agent', { topic, maxPapers });

    try {
      // 使用真实的Claude Agent SDK query函数
      const agentQuery = query({
        prompt: `Search for ${maxPapers} academic papers about: "${topic}"

Return results as a JSON array with the following structure:
[
  {
    "id": "unique_id",
    "title": "Paper Title",
    "authors": ["Author1", "Author2"],
    "abstract": "Brief summary...",
    "year": 2023,
    "venue": "Conference/Journal",
    "url": "https://...",
    "pdfUrl": "https://...",
    "citationCount": 100,
    "doi": "10.xxxx/xxxxx",
    "relevanceScore": 9.5,
    "source": "arxiv"
  }
]

Focus on:
1. Recent papers (last 3-5 years)
2. Highly cited papers (citation count as impact indicator)
3. Survey papers for comprehensive coverage
4. Top-tier venues (NeurIPS, ICML, ACL, EMNLP, etc.)

Quality over quantity: better to have ${Math.min(maxPapers, 20)} highly relevant papers than ${maxPapers} marginally relevant ones.`,
        options: {
          agents: {
            'literature-searcher': agentDef
          },
          allowedTools: ['WebSearch', 'WebFetch']
        }
      });

      let result = '';
      let tokenCount = 0;

      // 处理流式输出
      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          for (const block of message.content) {
            if (block.type === 'text') {
              result += block.text;
              // 粗略估算token数 (1 token ≈ 4 characters)
              tokenCount += Math.ceil(block.text.length / 4);
            }
          }
        } else if (message.type === 'result' && message.subtype === 'success') {
          break;
        } else if (message.type === 'error') {
          this.logger.error('Agent query error', { error: message.error });
          throw new Error(`Agent error: ${message.error}`);
        }
      }

      const duration = Date.now() - startTime;
      globalMetrics.recordAgentCall('literature-searcher', duration, tokenCount);

      // 解析结果
      const papers = this.parsePapersFromResponse(result);
      this.logger.debug('Search step completed', { paperCount: papers.length, duration });

      return papers;
    } catch (error) {
      this.logger.error('Search step failed', error);
      throw error;
    }
  }

  /**
   * 分析步骤 - 并行分析多篇论文
   * @param papers 论文列表
   * @returns 分析结果数组
   */
  private async executeAnalysisStep(papers: Paper[]): Promise<string[]> {
    const agentDef = getAgentDefinition('peer-reviewer');

    if (!agentDef) {
      throw new Error('Agent definition not found: peer-reviewer');
    }

    this.logger.debug('Executing peer-reviewer agent for multiple papers', { paperCount: papers.length });

    // 并行分析所有论文
    const analysisPromises = papers.map((paper, index) =>
      this.analyzeSinglePaper(agentDef, paper, index)
    );

    try {
      const analyses = await Promise.all(analysisPromises);
      this.logger.debug('Analysis step completed', { analysisCount: analyses.length });
      return analyses;
    } catch (error) {
      this.logger.error('Analysis step failed', error);
      throw error;
    }
  }

  /**
   * 分析单篇论文
   * @param agentDef Agent定义
   * @param paper 论文信息
   * @param index 索引
   * @returns 分析结果
   */
  private async analyzeSinglePaper(
    agentDef: AgentDefinition,
    paper: Paper,
    index: number
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const agentQuery = query({
        prompt: `Review paper #${index + 1}:

Title: ${paper.title}
Authors: ${paper.authors.join(', ')}
Year: ${paper.year}
Venue: ${paper.venue || 'Unknown'}
${paper.abstract ? `Abstract: ${paper.abstract}` : ''}

Provide a concise review covering:
1. Main contribution (1-2 sentences)
2. Methodology approach (1-2 sentences)
3. Key findings (1-2 sentences)
4. Strengths (bullet points)
5. Limitations (bullet points)

Keep it under 200 words.`,
        options: {
          agents: {
            'peer-reviewer': agentDef
          },
          allowedTools: ['Read', 'WebSearch']
        }
      });

      let result = '';
      let tokenCount = 0;

      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          for (const block of message.content) {
            if (block.type === 'text') {
              result += block.text;
              tokenCount += Math.ceil(block.text.length / 4);
            }
          }
        } else if (message.type === 'result' && message.subtype === 'success') {
          break;
        }
      }

      const duration = Date.now() - startTime;
      globalMetrics.recordAgentCall('peer-reviewer', duration, tokenCount);

      return result;
    } catch (error) {
      this.logger.warn(`Failed to analyze paper #${index + 1}`, { error, title: paper.title });
      return `Analysis failed for paper: ${paper.title}`;
    }
  }

  /**
   * 识别研究空白
   * @param topic 研究主题
   * @param papers 论文列表
   * @param analyses 分析结果
   * @returns 研究空白列表
   */
  private async executeGapIdentificationStep(
    topic: string,
    papers: Paper[],
    analyses: string[]
  ): Promise<string[]> {
    const agentDef = getAgentDefinition('literature-reviewer');

    if (!agentDef) {
      throw new Error('Agent definition not found: literature-reviewer');
    }

    const startTime = Date.now();

    try {
      // 为了节省token，只分析前10篇论文的摘要
      const summaryPapers = papers.slice(0, 10).map((p, i) => ({
        title: p.title,
        analysis: analyses[i]
      }));

      const agentQuery = query({
        prompt: `Topic: ${topic}

Analyzed ${papers.length} papers. Here are summaries of the most relevant ones:

${summaryPapers.map((p, i) => `
${i + 1}. ${p.title}
   ${p.analysis}
`).join('\n')}

Based on these papers, identify 5-7 specific research gaps or future directions.

For each gap:
1. Provide a clear, specific description
2. Explain why this is a gap
3. Suggest how it could be addressed

Format as a numbered list.`,
        options: {
          agents: {
            'literature-reviewer': agentDef
          },
          allowedTools: ['WebSearch']
        }
      });

      let result = '';
      let tokenCount = 0;

      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          for (const block of message.content) {
            if (block.type === 'text') {
              result += block.text;
              tokenCount += Math.ceil(block.text.length / 4);
            }
          }
        } else if (message.type === 'result' && message.subtype === 'success') {
          break;
        }
      }

      const duration = Date.now() - startTime;
      globalMetrics.recordAgentCall('literature-reviewer', duration, tokenCount);

      // 解析空白列表
      const gaps = this.parseGapsFromResponse(result);
      this.logger.debug('Gap identification completed', { gapCount: gaps.length });

      return gaps;
    } catch (error) {
      this.logger.error('Gap identification failed', error);
      return ['Failed to identify research gaps due to an error'];
    }
  }

  /**
   * 综合发现
   * @param topic 研究主题
   * @param papers 论文列表
   * @param analyses 分析结果
   * @param gaps 研究空白
   * @returns 综合报告
   */
  private async executeSynthesisStep(
    topic: string,
    papers: Paper[],
    analyses: string[],
    gaps: string[]
  ): Promise<string> {
    const agentDef = getAgentDefinition('academic-writer');

    if (!agentDef) {
      throw new Error('Agent definition not found: academic-writer');
    }

    const startTime = Date.now();

    try {
      // 创建论文摘要（限制数量以节省token）
      const paperSummaries = papers.slice(0, 15).map((p, i) => ({
        title: p.title,
        authors: p.authors.slice(0, 3).join(', '), // 只列前3位作者
        year: p.year,
        venue: p.venue,
        analysis: analyses[i]?.substring(0, 200) // 限制分析长度
      }));

      const agentQuery = query({
        prompt: `Write a comprehensive literature review on: ${topic}

Papers Analyzed: ${papers.length}

Key Papers:
${paperSummaries.map((p, i) => `
${i + 1}. ${p.title} (${p.year})
   Authors: ${p.authors}
   Venue: ${p.venue || 'Unknown'}
   ${p.analysis ? `Key Points: ${p.analysis}` : ''}
`).join('\n')}

Identified Research Gaps:
${gaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Create a literature review with:
1. **Introduction** (overview of the topic, its importance)
2. **Main Themes** (organize papers by themes/approaches, 3-4 themes)
3. **Methodological Trends** (common methods, datasets used)
4. **Key Findings** (major discoveries across papers)
5. **Research Gaps** (based on identified gaps)
6. **Future Directions** (how gaps could be addressed)

Keep it under 1000 words. Be specific and cite papers by title in brackets.`,
        options: {
          agents: {
            'academic-writer': agentDef
          },
          allowedTools: ['Read', 'Edit']
        }
      });

      let result = '';
      let tokenCount = 0;

      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          for (const block of message.content) {
            if (block.type === 'text') {
              result += block.text;
              tokenCount += Math.ceil(block.text.length / 4);
            }
          }
        } else if (message.type === 'result' && message.subtype === 'success') {
          break;
        }
      }

      const duration = Date.now() - startTime;
      globalMetrics.recordAgentCall('academic-writer', duration, tokenCount);

      this.logger.debug('Synthesis completed', { duration, wordCount: result.split(' ').length });

      return result;
    } catch (error) {
      this.logger.error('Synthesis failed', error);
      throw error;
    }
  }

  /**
   * 从响应中解析论文列表
   * @param response Agent响应
   * @returns 论文列表
   */
  private parsePapersFromResponse(response: string): Paper[] {
    try {
      // 尝试提取JSON数组
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const papers = JSON.parse(jsonMatch[0]);
        if (Array.isArray(papers)) {
          return papers;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to parse JSON from response', { error });
    }

    // 如果JSON解析失败，返回空数组
    this.logger.warn('No valid JSON found in response, returning empty array');
    return [];
  }

  /**
   * 从响应中解析研究空白列表
   * @param response Agent响应
   * @returns 空白列表
   */
  private parseGapsFromResponse(response: string): string[] {
    // 简单的解析：按数字列表分割
    const gaps: string[] = [];
    const lines = response.split('\n');
    let currentGap = '';

    for (const line of lines) {
      // 匹配编号行
      const match = line.match(/^\d+\.\s*(.*)/);
      if (match) {
        if (currentGap) {
          gaps.push(currentGap.trim());
        }
        currentGap = match[1];
      } else if (currentGap) {
        currentGap += ' ' + line.trim();
      }
    }

    if (currentGap) {
      gaps.push(currentGap.trim());
    }

    return gaps.length > 0 ? gaps : [response];
  }
}
