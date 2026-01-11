#!/usr/bin/env bun
/**
 * 🧪 诊断脚本 - 检查 CLI 环境配置
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║          🧪 CLI 环境诊断工具                                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 1. 检查环境变量
console.log('1️⃣  检查环境变量:');
console.log('─'.repeat(70));

const apiKey = process.env.ANTHROPIC_API_KEY;

if (apiKey) {
  const maskedKey = apiKey.slice(0, 8) + '...' + apiKey.slice(-4);
  console.log(`✅ ANTHROPIC_API_KEY: ${maskedKey}`);
  console.log(`   长度: ${apiKey.length} 字符`);
  console.log(`   格式: ${apiKey.startsWith('sk-ant-') ? '✅ 正确' : '❌ 错误'}`);
} else {
  console.log('❌ ANTHROPIC_API_KEY: 未设置');
  console.log('\n💡 解决方案:');
  console.log('   export ANTHROPIC_API_KEY=sk-ant-xxxxx');
}

console.log('\n');

// 2. 检查 Claude Agent SDK
console.log('2️⃣  检查 Claude Agent SDK:');
console.log('─'.repeat(70));

try {
  console.log('✅ @anthropic-ai/claude-agent-sdk: 已安装');

  // 读取 package.json 检查版本
  const packageJson = await import('./package.json');
  const deps = packageJson.default?.dependencies || {};
  const devDeps = packageJson.default?.devDependencies || {};

  const sdkVersion = deps['@anthropic-ai/claude-agent-sdk'] ||
                     devDeps['@anthropic-ai/claude-agent-sdk'];

  if (sdkVersion) {
    console.log(`   版本: ${sdkVersion}`);
  }
} catch (error) {
  console.log('❌ 无法读取 package.json');
}

console.log('\n');

// 3. 测试 Claude Agent SDK
console.log('3️⃣  测试 Claude Agent SDK:');
console.log('─'.repeat(70));

if (!apiKey) {
  console.log('⚠️  跳过测试（API 密钥未配置）');
  console.log('\n请先配置 API 密钥后再测试');
} else {
  console.log('🧪 测试 query() 函数...\n');

  try {
    const testPrompt = '请说"Hello, World!"，只输出这句话，不要其他内容。';

    const response = await query({
      prompt: testPrompt,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1,
      }
    });

    console.log('✅ query() 函数调用成功');
    console.log(`   响应类型: ${typeof response}`);
    console.log(`   AsyncIterable: ${Symbol.asyncIterator in Object(response) ? '是' : '否'}`);

    console.log('\n📨 接收响应:');
    console.log('─'.repeat(70));

    let messageCount = 0;
    let totalContent = '';

    for await (const message of response) {
      messageCount++;
      console.log(`\n消息 #${messageCount}:`);
      console.log(`  类型: ${message.type}`);

      if (message.type === 'text') {
        console.log(`  内容: ${message.text.substring(0, 100)}${message.text.length > 100 ? '...' : ''}`);
        totalContent += message.text;
      }
    }

    console.log('\n' + '─'.repeat(70));
    console.log(`\n✅ 测试成功!`);
    console.log(`   • 收到消息: ${messageCount} 条`);
    console.log(`   • 内容长度: ${totalContent.length} 字符`);
    console.log(`   • 预览: ${totalContent.substring(0, 50)}...`);

  } catch (error) {
    console.log('\n❌ 测试失败!');
    console.log(`   错误: ${error.message}`);
    console.log(`   类型: ${error.name}`);

    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n💡 可能的原因:');
      console.log('   • API 密钥无效或过期');
      console.log('   • 请检查 https://console.anthropic.com/');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('network')) {
      console.log('\n💡 可能的原因:');
      console.log('   • 网络连接问题');
      console.log('   • API 服务不可用');
    }
  }
}

console.log('\n');

// 4. 诊断结果
console.log('4️⃣  诊断结果:');
console.log('═'.repeat(70));

if (!apiKey) {
  console.log('❌ 问题: Claude API 密钥未配置');
  console.log('\n🔧 解决步骤:');
  console.log('   1. 访问 https://console.anthropic.com/');
  console.log('   2. 获取 API 密钥');
  console.log('   3. 运行: export ANTHROPIC_API_KEY=sk-ant-xxxxx');
  console.log('   4. 重新运行此诊断脚本');
} else {
  console.log('✅ API 密钥已配置');
  console.log('\n下一步:');
  console.log('   • 如果测试通过: CLI 应该可以正常工作');
  console.log('   • 如果测试失败: 检查 API 密钥是否有效');
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║          诊断完成                                           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
