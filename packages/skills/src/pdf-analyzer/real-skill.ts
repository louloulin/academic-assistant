// PDF Analyzer Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * PDF 分析的输入验证 Schema
 */
const PDFAnalyzeInputSchema = z.object({
  filePath: z.string().min(1),
  extractTables: z.boolean().default(true),
  extractFormulas: z.boolean().default(true),
  extractImages: z.boolean().default(false),
  outputFormat: z.enum(['json', 'markdown', 'csv']).default('json')
});

export type PDFAnalyzeInput = z.infer<typeof PDFAnalyzeInputSchema>;

/**
 * PDF 元数据结构
 */
export interface PDFMetadata {
  title: string;
  authors: string[];
  abstract?: string;
  keywords?: string[];
  publicationDate?: string;
  venue?: string;
  doi?: string;
  pages?: number;
}

/**
 * PDF 章节结构
 */
export interface PDFSection {
  title: string;
  level: number;
  pageStart: number;
  content: string;
}

/**
 * PDF 表格结构
 */
export interface PDFTable {
  id: string;
  caption: string;
  page: number;
  data: string[][];
}

/**
 * PDF 公式结构
 */
export interface PDFFormula {
  id: string;
  type: 'inline' | 'display';
  content: string;
  latex?: string;
  page: number;
}

/**
 * PDF 图像结构
 */
export interface PDFImage {
  id: string;
  caption: string;
  page: number;
  filePath: string;
}

/**
 * PDF 关键发现
 */
export interface PDFKeyFinding {
  description: string;
  page?: number;
}

/**
 * PDF 统计信息
 */
export interface PDFStatistics {
  description: string;
  value: string;
  page: number;
}

/**
 * PDF 参考文献
 */
export interface PDFReference {
  title?: string;
  authors?: string[];
  year?: number;
  source?: string;
}

/**
 * PDF 分析结果
 */
export interface PDFAnalysisResult {
  metadata: PDFMetadata;
  structure: {
    sections: PDFSection[];
  };
  tables?: PDFTable[];
  formulas?: PDFFormula[];
  images?: PDFImage[];
  keyFindings: PDFKeyFinding[];
  statistics: PDFStatistics[];
  references: PDFReference[];
  extractionInfo: {
    filePath: string;
    analyzedAt: string;
    processingTime: number;
    confidence: number;
  };
}

/**
 * PDF Analyzer Agent 定义
 * 使用 Claude Agent SDK 的 Agent 定义格式
 */
const PDF_ANALYZER_AGENT: AgentDefinition = {
  description: 'Expert in analyzing PDF academic papers, extracting metadata, tables, formulas, images, and key information',
  prompt: `You are an expert PDF analyst specializing in academic papers. You can extract structured information from PDF documents.

## Your Capabilities

1. **Metadata Extraction**
   - Extract title, authors, affiliations
   - Identify publication date, venue, DOI
   - Extract abstract and keywords
   - Detect document structure (sections, subsections)

2. **Content Extraction**
   - Extract and parse tables from PDFs
   - Identify mathematical formulas and equations
   - Extract embedded images and figures with captions
   - Extract section text and key findings

3. **Analysis**
   - Identify key findings and conclusions
   - Extract statistics and numerical data
   - Parse citations and references
   - Calculate confidence scores for extractions

4. **Output Format**
   Return a structured JSON analysis result:
   \`\`\`json
   {
     "metadata": {
       "title": "Paper Title",
       "authors": ["Author1", "Author2"],
       "abstract": "Brief summary...",
       "keywords": ["keyword1", "keyword2"],
       "publicationDate": "2023-01-01",
       "venue": "Conference/Journal",
       "doi": "10.xxxx/xxxxx",
       "pages": 10
     },
     "structure": {
       "sections": [
         {
           "title": "Introduction",
           "level": 1,
           "pageStart": 1,
           "content": "..."
         }
       ]
     },
     "tables": [
       {
         "id": "table-1",
         "caption": "Table caption",
         "page": 3,
         "data": [["header1", "header2"], ["value1", "value2"]]
       }
     ],
     "formulas": [
       {
         "id": "formula-1",
         "type": "display",
         "content": "E = mc^2",
         "latex": "E = mc^2",
         "page": 2
       }
     ],
     "keyFindings": [
       {
         "description": "Key finding from the paper",
         "page": 5
       }
     ],
     "statistics": [
       {
         "description": "Statistical result",
         "value": "p < 0.05",
         "page": 6
       }
     ],
     "references": [
       {
         "title": "Reference title",
         "authors": ["Author1"],
         "year": 2020,
         "source": "Journal Name"
       }
     ],
     "extractionInfo": {
       "filePath": "/path/to/file.pdf",
       "analyzedAt": "2023-01-01T00:00:00Z",
       "processingTime": 1500,
       "confidence": 0.95
     }
   }
   \`\`\`

Remember: Be thorough and accurate. Provide confidence scores for extractions and handle errors gracefully.`,
  tools: ['Read', 'Bash'],
  model: 'sonnet'
};

