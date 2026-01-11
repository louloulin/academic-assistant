/**
 * Output Manager Service
 *
 * 统一的输出管理服务
 * 负责将生成的论文、报告等内容写入output目录
 *
 * @feature 支持多种格式输出
 * @feature 自动创建目录结构
 * @feature 元数据管理
 * @feature 时间戳和版本控制
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface OutputMetadata {
  title: string;
  type: 'paper' | 'review' | 'report' | 'analysis';
  format: 'markdown' | 'html' | 'json' | 'txt';
  timestamp: string;
  version?: string;
  tags?: string[];
}

export interface OutputOptions {
  outputDir?: string;
  createSubdirs?: boolean;
  includeTimestamp?: boolean;
  addExtension?: boolean;
  pretty?: boolean;
}

export interface OutputResult {
  success: boolean;
  filepath: string;
  size: number;
  metadata: OutputMetadata;
  message: string;
}

/**
 * 输出管理服务类
 */
export class OutputManagerService {
  private defaultOutputDir: string;

  constructor(outputDir: string = './output') {
    this.defaultOutputDir = outputDir;
  }

  /**
   * 写入内容到文件
   */
  async write(
    content: string | object | Buffer,
    metadata: OutputMetadata,
    options: OutputOptions = {}
  ): Promise<OutputResult> {
    const {
      outputDir = this.defaultOutputDir,
      createSubdirs = true,
      includeTimestamp = true,
      addExtension = true,
      pretty = true
    } = options;

    try {
      // 1. 创建输出目录
      const targetDir = createSubdirs
        ? path.join(outputDir, metadata.type)
        : outputDir;
      await this.ensureDirectory(targetDir);

      // 2. 生成文件名
      const filename = this.generateFilename(metadata, {
        includeTimestamp,
        addExtension
      });
      const filepath = path.join(targetDir, filename);

      // 3. 序列化内容
      let fileContent: Buffer;

      if (Buffer.isBuffer(content)) {
        fileContent = content;
      } else if (typeof content === 'string') {
        fileContent = Buffer.from(content, 'utf-8');
      } else if (metadata.format === 'json') {
        fileContent = Buffer.from(
          JSON.stringify(content, null, pretty ? 2 : 0),
          'utf-8'
        );
      } else {
        throw new Error(`Unsupported content type for format: ${metadata.format}`);
      }

      // 4. 写入文件
      await fs.writeFile(filepath, fileContent);

      // 5. 写入元数据文件（可选）
      if (metadata.format === 'json' || pretty) {
        await this.writeMetadata(filepath, metadata);
      }

      return {
        success: true,
        filepath,
        size: fileContent.length,
        metadata,
        message: `文件成功写入: ${filepath}`
      };

    } catch (error) {
      return {
        success: false,
        filepath: '',
        size: 0,
        metadata,
        message: `写入失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 写入论文
   */
  async writePaper(
    paper: any,
    options: OutputOptions = {}
  ): Promise<OutputResult> {
    const metadata: OutputMetadata = {
      title: paper.metadata?.title || 'Untitled Paper',
      type: 'paper',
      format: 'json',
      timestamp: new Date().toISOString(),
      version: paper.metadata?.version,
      tags: paper.keywords
    };

    return this.write(paper, metadata, options);
  }

  /**
   * 写入Markdown格式论文
   */
  async writeMarkdownPaper(
    paper: any,
    markdown: string,
    options: OutputOptions = {}
  ): Promise<OutputResult> {
    const metadata: OutputMetadata = {
      title: paper.metadata?.title || 'Untitled Paper',
      type: 'paper',
      format: 'markdown',
      timestamp: new Date().toISOString(),
      tags: paper.keywords
    };

    return this.write(markdown, metadata, options);
  }

  /**
   * 批量写入多个格式
   */
  async writeMultipleFormats(
    paper: any,
    formats: Array<{ format: 'markdown' | 'html' | 'json'; content: string | object }>,
    options: OutputOptions = {}
  ): Promise<OutputResult[]> {
    const results: OutputResult[] = [];

    for (const { format, content } of formats) {
      const metadata: OutputMetadata = {
        title: paper.metadata?.title || 'Untitled',
        type: 'paper',
        format,
        timestamp: new Date().toISOString(),
        tags: paper.keywords
      };

      const result = await this.write(content, metadata, options);
      results.push(result);
    }

    return results;
  }

  /**
   * 生成文件名
   */
  private generateFilename(
    metadata: OutputMetadata,
    options: { includeTimestamp?: boolean; addExtension?: boolean }
  ): string {
    let filename = this.sanitizeFilename(metadata.title);

    if (options.includeTimestamp) {
      const date = new Date(metadata.timestamp);
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      filename = `${filename}-${dateStr}`;
    }

    if (metadata.version) {
      filename = `${filename}-v${metadata.version}`;
    }

    if (options.addExtension) {
      const ext = this.getFileExtension(metadata.format);
      filename = `${filename}.${ext}`;
    }

    return filename;
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      'markdown': 'md',
      'html': 'html',
      'json': 'json',
      'txt': 'txt'
    };

    return extensions[format] || 'txt';
  }

  /**
   * 清理文件名（移除不安全字符）
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '-') // 移除不安全字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/-+/g, '-') // 多个连字符合并为一个
      .slice(0, 200); // 限制长度
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * 写入元数据文件
   */
  private async writeMetadata(
    filepath: string,
    metadata: OutputMetadata
  ): Promise<void> {
    const metadataPath = filepath.replace(
      /\.[^.]+$/,
      '.metadata.json'
    );

    const metadataContent = JSON.stringify(metadata, null, 2);
    await fs.writeFile(metadataPath, metadataContent);
  }

  /**
   * 列出output目录中的所有文件
   */
  async listFiles(type?: string): Promise<string[]> {
    const dir = type
      ? path.join(this.defaultOutputDir, type)
      : this.defaultOutputDir;

    try {
      await fs.access(dir);
      const files = await fs.readdir(dir);
      return files.filter(f => !f.endsWith('.metadata.json'));
    } catch {
      return [];
    }
  }

  /**
   * 清空output目录
   */
  async clear(type?: string): Promise<void> {
    const dir = type
      ? path.join(this.defaultOutputDir, type)
      : this.defaultOutputDir;

    try {
      await fs.access(dir);
      const files = await fs.readdir(dir);

      for (const file of files) {
        const filepath = path.join(dir, file);
        await fs.unlink(filepath);
      }
    } catch {
      // 目录不存在，忽略
    }
  }
}

/**
 * 单例实例
 */
export const outputManager = new OutputManagerService();
