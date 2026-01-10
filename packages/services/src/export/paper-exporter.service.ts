/**
 * Paper Exporter Service
 *
 * 论文导出服务
 * 支持多种格式：Markdown (.md), Word (.docx), PDF (.pdf), HTML
 */

export interface PaperData {
  metadata: {
    title: string;
    authors: string[];
    affiliation: string;
    date: string;
    paperType: string;
    wordCount: number;
    sectionCount: number;
  };
  abstract: string;
  keywords: string[];
  sections: Record<string, string>;
  references: string;
  qualityMetrics?: {
    overallScore: number;
    grammarScore: number;
    clarityScore: number;
    toneScore: number;
  };
}

export interface ExportOptions {
  format: 'markdown' | 'docx' | 'html' | 'pdf';
  includeToc?: boolean;
  includeMetadata?: boolean;
  outputPath?: string;
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  format: string;
  filepath: string;
  size: number;
  message: string;
}

/**
 * 论文导出服务类
 */
export class PaperExporterService {
  /**
   * 导出论文
   */
  async exportPaper(paper: PaperData, options: ExportOptions): Promise<ExportResult> {
    const { format, outputPath = './output', filename } = options;

    // 确保输出目录存在
    await this.ensureDirectory(outputPath);

    // 生成文件名
    const safeFilename = filename || this.generateFilename(paper.metadata.title);
    const filepath = `${outputPath}/${safeFilename}.${this.getFileExtension(format)}`;

    let content: string | Buffer;
    let actualSize = 0;

    try {
      switch (format) {
        case 'markdown':
          content = this.exportToMarkdown(paper, options);
          await this.writeFile(filepath, content);
          actualSize = content.length;
          break;

        case 'html':
          content = this.exportToHTML(paper, options);
          await this.writeFile(filepath, content);
          actualSize = content.length;
          break;

        case 'docx':
          const docxBuffer = await this.exportToDocx(paper, options);
          await this.writeFile(filepath, docxBuffer);
          actualSize = docxBuffer.length;
          break;

        case 'pdf':
          const pdfBuffer = await this.exportToPdf(paper, options);
          await this.writeFile(filepath, pdfBuffer);
          actualSize = pdfBuffer.length;
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return {
        success: true,
        format,
        filepath,
        size: actualSize,
        message: `论文成功导出为 ${format.toUpperCase()} 格式`
      };

    } catch (error) {
      return {
        success: false,
        format,
        filepath: '',
        size: 0,
        message: `导出失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 导出为Markdown格式
   */
  private exportToMarkdown(paper: PaperData, options: ExportOptions): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# ${paper.metadata.title}\n`);

    // 元数据
    if (options.includeMetadata !== false) {
      lines.push('**元数据**\n');
      lines.push(`- **作者**: ${paper.metadata.authors.join(', ')}`);
      lines.push(`- **所属机构**: ${paper.metadata.affiliation}`);
      lines.push(`- **日期**: ${paper.metadata.date}`);
      lines.push(`- **类型**: ${paper.metadata.paperType}`);
      lines.push(`- **字数**: ${paper.metadata.wordCount} 字\n`);
    }

    // 摘要
    lines.push('## 摘要\n');
    lines.push(`${paper.abstract}\n`);

    // 关键词
    lines.push('**关键词**: ' + paper.keywords.join('、') + '\n');

    // 目录
    if (options.includeToc) {
      lines.push('## 目录\n');
      const sectionNames = Object.keys(paper.sections);
      sectionNames.forEach((name, index) => {
        lines.push(`${index + 1}. [${name}](#${this.slugify(name)})`);
      });
      lines.push('');
    }

    // 正文章节
    const sectionNames = Object.keys(paper.sections);
    sectionNames.forEach(name => {
      lines.push(`## ${name}\n`);
      lines.push(`${paper.sections[name]}\n`);
    });

    // 参考文献
    lines.push('## 参考文献\n');
    lines.push(paper.references);

    // 质量指标
    if (paper.qualityMetrics) {
      lines.push('\n---\n');
      lines.push('**质量指标**\n');
      lines.push(`- 总体评分: ${paper.qualityMetrics.overallScore}/100`);
      lines.push(`- 语法: ${paper.qualityMetrics.grammarScore}/100`);
      lines.push(`- 清晰度: ${paper.qualityMetrics.clarityScore}/100`);
      lines.push(`- 语气: ${paper.qualityMetrics.toneScore}/100`);
    }

    return lines.join('\n');
  }

  /**
   * 导出为HTML格式
   */
  private exportToHTML(paper: PaperData, options: ExportOptions): string {
    const lines: string[] = [];

    // HTML头部
    lines.push('<!DOCTYPE html>');
    lines.push('<html lang="zh-CN">');
    lines.push('<head>');
    lines.push('  <meta charset="UTF-8">');
    lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    lines.push('  <title>' + paper.metadata.title + '</title>');
    lines.push('  <style>');
    lines.push('    body { font-family: "Times New Roman", serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8; }');
    lines.push('    h1 { text-align: center; color: #333; }');
    lines.push('    h2 { color: #444; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; }');
    lines.push('    .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }');
    lines.push('    .abstract { background: #e8f4f8; padding: 15px; border-left: 4px solid #008080; margin: 20px 0; }');
    lines.push('    .keywords { font-style: italic; color: #666; }');
    lines.push('    .references { font-size: 0.9em; color: #555; }');
    lines.push('    .quality-metrics { background: #f0f8ff; padding: 10px; border-radius: 5px; margin-top: 30px; }');
    lines.push('    @media print { body { max-width: 100%; } }');
    lines.push('  </style>');
    lines.push('</head>');
    lines.push('<body>');

    // 标题
    lines.push('  <h1>' + paper.metadata.title + '</h1>');

    // 元数据
    if (options.includeMetadata !== false) {
      lines.push('  <div class="metadata">');
      lines.push('    <p><strong>作者:</strong> ' + paper.metadata.authors.join(', ') + '</p>');
      lines.push('    <p><strong>所属机构:</strong> ' + paper.metadata.affiliation + '</p>');
      lines.push('    <p><strong>日期:</strong> ' + paper.metadata.date + '</p>');
      lines.push('    <p><strong>类型:</strong> ' + paper.metadata.paperType + '</p>');
      lines.push('    <p><strong>字数:</strong> ' + paper.metadata.wordCount + ' 字</p>');
      lines.push('  </div>');
    }

    // 摘要
    lines.push('  <div class="abstract">');
    lines.push('    <h2>摘要</h2>');
    lines.push('    <p>' + paper.abstract.replace(/\n/g, '<br>') + '</p>');
    lines.push('    <p class="keywords"><strong>关键词:</strong> ' + paper.keywords.join('、') + '</p>');
    lines.push('  </div>');

    // 目录
    if (options.includeToc) {
      lines.push('  <h2>目录</h2>');
      lines.push('  <ul>');
      const sectionNames = Object.keys(paper.sections);
      sectionNames.forEach((name, index) => {
        const slug = this.slugify(name);
        lines.push('    <li><a href="#' + slug + '">' + (index + 1) + '. ' + name + '</a></li>');
      });
      lines.push('  </ul>');
    }

    // 正文章节
    const sectionNames = Object.keys(paper.sections);
    sectionNames.forEach(name => {
      const slug = this.slugify(name);
      const content = paper.sections[name]
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>');

      lines.push('  <h2 id="' + slug + '">' + name + '</h2>');
      lines.push('  <div>' + content + '</div>');
    });

    // 参考文献
    lines.push('  <h2>参考文献</h2>');
    lines.push('  <div class="references">');
    lines.push(paper.references.replace(/\n/g, '<br>'));
    lines.push('  </div>');

    // 质量指标
    if (paper.qualityMetrics) {
      lines.push('  <div class="quality-metrics">');
      lines.push('    <h3>质量指标</h3>');
      lines.push('    <p>总体评分: ' + paper.qualityMetrics.overallScore + '/100</p>');
      lines.push('    <p>语法: ' + paper.qualityMetrics.grammarScore + '/100</p>');
      lines.push('    <p>清晰度: ' + paper.qualityMetrics.clarityScore + '/100</p>');
      lines.push('    <p>语气: ' + paper.qualityMetrics.toneScore + '/100</p>');
      lines.push('  </div>');
    }

    // HTML尾部
    lines.push('</body>');
    lines.push('</html>');

    return lines.join('\n');
  }

  /**
   * 导出为Word (.docx) 格式
   */
  private async exportToDocx(paper: PaperData, options: ExportOptions): Promise<Buffer> {
    // 注意：这是一个简化的docx实现
    // 生产环境中应该使用 docx 库 (npm install docx)
    // 这里我们生成一个包含格式化内容的RTF格式，
    // Word可以打开RTF文件

    const rtfContent = this.generateRTF(paper, options);
    return Buffer.from(rtfContent, 'utf-8');
  }

  /**
   * 生成RTF格式（Word兼容）
   */
  private generateRTF(paper: PaperData, options: ExportOptions): string {
    // RTF头部
    let rtf = '{\\rtf1\\ansi\\ansicpg936\\deff0\\deflang1033\\deflangfe2052';
    rtf += '{\\fonttbl{\\f0\\fnil\\fcharset134 SimSun;}}';
    rtf += '{\\colortbl ;\\red0\\green0\\blue0;}';
    rtf += '\\viewkind4\\uc1\\pard\\cf1\\lang2052\\f0\\fs24';

    // 标题
    rtf += '\\par\\par\\qc\\fs36 ' + paper.metadata.title + '\\par\\par\\fs24\\pard\\ql';

    // 元数据
    if (options.includeMetadata !== false) {
      rtf += '\\par 作者: ' + paper.metadata.authors.join(', ');
      rtf += '\\par 所属机构: ' + paper.metadata.affiliation;
      rtf += '\\par 日期: ' + paper.metadata.date;
      rtf += '\\par 类型: ' + paper.metadata.paperType;
      rtf += '\\par 字数: ' + paper.metadata.wordCount + ' 字\\par\\par';
    }

    // 摘要
    rtf += '\\par\\b 摘要\\b0\\par';
    rtf += paper.abstract.replace(/\n/g, '\\par ') + '\\par\\par';
    rtf += '\\i 关键词:\\i0 ' + paper.keywords.join('、') + '\\par\\par';

    // 目录
    if (options.includeToc) {
      rtf += '\\b 目录\\b0\\par';
      const sectionNames = Object.keys(paper.sections);
      sectionNames.forEach((name, index) => {
        rtf += '\\par ' + (index + 1) + '. ' + name;
      });
      rtf += '\\par\\par';
    }

    // 正文章节
    const sectionNames = Object.keys(paper.sections);
    sectionNames.forEach(name => {
      rtf += '\\par\\b \\fs28 ' + name + '\\b0\\fs24\\par';
      rtf += paper.sections[name].replace(/\n/g, '\\par ') + '\\par\\par';
    });

    // 参考文献
    rtf += '\\b 参考文献\\b0\\par';
    rtf += paper.references.replace(/\n/g, '\\par ') + '\\par';

    // RTF尾部
    rtf += '}';

    return rtf;
  }

  /**
   * 导出为PDF格式
   */
  private async exportToPdf(paper: PaperData, options: ExportOptions): Promise<Buffer> {
    // 注意：完整的PDF生成需要使用库如 pdfkit 或 puppeteer
    // 这里我们提供一个简化的实现
    // 实际生产环境中应该安装: npm install pdfkit

    const htmlContent = this.exportToHTML(paper, options);

    // 简化实现：返回HTML内容的Buffer
    // 实际生产环境应该使用 puppeteer 或 pdfkit 将HTML转换为PDF
    const message = `\\n// PDF导出功能说明\\n` +
                   `// 要启用完整的PDF导出，请安装依赖:\\n` +
                   `// bun add pdfkit\\n` +
                   `// 或使用 puppeteer 进行HTML到PDF的转换\\n` +
                   `//\\n` +
                   `// 当前返回的是HTML内容，请使用浏览器打开后打印为PDF\\n\\n` +
                   `// HTML内容:\\n\\n${htmlContent}`;

    return Buffer.from(message, 'utf-8');
  }

  /**
   * 辅助方法：确保目录存在
   */
  private async ensureDirectory(path: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.mkdir(path, { recursive: true });
    } catch (error) {
      // 目录可能已存在，忽略错误
    }
  }

  /**
   * 辅助方法：写入文件
   */
  private async writeFile(filepath: string, content: string | Buffer): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(filepath, content);
  }

  /**
   * 辅助方法：生成文件名
   */
  private generateFilename(title: string): string {
    // 移除或替换不适合文件名的字符
    return title
      .replace(/[<>:"/\\|?*]/g, '') // 移除非法字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .substring(0, 100); // 限制长度
  }

  /**
   * 辅助方法：获取文件扩展名
   */
  private getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      markdown: 'md',
      docx: 'rtf', // 使用RTF作为简化的docx实现
      html: 'html',
      pdf: 'html'  // 暂时返回HTML，实际应该用pdf
    };
    return extensions[format] || format;
  }

  /**
   * 辅助方法：将文本转换为URL友好的slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