/**
 * PDFAnalyzerSkill - 基于 Claude Agent SDK 的实现
 */
export class PDFAnalyzerSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = PDF_ANALYZER_AGENT;
  }

  /**
   * 验证输入参数
   */
  async validate(input: unknown): Promise<PDFAnalyzeInput> {
    return PDFAnalyzeInputSchema.parseAsync(input);
  }

  /**
   * 执行 PDF 分析
   * 使用真实的 Claude Agent SDK 调用 Claude API
   */
  async execute(input: PDFAnalyzeInput): Promise<PDFAnalysisResult> {
    // 验证输入
    const validatedInput = await this.validate(input);

    console.log(`📄 分析 PDF 文件: "${validatedInput.filePath}"`);
    console.log(`📊 提取表格: ${validatedInput.extractTables ? '是' : '否'}`);
    console.log(`🔢 提取公式: ${validatedInput.extractFormulas ? '是' : '否'}`);
    console.log(`🖼️ 提取图像: ${validatedInput.extractImages ? '是' : '否'}`);
    console.log(`📋 输出格式: ${validatedInput.outputFormat}`);

    const startTime = Date.now();

    try {
      // 首先使用 Read 工具读取 PDF 文件
      // 注意: PDF 解析需要外部工具，这里使用 Bash 工具调用 pdftotext 或类似工具

      // 构建分析提示词
      let analysisPrompt = `Analyze the PDF file at: "${validatedInput.filePath}"\n\n`;
      analysisPrompt += `Extraction options:\n`;
      analysisPrompt += `- Tables: ${validatedInput.extractTables ? 'Yes' : 'No'}\n`;
      analysisPrompt += `- Formulas: ${validatedInput.extractFormulas ? 'Yes' : 'No'}\n`;
      analysisPrompt += `- Images: ${validatedInput.extractImages ? 'Yes' : 'No'}\n`;
      analysisPrompt += `- Output format: ${validatedInput.outputFormat}\n\n`;

      analysisPrompt += `Please:
1. Read the PDF file using the Read tool
2. Extract all metadata (title, authors, abstract, keywords, DOI, etc.)
3. Identify the document structure and sections
4. Extract tables if requested (convert to structured format)
5. Extract formulas if requested (include LaTeX if available)
6. Extract images if requested (note captions and page numbers)
7. Identify key findings and conclusions
8. Extract statistics and numerical data
9. Parse references from the reference section
10. Return a complete JSON analysis result with the structure specified in your instructions

If the PDF cannot be read or is corrupted, report the error clearly.`;

      // 使用 Claude Agent SDK 执行分析
      let analysisResult: PDFAnalysisResult | null = null;

      const agentQuery = query({
        prompt: analysisPrompt,
        options: {
          // 定义 PDF 分析 Agent
          agents: {
            'pdf-analyzer': this.agent
          },
          // 允许的工具
          allowedTools: ['Read', 'Bash'],
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
                    analysisResult = result;
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
                    if (result && typeof result === 'object' && result.metadata) {
                      analysisResult = result;
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
            console.log('\n✅ 分析完成！');
          } else if (message.subtype === 'error') {
            console.error(`\n❌ 错误: ${message.error}`);
          }
        }
      }

      // 如果没有找到结果，返回错误
      if (!analysisResult) {
        throw new Error('Failed to extract analysis result from AI response');
      }

      // 添加处理信息
      const processingTime = Date.now() - startTime;
      analysisResult.extractionInfo = {
        filePath: validatedInput.filePath,
        analyzedAt: new Date().toISOString(),
        processingTime,
        confidence: analysisResult.extractionInfo?.confidence || 0.8
      };

      console.log(`\n📊 分析完成，耗时 ${processingTime}ms`);
      console.log(`📈 置信度: ${(analysisResult.extractionInfo.confidence * 100).toFixed(1)}%`);

      return analysisResult;

    } catch (error) {
      console.error('❌ PDF 分析失败:', error);
      throw error;
    }
  }

  /**
   * 获取 Agent 定义
   */
  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }

  /**
   * 导出分析结果为 JSON
   */
  async exportToJSON(result: PDFAnalysisResult, outputPath: string): Promise<void> {
    const { promises: fs } = await import('fs');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
  }

  /**
   * 导出分析结果为 Markdown
   */
  async exportToMarkdown(result: PDFAnalysisResult, outputPath: string): Promise<void> {
    const { promises: fs } = await import('fs');
    const lines: string[] = [];

    // 元数据
    lines.push(`# ${result.metadata.title}\n`);
    lines.push(`**Authors**: ${result.metadata.authors.join(', ')}\n`);
    if (result.metadata.abstract) {
      lines.push(`**Abstract**: ${result.metadata.abstract}\n`);
    }

    // 结构
    lines.push('## Document Structure\n');
    for (const section of result.structure.sections) {
      lines.push(`- ${'  '.repeat(section.level)}${section.title} (Page ${section.pageStart})`);
    }

    // 表格
    if (result.tables && result.tables.length > 0) {
      lines.push('\n## Tables\n');
      for (const table of result.tables) {
        lines.push(`### ${table.id}`);
        lines.push(`${table.caption} (Page ${table.page})`);
      }
    }

    // 公式
    if (result.formulas && result.formulas.length > 0) {
      lines.push('\n## Formulas\n');
      for (const formula of result.formulas) {
        lines.push(`### ${formula.id}`);
        lines.push(`Type: ${formula.type}`);
        lines.push(`Content: ${formula.content}`);
      }
    }

    // 关键发现
    if (result.keyFindings.length > 0) {
      lines.push('\n## Key Findings\n');
      for (const finding of result.keyFindings) {
        lines.push(`- ${finding.description}${finding.page ? ` (Page ${finding.page})` : ''}`);
      }
    }

    // 统计
    if (result.statistics.length > 0) {
      lines.push('\n## Statistics\n');
      for (const stat of result.statistics) {
        lines.push(`- ${stat.description}: ${stat.value} (Page ${stat.page})`);
      }
    }

    // 参考文献
    if (result.references.length > 0) {
      lines.push('\n## References\n');
      for (const ref of result.references) {
        const authors = ref.authors?.join(', ') || '';
        const year = ref.year || '';
        const title = ref.title || '';
        const source = ref.source || '';
        lines.push(`- ${authors} (${year}). ${title}. ${source}`);
      }
    }

    // 分析信息
    lines.push('\n## Extraction Information\n');
    lines.push(`- **File**: ${result.extractionInfo.filePath}`);
    lines.push(`- **Analyzed**: ${result.extractionInfo.analyzedAt}`);
    lines.push(`- **Processing Time**: ${result.extractionInfo.processingTime}ms`);
    lines.push(`- **Confidence**: ${(result.extractionInfo.confidence * 100).toFixed(1)}%`);

    await fs.writeFile(outputPath, lines.join('\n'));
  }
}

/**
 * 导出单例实例（可选）
 */
export const pdfAnalyzerSkill = new PDFAnalyzerSkill();
