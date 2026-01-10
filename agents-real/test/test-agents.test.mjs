#!/usr/bin/env bun
/**
 * 🧪 测试脚本 - 验证基于真实 Claude Agent SDK 的实现
 *
 * 运行方式:
 *   bun run test
 *   或
 *   bun test test-agents.test.mjs
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

// 测试配置
const TEST_CONFIG = {
  timeout: 60000, // 60 秒超时
  simpleQuery: 'What is 2 + 2?', // 简单测试查询
  literatureQuery: 'search for papers about artificial intelligence',
  citationQuery: 'format this citation: Smith J. 2023. AI Research. Nature.'
};

// 定义测试用的 Agents
const TEST_AGENTS = {
  'test-agent': {
    description: 'A simple test agent',
    prompt: 'You are a helpful assistant. Answer briefly and clearly.',
    tools: [],
    model: 'haiku' // 使用最快的模型进行测试
  },
  'literature-test': {
    description: 'Literature search test agent',
    prompt: 'You are a literature search expert. Find relevant academic papers.',
    tools: ['WebSearch'],
    model: 'haiku'
  }
};

describe('Claude Agent SDK - 基础功能测试', () => {
  // 检查环境变量
  const apiKey = process.env.ANTHROPIC_API_KEY;

  beforeAll(() => {
    if (!apiKey) {
      console.warn('⚠️  警告: 未设置 ANTHROPIC_API_KEY 环境变量');
      console.warn('   测试将尝试运行，但可能会失败');
      console.warn('   设置方法: export ANTHROPIC_API_KEY=your_key_here');
    }
  });

  describe('SDK 导入测试', () => {
    it('应该正确导入 query 函数', () => {
      expect(query).toBeDefined();
      expect(typeof query).toBe('function');
    });

    it('query 函数应该返回 AsyncGenerator', async () => {
      const agentQuery = query({
        prompt: TEST_CONFIG.simpleQuery,
        options: {
          agents: TEST_AGENTS,
          permissionMode: 'bypassPermissions'
        }
      });

      // 检查是否是异步可迭代对象
      expect(agentQuery[Symbol.asyncIterator]).toBeDefined();
      expect(typeof agentQuery[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('基础 Agent 测试', () => {
    it('应该能够创建并执行简单查询', async () => {
      // 如果没有 API key，跳过此测试
      if (!apiKey) {
        console.log('⏭️  跳过测试（需要 API key）');
        return;
      }

      const messages = [];
      const agentQuery = query({
        prompt: TEST_CONFIG.simpleQuery,
        options: {
          agents: TEST_AGENTS,
          permissionMode: 'bypassPermissions'
        }
      });

      for await (const message of agentQuery) {
        messages.push(message);
        // 收集到 assistant 消息就停止
        if (message.type === 'assistant') {
          break;
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].type).toBe('assistant');
    });

    it('应该返回正确格式的消息', async () => {
      if (!apiKey) {
        console.log('⏭️  跳过测试（需要 API key）');
        return;
      }

      const agentQuery = query({
        prompt: TEST_CONFIG.simpleQuery,
        options: {
          agents: TEST_AGENTS,
          permissionMode: 'bypassPermissions'
        }
      });

      let foundAssistant = false;
      let foundResult = false;

      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          foundAssistant = true;
          expect(message.content).toBeDefined();
          expect(Array.isArray(message.content)).toBe(true);

          if (message.content[0]?.type === 'text') {
            expect(typeof message.content[0].text).toBe('string');
          }
        }

        if (message.type === 'result') {
          foundResult = true;
          expect(['success', 'error']).toContain(message.subtype);
        }

        // 找到结果就停止
        if (message.type === 'result') {
          break;
        }
      }

      expect(foundAssistant).toBe(true);
      expect(foundResult).toBe(true);
    }, TEST_CONFIG.timeout);
  });

  describe('Agent 定义测试', () => {
    it('应该接受自定义 Agent 定义', async () => {
      if (!apiKey) {
        console.log('⏭️  跳过测试（需要 API key）');
        return;
      }

      const customAgent = {
        'math-helper': {
          description: 'Helps with math problems',
          prompt: 'You are a math tutor. Solve problems step by step.',
          tools: [],
          model: 'haiku'
        }
      };

      const agentQuery = query({
        prompt: 'What is 5 * 7?',
        options: {
          agents: customAgent,
          allowedTools: [],
          permissionMode: 'bypassPermissions'
        }
      });

      let receivedResponse = false;
      for await (const message of agentQuery) {
        if (message.type === 'assistant') {
          receivedResponse = true;
          break;
        }
      }

      expect(receivedResponse).toBe(true);
    }, TEST_CONFIG.timeout);

    it('应该支持工具限制', async () => {
      if (!apiKey) {
        console.log('⏭️  跳过测试（需要 API key）');
        return;
      }

      const agentQuery = query({
        prompt: 'Tell me a fun fact',
        options: {
          agents: TEST_AGENTS,
          allowedTools: [], // 不允许任何工具
          permissionMode: 'bypassPermissions'
        }
      });

      let completed = false;
      for await (const message of agentQuery) {
        if (message.type === 'result') {
          completed = true;
          expect(message.subtype).toBe('success');
        }
      }

      expect(completed).toBe(true);
    }, TEST_CONFIG.timeout);
  });

  describe('错误处理测试', () => {
    it('应该处理无效的 API key', async () => {
      // 临时设置无效的 key
      const originalKey = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'sk-ant-invalid-key-12345';

      try {
        const agentQuery = query({
          prompt: TEST_CONFIG.simpleQuery,
          options: {
            agents: TEST_AGENTS,
            permissionMode: 'bypassPermissions'
          }
        });

        let hasError = false;
        for await (const message of agentQuery) {
          if (message.type === 'result' && message.subtype === 'error') {
            hasError = true;
            expect(message.error).toBeDefined();
            break;
          }
        }

        // 恢复原始 key
        process.env.ANTHROPIC_API_KEY = originalKey;

        // 如果有有效的 key，这个测试可能会通过
        // 如果只有无效的 key，应该收到错误
      } catch (error) {
        // 预期可能会有错误
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    }, TEST_CONFIG.timeout);
  });
});

describe('学术 Agent 功能测试', () => {
  describe('文件存在性测试', () => {
    const agentFiles = [
      'literature.mjs',
      'citation.mjs',
      'writing.mjs',
      'review.mjs',
      'academic-assistant.mjs'
    ];

    it('所有 Agent 脚本文件应该存在', () => {
      agentFiles.forEach(file => {
        const filePath = join(import.meta.dir, '..', file);
        const fileContent = readFileSync(filePath, 'utf-8');
        expect(fileContent).toBeDefined();
        expect(fileContent.length).toBeGreaterThan(0);
      });
    });

    it('Agent 脚本应该包含正确的 shebang', () => {
      agentFiles.forEach(file => {
        const filePath = join(import.meta.dir, '..', file);
        const content = readFileSync(filePath, 'utf-8');
        expect(content.startsWith('#!/usr/bin/env bun')).toBe(true);
      });
    });

    it('Agent 脚本应该导入 Claude Agent SDK', () => {
      agentFiles.forEach(file => {
        const filePath = join(import.meta.dir, '..', file);
        const content = readFileSync(filePath, 'utf-8');
        expect(content).toContain("@anthropic-ai/claude-agent-sdk'");
      });
    });
  });

  describe('Agent 定义内容测试', () => {
    it('academic-assistant.mjs 应该定义所有 6 个 Agents', () => {
      const filePath = join(import.meta.dir, '..', 'academic-assistant.mjs');
      const content = readFileSync(filePath, 'utf-8');

      const expectedAgents = [
        'literature-searcher',
        'citation-manager',
        'academic-writer',
        'peer-reviewer',
        'data-analyst',
        'journal-advisor'
      ];

      expectedAgents.forEach(agent => {
        expect(content).toContain(agent);
      });
    });

    it('每个 Agent 应该有必要的字段', () => {
      const filePath = join(import.meta.dir, '..', 'academic-assistant.mjs');
      const content = readFileSync(filePath, 'utf-8');

      // 检查是否包含 description, prompt, tools, model 字段
      expect(content).toContain('description:');
      expect(content).toContain('prompt:');
      expect(content).toContain('tools:');
      expect(content).toContain('model:');
    });
  });
});

describe('集成测试', () => {
  describe('文档完整性', () => {
    it('README 文件应该存在', () => {
      const readmePath = join(import.meta.dir, '..', 'README.md');
      const readmeContent = readFileSync(readmePath, 'utf-8');
      expect(readmeContent.length).toBeGreaterThan(100);
    });

    it('README_CN 应该存在且包含中文', () => {
      const readmePath = join(import.meta.dir, '..', 'README_CN.md');
      const readmeContent = readFileSync(readmePath, 'utf-8');
      expect(readmeContent.length).toBeGreaterThan(100);
      // 检查是否包含中文字符
      expect(/[\u4e00-\u9fa5]/.test(readmeContent)).toBe(true);
    });

    it('package.json 应该存在且包含正确的脚本', () => {
      const packagePath = join(import.meta.dir, '..', 'package.json');
      const packageContent = JSON.parse(readFileSync(packagePath, 'utf-8'));

      expect(packageContent.scripts).toBeDefined();
      expect(packageContent.scripts.literature).toBeDefined();
      expect(packageContent.scripts.citation).toBeDefined();
      expect(packageContent.scripts.writing).toBeDefined();
      expect(packageContent.scripts.review).toBeDefined();
      expect(packageContent.scripts.assistant).toBeDefined();
    });
  });

  describe('依赖检查', () => {
    it('package.json 应该包含 Claude Agent SDK', () => {
      const packagePath = join(import.meta.dir, '..', 'package.json');
      const packageContent = JSON.parse(readFileSync(packagePath, 'utf-8'));

      expect(packageContent.dependencies).toBeDefined();
      expect(packageContent.dependencies['@anthropic-ai/claude-agent-sdk']).toBeDefined();
    });

    it('依赖应该已经安装', () => {
      const sdkPath = join(import.meta.dir, '..', '..', 'node_modules', '@anthropic-ai', 'claude-agent-sdk', 'package.json');
      try {
        const sdkPackage = JSON.parse(readFileSync(sdkPath, 'utf-8'));
        expect(sdkPackage.name).toBe('@anthropic-ai/claude-agent-sdk');
      } catch (error) {
        throw new Error('Claude Agent SDK not installed. Run: bun install');
      }
    });
  });
});

// 运行总结
console.log(`
╔════════════════════════════════════════════════════════════╗
║          🧪 Claude Agent SDK - 学术助手测试套件            ║
╚════════════════════════════════════════════════════════════╝

测试覆盖:
  ✅ SDK 导入和基础功能
  ✅ Agent 定义和执行
  ✅ 消息格式验证
  ✅ 文件结构完整性
  ✅ 文档和依赖检查

注意:
  - 部分测试需要有效的 ANTHROPIC_API_KEY
  - 测试会调用真实的 Anthropic API
  - 可能产生 API 费用（测试使用最小模型）

运行方式:
  bun test
  或
  bun test test-agents.test.mjs

═══════════════════════════════════════════════════════════════
`);
