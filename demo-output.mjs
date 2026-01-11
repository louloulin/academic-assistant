#!/usr/bin/env bun
/**
 * Output 功能演示
 *
 * 演示如何使用 OutputManagerService 将论文写入 output 目录
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const OUTPUT_DIR = './output';

/**
 * 演示输出功能
 */
async function demoOutputFunctionality() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           📝 Output 功能演示                                 ║');
  console.log('║                                                              ║');
  console.log('║  演示如何将论文真实写入output目录                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. 创建输出目录
  console.log('📁 步骤 1: 创建输出目录结构');
  const dirs = ['paper', 'review', 'report', 'analysis'];
  for (const dir of dirs) {
    const dirPath = path.join(OUTPUT_DIR, dir);
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`   ✓ 创建目录: ${dirPath}`);
  }

  // 2. 生成示例论文
  console.log('\n📝 步骤 2: 生成示例论文内容');
  const samplePaper = `# 深度学习在医疗领域的应用研究

## 摘要

本研究综述了深度学习技术在医疗领域的最新应用进展。通过系统性分析50篇相关文献，我们识别了医学影像诊断、疾病预测、药物发现等关键应用场景。

**关键词**: 深度学习, 医疗AI, 医学影像, 疾病预测

## 1. 引言

近年来，深度学习技术在医疗领域取得了突破性进展。从医学影像分析到电子健康记录挖掘，AI技术正在改变传统的医疗诊断和治疗方式。

## 2. 主要应用领域

### 2.1 医学影像诊断

深度卷积神经网络（CNN）在X光、CT、MRI等医学影像分析中表现出色，准确率达到95%以上。

### 2.2 疾病预测

基于电子健康记录的深度学习模型可以预测患者未来疾病风险，实现早期干预。

### 2.3 药物发现

生成式深度学习模型加速了新药分子的设计和筛选过程。

## 3. 挑战与展望

尽管取得了显著进展，但仍面临数据隐私、模型可解释性、临床验证等挑战。

## 4. 结论

深度学习为医疗领域带来了革命性变化，未来将在精准医疗、智能诊断等方面发挥更大作用。

## 参考文献

1. LeCun Y, et al. (2023). Deep learning in medical imaging.
2. Zhang H, et al. (2024). AI-assisted disease prediction.
3. Wang X, et al. (2023). Generative models for drug discovery.
`;

  console.log(`   ✓ 论文字数: ${samplePaper.length} 字`);

  // 3. 写入论文到output目录
  console.log('\n💾 步骤 3: 将论文写入output目录');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `深度学习在医疗领域的应用研究-${timestamp}.md`;
  const filepath = path.join(OUTPUT_DIR, 'paper', filename);

  await fs.writeFile(filepath, samplePaper, 'utf-8');
  console.log(`   ✓ 文件已保存: ${filepath}`);

  // 4. 生成元数据
  console.log('\n📊 步骤 4: 生成论文元数据');
  const metadata = {
    title: '深度学习在医疗领域的应用研究',
    authors: ['AI学术助手'],
    date: new Date().toISOString(),
    type: 'paper',
    format: 'markdown',
    wordCount: samplePaper.length,
    keywords: ['深度学习', '医疗AI', '医学影像', '疾病预测']
  };

  const metadataPath = filepath.replace('.md', '.metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`   ✓ 元数据已保存: ${metadataPath}`);

  // 5. 验证文件
  console.log('\n✅ 步骤 5: 验证输出结果');
  const exists = await fs.access(filepath).then(() => true).catch(() => false);
  const stats = await fs.stat(filepath);

  console.log(`   ✓ 文件存在: ${exists}`);
  console.log(`   ✓ 文件大小: ${stats.size} 字节`);
  console.log(`   ✓ 创建时间: ${stats.mtime}`);

  // 6. 列出output目录内容
  console.log('\n📂 步骤 6: 列出output目录内容');
  for (const dir of dirs) {
    const dirPath = path.join(OUTPUT_DIR, dir);
    const files = await fs.readdir(dirPath).catch(() => []);
    if (files.length > 0) {
      console.log(`\n   ${dir}/`);
      files.forEach(file => {
        console.log(`     - ${file}`);
      });
    }
  }

  console.log('\n' + '─'.repeat(70));
  console.log('✅ Output 功能演示完成！');
  console.log('─'.repeat(70));
  console.log('\n💡 使用建议:');
  console.log('   1. 通过 CLI: bun run cli "您的请求"');
  console.log('   2. 查看 output/ 目录获取生成的文件');
  console.log('   3. 使用 OutputManagerService 进行程序化输出\n');
}

// 执行演示
demoOutputFunctionality().catch(console.error);
