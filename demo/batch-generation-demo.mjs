#!/usr/bin/env bun
/**
 * 批量论文生成演示
 *
 * 展示如何使用BatchPaperGenerator批量生成多篇论文
 */

import { BatchPaperGenerator } from './batch-paper-generator.mjs';

/**
 * 主函数
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           批量论文生成系统                                          ║');
  console.log('║           Plan 4 新功能演示                                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const batchGenerator = new BatchPaperGenerator();

  // 示例1: 直接指定主题列表
  console.log('📚 示例1: 批量生成3篇论文\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const topics1 = [
    '深度学习在计算机视觉中的应用',
    '自然语言处理技术的最新进展',
    '强化学习算法的优化方法'
  ];

  const result1 = await batchGenerator.generateBatch(topics1, {
    maxConcurrency: 2,  // 同时生成2篇
    exportFormats: ['markdown', 'json'],
    outputDirectory: './demo/batch-output/example1',
    continueOnError: true
  });

  displayResults(result1, topics1);

  // 示例2: 从文件加载主题
  console.log('\n\n📁 示例2: 从文件加载主题并批量生成\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const topics2 = [
    '图神经网络的原理与应用',
    'Transformer架构的改进研究',
    '自监督学习的最新突破'
  ];

  // 先保存主题到文件
  await batchGenerator.saveTopicsToFile(topics2, './demo/topics-list.txt');
  console.log('✅ 主题列表已保存到: ./demo/topics-list.txt\n');

  // 从文件加载并生成
  const loadedTopics = await batchGenerator.loadTopicsFromFile('./demo/topics-list.txt');
  console.log(`📖 从文件加载了 ${loadedTopics.length} 个主题\n`);

  // 注册进度回调
  batchGenerator.onProgress((progress) => {
    const percentage = ((progress.current / progress.total) * 100).toFixed(1);
    console.log(`  ⏳ 进度: ${progress.current}/${progress.total} (${percentage}%) - ${progress.topic}`);
  });

  const result2 = await batchGenerator.generateBatch(loadedTopics, {
    maxConcurrency: 3,
    exportFormats: ['markdown'],
    outputDirectory: './demo/batch-output/example2',
    saveProgress: true
  });

  displayResults(result2, topics2);

  // 示例3: 大规模批量生成（演示）
  console.log('\n\n🚀 示例3: 大规模批量生成演示\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const topics3 = [
    '机器学习模型的压缩技术',
    '知识图谱的构建与应用',
    '语音识别系统的优化',
    '自动驾驶的感知算法',
    '推荐系统的冷启动问题',
    '时间序列预测的深度学习方法',
    '医疗影像诊断的AI应用',
    '智能问答系统的设计'
  ];

  console.log(`📝 准备生成 ${topics3.length} 篇论文...\n`);
  console.log('⚙️  配置:');
  console.log('   - 并行数: 3');
  console.log('   - 导出格式: Markdown');
  console.log('   - 输出目录: ./demo/batch-output/example3\n');

  const result3 = await batchGenerator.generateBatch(topics3, {
    maxConcurrency: 3,
    exportFormats: ['markdown'],
    outputDirectory: './demo/batch-output/example3'
  });

  displayResults(result3, topics3);

  // 总结
  console.log('\n\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           批量生成总结                                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const totalPapers = result1.total + result2.total + result3.total;
  const totalSuccessful = result1.successful + result2.successful + result3.successful;
  const totalDuration = result1.duration + result2.duration + result3.duration;

  console.log(`📊 总体统计:`);
  console.log(`   - 总尝试: ${totalPapers} 篇`);
  console.log(`   - 成功: ${totalSuccessful} 篇`);
  console.log(`   - 失败: ${totalPapers - totalSuccessful} 篇`);
  console.log(`   - 成功率: ${((totalSuccessful / totalPapers) * 100).toFixed(1)}%`);
  console.log(`   - 总耗时: ${(totalDuration / 1000).toFixed(2)} 秒`);
  console.log(`   - 平均每篇: ${(totalDuration / totalPapers / 1000).toFixed(2)} 秒\n`);

  console.log('💡 使用建议:');
  console.log('   1. 根据硬件资源调整 maxConcurrency (推荐2-4)');
  console.log('   2. 使用 continueOnError 确保部分失败不影响整体');
  console.log('   3. 定期保存进度，避免长时间任务中断丢失');
  console.log('   4. 大批量生成建议分批进行，每批10-20篇\n');

  console.log('📁 输出文件位置:');
  console.log('   - ./demo/batch-output/example1/');
  console.log('   - ./demo/batch-output/example2/');
  console.log('   - ./demo/batch-output/example3/\n');

  console.log('✅ 批量生成演示完成！\n');
}

/**
 * 显示结果
 */
function displayResults(result, topics) {
  console.log('📊 生成结果:');
  console.log(`   总数: ${result.total}`);
  console.log(`   成功: ${result.successful} ✅`);
  console.log(`   失败: ${result.failed} ${result.failed > 0 ? '❌' : ''}`);
  console.log(`   成功率: ${result.summary.successRate}\n`);

  console.log('⏱️  时间统计:');
  console.log(`   总耗时: ${(result.duration / 1000).toFixed(2)} 秒`);
  console.log(`   平均每篇: ${(result.summary.averageDuration / 1000).toFixed(2)} 秒\n`);

  console.log('📝 详细结果:');
  result.results.forEach((r, i) => {
    const status = r.status === 'success' ? '✅' : '❌';
    const time = (r.duration / 1000).toFixed(2);
    console.log(`   ${status} [${i + 1}] ${r.topic.substring(0, 40)}... (${time}s)`);
    if (r.error) {
      console.log(`       错误: ${r.error}`);
    }
    if (r.filepath) {
      console.log(`       文件: ${r.filepath}`);
    }
  });

  console.log('');
}

// 执行主函数
main().catch(error => {
  console.error('\n❌ 发生错误:', error.message);
  console.error(error.stack);
  process.exit(1);
});
