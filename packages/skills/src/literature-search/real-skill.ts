// Literature Search Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * 文献搜索的输入验证 Schema
 */
const SearchInputSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().min(1).max(100).default(10),
  sources: z.array(z.enum(['arxiv', 'semantic-scholar', 'pubmed', 'google-scholar'])).default([
    'arxiv',
    'semantic-scholar'
  ]),
  yearFrom: z.number().optional(),
  yearTo: z.number().optional()
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
}

/**
 * Literature Search Agent 定义
 * 使用 Claude Agent SDK 的 Agent 定义格式
 */
const LITERATURE_SEARCH_AGENT: AgentDefinition = {
  description: 'Expert in searching academic literature across multiple databases (ArXiv, Semantic Scholar, PubMed, Google Scholar)',
  prompt: `You are an expert academic literature researcher with extensive knowledge of multiple academic databases.

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
   Return a structured JSON array of papers:
   \`\`\`json
   [
     {
       "id": "arxiv:1234.5678",
       "title": "Paper Title",
       "authors": ["Author1", "Author2"],
       "abstract": "Brief summary...",
       "year": 2023,
       "venue": "Conference/Journal Name",
       "url": "https://...",
       "pdfUrl": "https://...",
       "citationCount": 150,
       "doi": "10.xxxx/xxxxx",
       "relevanceScore": 9.5
     }
   ]
   \`\`\`

Remember: Be thorough but focused. Find the most relevant papers rather than overwhelming with results.`,
  tools: ['WebSearch', 'WebFetch'],
  model: 'sonnet'
};

/**
 * LiteratureSearchSkill - 基于 Claude Agent SDK 的实现
 */
export class LiteratureSearchSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = LITERATURE_SEARCH_AGENT;
  }

  /**
   * 验证输入参数
   */
  async validate(input: unknown): Promise<SearchInput> {
    return SearchInputSchema.parseAsync(input);
  }

  /**
   * 执行文献搜索
   * 使用真实的 Claude Agent SDK 调用 Claude API
   */
  async execute(input: SearchInput): Promise<Paper[]> {
    // 验证输入
    const validatedInput = await this.validate(input);

    console.log(`🔍 搜索学术文献: "${validatedInput.query}"`);
    console.log(`📊 数据源: ${validatedInput.sources.join(', ')}`);
    console.log(`📈 最大结果数: ${validatedInput.maxResults}`);

    try {
      // 构建搜索提示词
      let searchPrompt = `Search for academic papers about: "${validatedInput.query}"\n\n`;
      searchPrompt += `Search in: ${validatedInput.sources.join(', ')}\n`;
      searchPrompt += `Maximum results: ${validatedInput.maxResults}\n`;

      if (validatedInput.yearFrom || validatedInput.yearTo) {
        searchPrompt += `Year range: `;
        if (validatedInput.yearFrom) searchPrompt += `${validatedInput.yearFrom}`;
        searchPrompt += '-';
        if (validatedInput.yearTo) searchPrompt += `${validatedInput.yearTo}`;
        searchPrompt += `\n`;
      }

      searchPrompt += `\nPlease:
1. Search across the specified databases
2. Extract key information (title, authors, year, venue, citations, DOI)
3. Assess relevance and quality of each paper
4. Return results as a JSON array with the structure specified in your instructions
5. Include only highly relevant papers`;

      // 使用 Claude Agent SDK 执行搜索
      const results: Paper[] = [];

      const agentQuery = query({
        prompt: searchPrompt,
        options: {
          // 定义文献搜索 Agent
          agents: {
            'literature-searcher': this.agent
          },
          // 允许的工具
          allowedTools: ['WebSearch', 'WebFetch'],
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

              // 尝试提取 JSON 数组
              // 检测 JSON 代码块
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
                  const papers = JSON.parse(jsonBuffer.trim());
                  if (Array.isArray(papers)) {
                    results.push(...papers);
                  }
                } catch (e) {
                  console.warn('JSON 解析失败:', e);
                }
                jsonBuffer = '';
              } else if (inJsonBlock) {
                jsonBuffer += text;
              } else {
                // 尝试直接解析整个文本中的 JSON 数组
                const arrayMatch = text.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                  try {
                    const papers = JSON.parse(arrayMatch[0]);
                    if (Array.isArray(papers)) {
                      results.push(...papers);
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
            console.log('\n✅ 搜索完成！');
          } else if (message.subtype === 'error') {
            console.error(`\n❌ 错误: ${message.error}`);
          }
        }
      }

      // 如果没有找到结果，返回空数组
      if (results.length === 0) {
        console.warn('⚠️  未找到论文结果');
        return [];
      }

      // 验证和清理结果
      const validatedPapers = results.filter(paper => {
        return paper &&
               typeof paper === 'object' &&
               typeof paper.title === 'string' &&
               typeof paper.year === 'number' &&
               Array.isArray(paper.authors);
      });

      console.log(`\n📊 找到 ${validatedPapers.length} 篇相关论文`);

      // 按相关性排序并限制数量
      const sortedPapers = validatedPapers
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, validatedInput.maxResults);

      return sortedPapers;

    } catch (error) {
      console.error('❌ 文献搜索失败:', error);
      throw error;
    }
  }

  /**
   * 获取 Agent 定义
   */
  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }
}

/**
 * 导出单例实例（可选）
 */
export const literatureSearchSkill = new LiteratureSearchSkill();
