#!/usr/bin/env bun
/**
 * 简化版批量论文生成器
 * 用于演示批量生成功能
 */

import { RealPaperGenerator } from './lx-paper-generator.mjs';

class BatchPaperGenerator {
  constructor() {
    this.progressCallbacks = [];
  }

  /**
   * 批量生成论文
   */
  async generateBatch(topics, options = {}) {
    const {
      maxConcurrency = 3,
      continueOnError = true,
      exportFormat = 'markdown',
      outputDirectory = './demo/batch-output'
    } = options;

    console.log(`\n📚 开始批量生成 ${topics.length} 篇论文`);
    console.log(`⚙️  配置: 并行数=${maxConcurrency}, 格式=${exportFormat}\n`);

    const startTime = Date.now();
    const results = [];

    // 分批并行生成
    for (let i = 0; i < topics.length; i += maxConcurrency) {
      const batch = topics.slice(i, i + maxConcurrency);

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`批次 ${Math.floor(i / maxConcurrency) + 1}: 生成 ${batch.length} 篇论文`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const batchPromises = batch.map((topic, index) =>
        this.generateSinglePaper(topic, i + index, { exportFormat, outputDirectory })
          .catch(error => {
            console.log(`❌ [${i + index + 1}] ${topic}`);
            console.log(`   错误: ${error.message}\n`);
            if (!continueOnError) throw error;
            return { topic, status: 'failed', error: error.message };
          })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const duration = Date.now() - startTime;
    const summary = this.generateSummary(results, duration);

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
  async generateSinglePaper(topic, index, options) {
    const startTime = Date.now();
    console.log(`🔄 [${index + 1}] 正在生成: ${topic}`);

    const generator = new RealPaperGenerator();
    const paper = await generator.generatePaper(topic, 'review');

    // 保存论文
    const fs = await import('fs/promises');
    const path = await import('path');

    const dir = options.outputDirectory || './demo/batch-output';
    await fs.mkdir(dir, { recursive: true });

    const filename = `${topic.replace(/[<>:"/\\|?*]/g, '').substring(0, 30)}.md`;
    const filepath = path.join(dir, filename);

    const content = this.toMarkdown(paper, topic);
    await fs.writeFile(filepath, content, 'utf-8');

    const duration = Date.now() - startTime;
    console.log(`✅ [${index + 1}] 生成完成: ${topic} (${(duration / 1000).toFixed(2)}s)`);
    console.log(`   📁 ${filepath}\n`);

    return {
      topic,
      status: 'success',
      paper,
      duration,
      filepath
    };
  }

  /**
   * 转换为Markdown
   */
  toMarkdown(paper, topic) {
    const lines = [];

    lines.push(`# ${paper.metadata.title}\n`);
    lines.push(`**主题**: ${topic}\n`);
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`);
    lines.push(`**类型**: ${paper.metadata.paperType}\n`);
    lines.push(`**字数**: ${paper.metadata.wordCount} 字\n`);

    if (paper.abstract) {
      lines.push('## 摘要\n');
      lines.push(`${paper.abstract}\n`);
    }

    if (paper.keywords) {
      lines.push(`**关键词**: ${paper.keywords.join('、')}\n`);
    }

    lines.push('## 目录\n');
    Object.keys(paper.sections).forEach((name, i) => {
      lines.push(`${i + 1}. [${name}](#${name})`);
    });
    lines.push('');

    Object.entries(paper.sections).forEach(([name, content]) => {
      lines.push(`## ${name}\n`);
      lines.push(`${content}\n`);
    });

    if (paper.references) {
      lines.push('## 参考文献\n');
      lines.push(paper.references);
    }

    lines.push('\n---\n');
    lines.push('**质量指标**\n');
    if (paper.qualityMetrics) {
      lines.push(`- 总体评分: ${paper.qualityMetrics.overallScore}/100`);
      lines.push(`- 语法: ${paper.qualityMetrics.grammarScore}/100`);
      lines.push(`- 清晰度: ${paper.qualityMetrics.clarityScore}/100`);
      lines.push(`- 语气: ${paper.qualityMetrics.toneScore}/100`);
    }

    return lines.join('\n');
  }

  /**
   * 生成摘要统计
   */
  generateSummary(results, duration) {
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');

    const avgDuration = successful.length > 0
      ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
      : 0;

    return {
      successful: successful.length,
      failed: failed.length,
      averageDuration: avgDuration,
      totalWords: successful.length * 4500,
      successRate: results.length > 0 ? (successful.length / results.length).toFixed(2) : '0'
    };
  }

  /**
   * 注册进度回调
   */
  onProgress(callback) {
    this.progressCallbacks.push(callback);
  }

  /**
   * 通知进度
   */
  notifyProgress(progress) {
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  /**
   * 从文件加载主题
   */
  async loadTopicsFromFile(filepath) {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filepath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }

  /**
   * 保存主题到文件
   */
  async saveTopicsToFile(topics, filepath) {
    const fs = await import('fs/promises');
    const content = `# 论文主题列表\n生成时间: ${new Date().toLocaleString('zh-CN')}\n\n${topics.join('\n')}\n`;
    await fs.writeFile(filepath, content, 'utf-8');
  }
}

// 导出
export { BatchPaperGenerator };
