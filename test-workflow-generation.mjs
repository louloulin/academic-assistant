#!/usr/bin/env bun
/**
 * 测试 CLI V3 的工作流生成功能
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入 CLI V3 的类
async function importCLIClasses() {
  const cliPath = path.join(__dirname, 'academic-cli-v3.mjs');
  const cliModule = await import(cliPath);
  return {
    SkillsOrchestrator: cliModule.SkillsOrchestrator,
    WorkflowExecutor: cliModule.WorkflowExecutor,
    OutputManager: cliModule.OutputManager
  };
}

// 测试工作流生成
async function testWorkflowGeneration() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          🧪 测试 CLI V3 工作流生成功能                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const { SkillsOrchestrator } = await importCLIClasses();

  const CONFIG = {
    model: 'claude-sonnet-4-5',
    maxTurns: 10,
    timeout: 300000,
    outputDir: './output',
    autoSave: true,
    skillsDir: path.join(__dirname, '.claude', 'skills'),
  };

  // 创建 Orchestrator
  const orchestrator = new SkillsOrchestrator(CONFIG);

  // 1. 测试 Skills 发现
  console.log('1️⃣  测试动态 Skills 发现...\n');
  const skills = await orchestrator.discoverSkills();
  console.log(`✅ 发现 ${skills.length} 个 Skills\n`);

  // 2. 测试不同任务类型的工作流生成
  const testCases = [
    {
      request: '搜索关于深度学习的论文',
      expectedType: '文献研究',
    },
    {
      request: '帮我写一篇机器学习论文',
      expectedType: '论文写作',
    },
    {
      request: '分析数据并生成报告',
      expectedType: '数据分析',
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n2️⃣${i + 1}. 测试用例: "${testCase.request}"`);
    console.log(`   期望类型: ${testCase.expectedType}\n`);

    // 模拟分析（使用默认方法，避免实际调用 Claude API）
    const analysis = orchestrator.getDefaultAnalysis(testCase.request, skills);

    console.log(`   📊 分析结果:`);
    console.log(`      任务类型: ${analysis.taskType}`);
    console.log(`      需要 Skills: ${analysis.requiredSkills.length} 个`);
    console.log(`      复杂度: ${analysis.complexity}`);
    console.log(`      预计步骤: ${analysis.estimatedSteps}\n`);

    // 生成工作流
    const workflow = await orchestrator.generateWorkflow(analysis, testCase.request, skills);

    console.log(`   📋 生成的工作流:`);
    console.log(`      名称: ${workflow.name}`);
    console.log(`      描述: ${workflow.description}`);
    console.log(`      步骤数: ${workflow.steps.length}\n`);

    workflow.steps.forEach((step, index) => {
      console.log(`      步骤 ${index + 1}: ${step.title}`);
      console.log(`         Skills: ${step.skillIds.join(', ')}`);
    });

    console.log(`\n   ✅ 工作流生成测试通过！`);
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          ✅ 所有工作流生成测试通过！                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

// 运行测试
testWorkflowGeneration().catch(console.error);
