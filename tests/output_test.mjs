#!/usr/bin/env bun
/**
 * Output 功能测试
 *
 * 测试论文输出到output目录的功能
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { promises as fs } from 'fs';
import * as path from 'path';

const TEST_OUTPUT_DIR = './test-output';

// 模拟输出管理器
class TestOutputManager {
  constructor(outputDir = TEST_OUTPUT_DIR) {
    this.outputDir = outputDir;
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .slice(0, 100);
  }

  async write(content, metadata) {
    const { type = 'paper', format = 'markdown' } = metadata;

    // 创建输出目录
    const targetDir = path.join(this.outputDir, type);
    await this.ensureDirectory(targetDir);

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const safeTitle = this.sanitizeFilename(metadata.title);
    const ext = format === 'markdown' ? 'md' : format;
    const filename = `${safeTitle}-${timestamp}.${ext}`;
    const filepath = path.join(targetDir, filename);

    // 写入文件
    await fs.writeFile(filepath, content, 'utf-8');

    return {
      success: true,
      filepath,
      size: content.length,
      metadata
    };
  }

  async clear() {
    try {
      await fs.rm(this.outputDir, { recursive: true, force: true });
    } catch {
      // 忽略错误
    }
  }
}

describe('Output 功能测试', () => {
  let outputManager;

  beforeAll(async () => {
    outputManager = new TestOutputManager();
    await outputManager.clear();
  });

  afterAll(async () => {
    await outputManager.clear();
  });

  it('应该创建output目录', async () => {
    const testDir = path.join(TEST_OUTPUT_DIR, 'paper');
    await outputManager.ensureDirectory(testDir);

    const exists = await fs.access(testDir).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('应该正确清理文件名', () => {
    const testCases = [
      ['Test Paper', 'Test-Paper'],
      ['Test/Paper:With"Special<Chars>', 'Test-Paper-With-Special-Chars-'],
      ['A'.repeat(200), 'A'.repeat(100)]
    ];

    testCases.forEach(([input, expected]) => {
      const result = outputManager.sanitizeFilename(input);
      expect(result).toBe(expected);
    });
  });

  it('应该将论文写入output目录', async () => {
    const paperContent = `# Test Paper

## Abstract
This is a test paper.

## Content
Test content here.`;

    const result = await outputManager.write(paperContent, {
      title: 'Test Paper',
      type: 'paper',
      format: 'markdown'
    });

    expect(result.success).toBe(true);
    expect(result.filepath).toContain('output');
    expect(result.filepath).toContain('.md');

    // 验证文件存在
    const exists = await fs.access(result.filepath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // 验证文件内容
    const savedContent = await fs.readFile(result.filepath, 'utf-8');
    expect(savedContent).toBe(paperContent);
  });

  it('应该支持多种输出格式', async () => {
    const formats = ['markdown', 'html', 'json', 'txt'];

    for (const format of formats) {
      const content = `Test content in ${format} format`;
      const result = await outputManager.write(content, {
        title: `Test ${format} output`,
        type: 'paper',
        format
      });

      expect(result.success).toBe(true);
      expect(result.filepath).toContain(`.${format === 'markdown' ? 'md' : format}`);
    }
  });

  it('应该支持中文标题', async () => {
    const content = '# 深度学习在医疗领域的应用研究\n\n这是测试内容。';
    const result = await outputManager.write(content, {
      title: '深度学习在医疗领域的应用研究',
      type: 'paper',
      format: 'markdown'
    });

    expect(result.success).toBe(true);
    expect(result.filepath).toContain('深度学习在医疗领域的应用研究');

    const savedContent = await fs.readFile(result.filepath, 'utf-8');
    expect(savedContent).toContain('深度学习在医疗领域的应用研究');
  });

  it('应该支持批量输出多个文件', async () => {
    const papers = [
      { title: 'Paper 1', content: '# Paper 1\n\nContent 1' },
      { title: 'Paper 2', content: '# Paper 2\n\nContent 2' },
      { title: 'Paper 3', content: '# Paper 3\n\nContent 3' }
    ];

    const results = [];
    for (const paper of papers) {
      const result = await outputManager.write(paper.content, {
        title: paper.title,
        type: 'paper',
        format: 'markdown'
      });
      results.push(result);
    }

    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });

  it('应该正确计算文件大小', async () => {
    const content = 'A'.repeat(1000);
    const result = await outputManager.write(content, {
      title: 'Size Test Paper',
      type: 'paper',
      format: 'txt'
    });

    expect(result.size).toBe(1000);
  });

  it('应该在子目录中组织文件', async () => {
    const result = await outputManager.write('Test content', {
      title: 'Organized Paper',
      type: 'review',
      format: 'markdown'
    });

    expect(result.filepath).toContain(path.join('output', 'review'));
  });
});

describe('CLI 输出功能测试', () => {
  it('应该验证CLI具有输出功能', async () => {
    const cliPath = './academic-cli.mjs';
    const cliContent = await fs.readFile(cliPath, 'utf-8');

    // 验证包含输出相关的函数
    expect(cliContent).toContain('saveOutput');
    expect(cliContent).toContain('ensureOutputDir');
    expect(cliContent).toContain('outputDir');

    // 验证配置中有自动保存选项
    expect(cliContent).toContain('autoSave');
  });

  it('应该验证CLI使用fs模块进行文件写入', async () => {
    const cliPath = './academic-cli.mjs';
    const cliContent = await fs.readFile(cliPath, 'utf-8');

    expect(cliContent).toMatch(/import.*fs.*/);
    expect(cliContent).toContain('writeFile');
  });
});

describe('Output Manager Service 测试', () => {
  it('应该验证OutputManagerService存在', async () => {
    const servicePath = './packages/services/src/output/output-manager.service.ts';
    const exists = await fs.access(servicePath).then(() => true).catch(() => false);

    expect(exists).toBe(true);
  });

  it('应该验证OutputManagerService导出正确', async () => {
    const servicePath = './packages/services/src/output/output-manager.service.ts';
    const content = await fs.readFile(servicePath, 'utf-8');

    expect(content).toContain('OutputManagerService');
    expect(content).toContain('writePaper');
    expect(content).toContain('writeMarkdownPaper');
    expect(content).toContain('writeMultipleFormats');
  });
});

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║           📝 Output 功能测试套件                              ║');
console.log('║                                                              ║');
console.log('║  测试论文输出到output目录的功能                               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
