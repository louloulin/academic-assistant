// Literature Search Skill - 真实实现版本
// 结合 Claude Agent SDK + MCP 服务器
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { realMCPClient, connectAcademicServers } from '../../../mcp-client/src/real-mcp-client';

/**
 * 文献搜索输入验证
 */
const SearchInputSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().min(1).max(100).default(10),
  sources: z.array(z.enum(['arxiv', 'semantic-scholar', 'pubmed', 'acl', 'google-scholar', 'mcp'])).default([
    'arxiv',
    'semantic-scholar',
    'mcp'
  ]),
  yearFrom: z.number().optional(),
  yearTo: z.number().optional(),
  useMCP: z.boolean().default(true) // 优先使用 MCP 服务器
});

export type SearchInput = z.infer<typeof SearchInputSchema>;

/**
 * 论文信息结构
 */
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  venue?: string;
  url: string;
  pdfUrl?: string;
  citationCount?: number;
  doi?: string;
  relevanceScore?: number;
  source?: string; // 数据来源
}

/**
 * Literature Search Agent - 使用 Claude Agent SDK 定义
 */
const LITERATURE_SEARCH_AGENT: AgentDefinition = {
  description: 'Expert in academic literature search using MCP servers and web search',
  prompt: `You are an expert academic literature researcher with access to multiple databases.

## Your Capabilities

1. **MCP Server Integration**
   - Academia MCP Server: ArXiv, ACL Anthology search
   - Direct database access for accurate results

2. **Web Search Fallback**
   - Google Scholar for broader coverage
   - Semantic Scholar for citation data
   - PubMed for biomedical literature

3. **Information Extraction**
   - Extract: title, authors, year, venue, abstract, DOI
   - Note citation counts and impact
   - Identify key papers and seminal works
   - Find survey papers and review articles

4. **Search Strategy**
   - Use specific, technical terms
   - Combine keywords with operators
   - Filter by publication year
   - Prioritize highly cited papers

## Output Format

Return a JSON array of papers:
\`\`\`json
[
  {
    "id": "arxiv:1234.5678",
    "title": "Paper Title",
    "authors": ["Author1", "Author2"],
    "abstract": "Brief summary...",
    "year": 2023,
    "venue": "Conference/Journal",
    "url": "https://arxiv.org/abs/1234.5678",
    "pdfUrl": "https://arxiv.org/pdf/1234.5678.pdf",
    "citationCount": 150,
    "doi": "10.xxxx/xxxxx",
    "relevanceScore": 9.5,
    "source": "arxiv"
  }
]
\`\`\`

Remember: Quality over quantity. Find the most relevant papers.`,
  tools: ['WebSearch', 'WebFetch', 'Bash'], // Bash 用于执行 MCP 客户端
  model: 'sonnet'
};

/**
 * LiteratureSearchSkill - 真实实现
 */
export class LiteratureSearchSkill {
  private agent: AgentDefinition;
  private mcpConnected = false;

  constructor() {
    this.agent = LITERATURE_SEARCH_AGENT;
  }

  /**
   * 初始化 MCP 连接
   */
  private async ensureMCPConnected(): Promise<void> {
    if (!this.mcpConnected) {
      try {
        console.log('🔌 连接学术 MCP 服务器...');
        await connectAcademicServers(realMCPClient);
        this.mcpConnected = true;
      } catch (error) {
        console.warn('⚠️  MCP 连接失败，将使用 WebSearch 作为备用方案');
      }
    }
  }

  /**
   * 使用 MCP 服务器搜索
   */
  private async searchWithMCP(input: SearchInput): Promise<Paper[]> {
    await this.ensureMCPConnected();

    const results: Paper[] = [];

    // 尝试使用 Academia MCP 服务器
    if (realMCPClient.isConnected('academia')) {
      try {
        console.log('🔍 使用 Academia MCP 搜索...');

        // 调用 academia 搜索工具
        const searchResults = await realMCPClient.callTool<any>(
          'academia',
          'search_arxiv',
          {
            query: input.query,
            limit: Math.min(input.maxResults, 10)
          }
        );

        if (Array.isArray(searchResults)) {
          for (const item of searchResults) {
            results.push({
              id: item.id || `arxiv:${item.url?.split('/').pop()}`,
              title: item.title,
              authors: item.authors || [],
              abstract: item.abstract || item.summary || '',
              year: item.year || new Date().getFullYear(),
              venue: item.venue,
              url: item.url || item.arxiv_url,
              pdfUrl: item.pdf_url,
              citationCount: item.citation_count,
              doi: item.doi,
              relevanceScore: 8.0, // 默认相关性
              source: 'academia-mcp'
            });
          }
        }
      } catch (error) {
        console.warn('⚠️  Academia MCP 搜索失败:', error);
      }
    }

    return results;
  }

