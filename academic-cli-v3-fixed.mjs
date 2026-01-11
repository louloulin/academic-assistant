#!/usr/bin/env bun
// Academic Assistant CLI V3.1 - Simplified & Working
// Fixed version that actually works by using user's direct request

import { query } from '@anthropic-ai/claude-agent-sdk';
import { promises as fs } from 'fs';
import * as path from 'path';

const CONFIG = {
  model: 'claude-sonnet-4-5',
  maxTurns: 10,
  timeout: 300000,
  outputDir: './output',
  autoSave: true,
};

// ============================================================================
// Output Manager
// ============================================================================

class OutputManager {
  constructor(config) {
    this.config = config;
  }

  async ensureOutputDir() {
    const dir = this.config.outputDir;
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async save(content, userRequest) {
    if (!this.config.autoSave) return null;

    await this.ensureOutputDir();

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const safeTitle = userRequest.slice(0, 30).replace(/[<>:"/\\|?*]/g, '-');
    const filename = `task-${safeTitle}-${timestamp}.md`;
    const filepath = path.join(this.config.outputDir, filename);

    let output = `# 任务: ${userRequest}\n\n`;
    output += `**生成时间**: ${new Date().toISOString()}\n\n`;
    output += `---\n\n`;
    output += content;

    await fs.writeFile(filepath, output, 'utf-8');
    console.log(`\n💾 输出已保存到: ${filepath}\n`);

    return filepath;
  }
}

// ============================================================================
// Main CLI Logic
// ============================================================================

async function processRequest(userRequest) {
  const startTime = Date.now();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          🎓 学术助手 CLI V3.1 - 简化工作版                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`📝 任务: ${userRequest}\n`);

  // ✅ 关键修复：直接使用用户的具体请求，而不是抽象的任务描述
  const prompt = `你是学术研究助手，请完成以下任务。

## 用户请求
${userRequest}

## 任务要求

请详细完成上述任务，提供：

1. **结构化的输出** - 使用标题、列表、表格等格式
2. **具体的例子** - 提供实际案例、数据、引用
3. **深入的分析** - 不要泛泛而谈，要深入具体
4. **可操作的建议** - 提供明确的步骤和指导

## 可用工具

- **WebSearch**: 搜索最新的学术信息
- **WebFetch**: 获取网页内容
- **Read**: 读取本地文件
- **Write**: 写入文件保存结果
- **Bash**: 执行必要的命令

## 输出要求

- 内容要丰富、详细、有价值
- 避免空泛的描述
- 提供具体的参考文献或数据来源
- 使用 Markdown 格式组织内容

请开始执行任务，提供完整的输出。`;

  try {
    console.log('🤖 正在处理...\n');

    const response = await query({
      prompt,
      options: {
        model: CONFIG.model,
        maxTurns: CONFIG.maxTurns,
        settingSources: ['user', 'project'],
        // ✅ 不使用 Skill 工具，直接提供实际工具
        // 这样可以确保 Claude 真正执行任务，而不是尝试调用其他 Skills
        allowedTools: ['WebSearch', 'WebFetch', 'Read', 'Write', 'Bash', 'Edit'],
      }
    });

    // 收集输出
    let content = '';
    let messageCount = 0;
    let charCount = 0;

    console.log('📄 输出:\n');
    console.log('─'.repeat(70) + '\n');

    for await (const message of response) {
      if (message.type === 'text') {
        messageCount++;
        const text = message.text;
        charCount += text.length;
        process.stdout.write(text);
        content += text;
      }
    }

    console.log('\n' + '─'.repeat(70));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const wordCount = content.split(/\s+/).length;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log(`║  ✅ 处理完成！                                                ║`);
    console.log(`║  📊 统计:                                                   ║`);
    console.log(`║     • 消息数: ${String(messageCount).padStart(20)}                          ║`);
    console.log(`║     • 字符数: ${String(charCount).padStart(20)}                          ║`);
    console.log(`║     • 字数: ${String(wordCount).padStart(22)}                          ║`);
    console.log(`║     • 耗时: ${String(elapsed + '秒').padStart(20)}                          ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // 自动保存
    if (CONFIG.autoSave) {
      const outputManager = new OutputManager(CONFIG);
      await outputManager.save(content, userRequest);
    }

    return content;

  } catch (error) {
    console.error('\n❌ 处理失败:', error.message);
    console.error('\n🔧 故障排除:');
    console.error('   1. 检查网络连接');
    console.error('   2. 确认 Claude API 密钥已配置');
    console.error('   3. 尝试简化您的请求');
    throw error;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  if (args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const userRequest = args.join(' ');

  try {
    await processRequest(userRequest);
  } catch (error) {
    console.error('\n💥 发生错误:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
📖 学术助手 CLI V3.1 - 使用方法

🚀 基本用法:
  bun run academic-cli-v3-fixed.mjs "您的请求"

💡 示例:

  # 文献搜索
  bun run academic-cli-v3-fixed.mjs "搜索关于深度学习在医疗领域应用的最新论文"

  # 期刊推荐
  bun run academic-cli-v3-fixed.mjs "推荐适合计算机科学论文的期刊，说明影响因子和投稿要求"

  # 论文写作
  bun run academic-cli-v3-fixed.mjs "帮我写一篇关于机器学习在自然语言处理中应用的论文大纲"

  # 数据分析
  bun run academic-cli-v3-fixed.mjs "分析以下实验数据并提供统计建议: [粘贴数据]"

  # 质量检查
  bun run academic-cli-v3-fixed.mjs "检查这段学术写作的质量并提供改进建议: [粘贴文本]"

✨ V3.1 改进:
  • 直接使用用户请求，不再有抽象的任务描述
  • 简化架构，确保输出完整
  • 添加详细统计信息
  • 改进错误处理

📚 更多信息:
  查看 PROBLEM_DIAGNOSIS_FINAL.md 了解问题分析和修复过程
`);
}

if (import.meta.main) {
  main().catch(console.error);
}

export { processRequest };
