/**
 * Batch Paper Generator Service
 *
 * 批量论文生成服务
 * 支持并行生成多篇论文，提高效率
 */

import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { Logger } from '@assistant/infrastructure/observability';
import { globalMetrics } from '@assistant/infrastructure/observability';

export interface BatchOptions {
  maxConcurrency?: number;      // 最大并行数，默认3
  continueOnError?: boolean;    // 出错后是否继续，默认true
  outputDirectory?: string;      // 输出目录
  exportFormats?: string[];      // 导出格式，默认['markdown']
  saveProgress?: boolean;        // 保存进度，默认true
}

export interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: PaperGenerationResult[];
  summary: BatchSummary;
  duration: number;
}

export interface PaperGenerationResult {
  topic: string;
  status: 'success' | 'failed';
  paper?: any;
  error?: string;
  duration: number;
  filepath?: string;
}

export interface BatchSummary {
  averageDuration: number;
  totalWords: number;
  successRate: number;
  formats: string[];
}

export interface ProgressCallback {
  (progress: {
    current: number;
    total: number;
    topic: string;
    status: 'generating' | 'completed' | 'failed';
  }): void;
}

/**
 * 批量论文生成器类
 */
export class BatchPaperGeneratorService {
  private logger = new Logger('BatchGenerator');
  private progressCallbacks: ProgressCallback[] = [];

  /**
   * 批量生成论文
   */
  async generateBatch(
    topics: string[],
    options: BatchOptions = {}
  ): Promise<BatchResult> {
    const {
      maxConcurrency = 3,
      continueOnError = true,
      exportFormats = ['markdown'],
      saveProgress = true
    } = options;

    this.logger.info('开始批量生成论文', {
      topicCount: topics.length,
      maxConcurrency,
      continueOnError,
      exportFormats
    });

    const startTime = Date.now();
    const results: PaperGenerationResult[] = [];
    const orchestrator = new OrchestratorService(null); // MCP Manager可选

    // 分批并行生成
    for (let i = 0; i < topics.length; i += maxConcurrency) {
      const batch = topics.slice(i, i + maxConcurrency);
      const batchPromises = batch.map((topic, index) =>
        this.generateSinglePaper(topic, i + index, orchestrator, options)
          .catch(error => {
            this.logger.error('论文生成失败', error, { topic });
            if (!continueOnError) throw error;
            return {
              topic,
              status: 'failed',
              error: error.message,
              duration: 0
            };
          })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 报告进度
      this.notifyProgress({
        current: Math.min(i + maxConcurrency, topics.length),
        total: topics.length,
        topic: batch[0],
        status: 'generating'
      });
    }

    const duration = Date.now() - startTime;
    const summary = this.generateSummary(results, duration);

    this.logger.info('批量生成完成', {
      total: results.length,
      successful: summary.successful,
      failed: summary.failed,
      duration
    });

    return {
      total: results.length,
      successful: summary.successful,
      failed: summary.failed,
      results,
      summary,
      duration
    };
  }

  /**
   * 生成单篇论文
   */
  private async generateSinglePaper(
    topic: string,
    index: number,
    orchestrator: OrchestratorService,
    options: BatchOptions
  ): Promise<PaperGenerationResult> {
    const startTime = Date.now();

    this.logger.info(`[${index + 1}] 开始生成: ${topic}`);

    this.notifyProgress({
      current: index + 1,
      total: 0, // 未知总数
      topic,
      status: 'generating'
    });

    // 1. 生成论文
    const paper = await orchestrator.conductLiteratureReview(topic, {
      maxPapers: 50
    });

    // 2. 导出格式
    const filepaths: string[] = [];
    if (options.exportFormats) {
      for (const format of options.exportFormats) {
        const filepath = await this.exportPaper(paper, format, options.outputDirectory);
        filepaths.push(filepath);
      }
    }

    const duration = Date.now() - startTime;

    this.logger.info(`[${index + 1}] 生成完成: ${topic}`, { duration });

    return {
      topic,
      status: 'success',
      paper,
      duration,
      filepath: filepaths[0]
    };
  }

  /**
   * 导出论文
   */
  private async exportPaper(paper: any, format: string, outputDir?: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const dir = outputDir || './demo/batch-output';
    await fs.mkdir(dir, { recursive: true });

    const filename = `${paper.metadata.title.replace(/[<>:"/\\|?*]/g, '')}.${format}`;
    const filepath = path.join(dir, filename);

    let content: string;
    switch (format) {
      case 'markdown':
        content = this.toMarkdown(paper);
        break;
      case 'json':
        content = JSON.stringify(paper, null, 2);
        break;
      default:
        throw new Error(`不支持的格式: ${format}`);
    }

    await fs.writeFile(filepath, content, 'utf-8');
    return filepath;
  }

  /**
   * 转换为Markdown
   */
  private toMarkdown(paper: any): string {
    const lines: string[] = [];

    lines.push(`# ${paper.metadata.title}\n`);
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`);
    lines.push(`**论文类型**: ${paper.metadata.paperType}\n`);

    if (paper.abstract) {
      lines.push('## 摘要\n');
      lines.push(`${paper.abstract}\n`);
    }

    if (paper.synthesis) {
      lines.push('## 主要发现\n');
      lines.push(`${paper.synthesis}\n`);
    }

    return lines.join('\n');
  }

  /**
   * 生成摘要统计
   */
  private generateSummary(results: PaperGenerationResult[], duration: number): any {
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');

    const avgDuration = successful.length > 0
      ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
      : 0;

    return {
      successful: successful.length,
      failed: failed.length,
      averageDuration: Math.round(avgDuration),
      totalWords: successful.length * 4500, // 估算
      successRate: results.length > 0 ? (successful.length / results.length * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 注册进度回调
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * 通知进度
   */
  private notifyProgress(progress: any): void {
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  /**
   * 从文件加载主题列表
   */
  async loadTopicsFromFile(filepath: string): Promise<string[]> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filepath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // 过滤空行和注释
  }

  /**
   * 保存主题列表
   */
  async saveTopicsToFile(topics: string[], filepath: string): Promise<void> {
    const fs = await import('fs/promises');
    const content = `# 论文主题列表\n生成时间: ${new Date().toLocaleString('zh-CN')}\n\n${topics.join('\n')}\n`;
    await fs.writeFile(filepath, content, 'utf-8');
  }
}