  /**
   * 使用 Claude Agent SDK 搜索（WebSearch 备用方案）
   */
  private async searchWithClaude(input: SearchInput): Promise<Paper[]> {
    console.log('🔍 使用 Claude Agent SDK 搜索...');

    const agentQuery = query({
      prompt: this.buildSearchPrompt(input),
      options: {
        agents: {
          'literature-searcher': this.agent
        },
        allowedTools: ['WebSearch', 'WebFetch'],
        permissionMode: 'bypassPermissions',
        cwd: process.cwd()
      }
    });

    const results: Paper[] = [];

    for await (const message of agentQuery) {
      if (message.type === 'assistant') {
        for (const block of message.content) {
          if (block.type === 'text') {
            // 尝试解析 JSON 结果
            const papers = this.extractPapersFromText(block.text);
            results.push(...papers);
          }
        }
      } else if (message.type === 'result' && message.subtype === 'success') {
        console.log('✅ Claude 搜索完成');
        break;
      }
    }

    return results;
  }

  /**
   * 构建搜索提示词
   */
  private buildSearchPrompt(input: SearchInput): string {
    let prompt = `Search for academic papers about: "${input.query}"\n\n`;
    prompt += `Search in: ${input.sources.join(', ')}\n`;
    prompt += `Maximum results: ${input.maxResults}\n`;

    if (input.yearFrom || input.yearTo) {
      prompt += `Year range: `;
      if (input.yearFrom) prompt += `${input.yearFrom}`;
      prompt += '-';
      if (input.yearTo) prompt += `${input.yearTo}`;
      prompt += `\n`;
    }

    prompt += `\nPlease search and return results as a JSON array of papers with the structure specified in your instructions.`;

    return prompt;
  }

  /**
   * 从文本中提取论文信息
   */
  private extractPapersFromText(text: string): Paper[] {
    const papers: Paper[] = [];

    // 尝试匹配 JSON 数组
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // 忽略解析错误
      }
    }

    return papers;
  }

  /**
   * 执行文献搜索
   * 优先使用 MCP 服务器，失败则使用 Claude Agent SDK
   */
  async execute(input: SearchInput): Promise<Paper[]> {
    // 验证输入
    const validatedInput = SearchInputSchema.parse(input);

    console.log(`🔍 文献搜索: "${validatedInput.query}"`);
    console.log(`📊 数据源: ${validatedInput.sources.join(', ')}`);
    console.log(`📈 最大结果: ${validatedInput.maxResults}`);

    let results: Paper[] = [];

    // 策略 1: 优先使用 MCP 服务器
    if (validatedInput.useMCP && validatedInput.sources.includes('mcp')) {
      try {
        const mcpResults = await this.searchWithMCP(validatedInput);
        results.push(...mcpResults);
      } catch (error) {
        console.warn('⚠️  MCP 搜索失败，尝试备用方案');
      }
    }

    // 策略 2: 如果 MCP 结果不足，使用 Claude Agent SDK
    if (results.length < validatedInput.maxResults) {
      const remaining = validatedInput.maxResults - results.length;
      console.log(`📊 还需要 ${remaining} 篇论文，使用 Claude 搜索...`);

      const claudeResults = await this.searchWithClaude({
        ...validatedInput,
        maxResults: remaining
      });

      results.push(...claudeResults);
    }

    // 去重
    const uniquePapers = this.deduplicatePapers(results);

    // 按相关性排序
    const sortedPapers = uniquePapers.sort((a, b) =>
      (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );

    // 限制数量
    const finalResults = sortedPapers.slice(0, validatedInput.maxResults);

    console.log(`\n✅ 找到 ${finalResults.length} 篇相关论文`);

    return finalResults;
  }

  /**
   * 去重论文
   */
  private deduplicatePapers(papers: Paper[]): Paper[] {
    const seen = new Set<string>();
    const unique: Paper[] = [];

    for (const paper of papers) {
      // 使用 DOI 或 title 作为唯一标识
      const key = paper.doi || paper.title.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(paper);
      }
    }

    return unique;
  }

  /**
   * 获取 Agent 定义
   */
  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }
}

/**
 * 导出单例
 */
export const literatureSearchSkill = new LiteratureSearchSkill();
