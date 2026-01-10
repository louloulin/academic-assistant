/**
 * Plan 3 实现验证脚本
 *
 * 验证所有核心组件是否正常工作
 */

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║           Plan 3 实现完整性验证                                    ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

// 测试1: 核心包导入
await test('核心包可以正确导入', async () => {
  const core = await import('../packages/core/src/index.ts');
  if (!core.getAgentDefinition || !core.listAgentDefinitions) {
    throw new Error('核心包缺少必需的导出');
  }
});

// 测试2: AgentDefinition Registry
await test('AgentDefinition Registry包含8个agents', async () => {
  const { listAgentDefinitions, getAgentDefinition } = await import('../packages/core/src/registries/agent-definitions.ts');

  const agents = listAgentDefinitions();
  if (agents.length !== 8) {
    throw new Error(`期望8个agents，实际找到${agents.length}个`);
  }

  const requiredAgents = [
    'literature-searcher',
    'citation-manager',
    'paper-structure-advisor',
    'academic-writer',
    'literature-reviewer',
    'peer-reviewer',
    'data-analyst',
    'journal-advisor'
  ];

  for (const agent of requiredAgents) {
    const agentDef = getAgentDefinition(agent);
    if (!agentDef) {
      throw new Error(`缺少agent: ${agent}`);
    }
    if (!agentDef.description || !agentDef.prompt || !agentDef.tools) {
      throw new Error(`Agent ${agent} 缺少必需字段`);
    }
  }
});

// 测试3: Logger
await test('Logger正常工作', async () => {
  const { Logger } = await import('../packages/infrastructure/src/observability/logger.ts');

  const logger = new Logger('Test');
  if (typeof logger.info !== 'function') {
    throw new Error('Logger缺少info方法');
  }

  logger.info('Test message');
});

// 测试4: MetricsCollector
await test('MetricsCollector正常工作', async () => {
  const { globalMetrics } = await import('../packages/infrastructure/src/observability/metrics.ts');

  globalMetrics.recordAgentCall('test-agent', 1000, 500);
  const metrics = globalMetrics.getAllMetrics();

  if (!metrics.agents || !metrics.agents['test-agent']) {
    throw new Error('指标记录失败');
  }
});

// 测试5: MCP Manager接口
await test('MCP Manager实现所有接口方法', async () => {
  const { MCPManagerService } = await import('../packages/infrastructure/src/mcp/mcp-manager.impl.ts');

  const manager = new MCPManagerService();

  const requiredMethods = [
    'connectAll',
    'connect',
    'callTool',
    'listTools',
    'disconnectAll',
    'isConnected'
  ];

  for (const method of requiredMethods) {
    if (typeof manager[method] !== 'function') {
      throw new Error(`MCP Manager缺少方法: ${method}`);
    }
  }
});

// 测试6: Orchestrator Service
await test('Orchestrator Service可以创建', async () => {
  const { OrchestratorService } = await import('../packages/services/src/orchestrator/orchestrator.service.ts');
  const { MCPManagerService } = await import('../packages/infrastructure/src/mcp/mcp-manager.impl.ts');

  const mcpManager = new MCPManagerService();
  const orchestrator = new OrchestratorService(mcpManager);

  if (typeof orchestrator.conductLiteratureReview !== 'function') {
    throw new Error('Orchestrator缺少conductLiteratureReview方法');
  }
});

// 测试7: 类型导出
await test('Orchestrator导出正确的类型', async () => {
  const module = await import('../packages/services/index.ts');

  // 检查是否有导出
  if (!module.OrchestratorService) {
    throw new Error('Orchestrator缺少类导出');
  }

  // 类型导出在运行时不可用，只检查是否正确导入
  try {
    const { OrchestratorService } = module;
    if (typeof OrchestratorService !== 'function') {
      throw new Error('OrchestratorService不是类');
    }
  } catch (e) {
    throw new Error('Orchestrator导出失败');
  }
});

// 测试8: SKILL.md文件存在
await test('SKILL.md文件存在', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const skillFiles = [
    '.claude/skills/literature-search/SKILL.md',
    '.claude/skills/citation-manager/SKILL.md',
    '.claude/skills/paper-structure/SKILL.md'
  ];

  for (const file of skillFiles) {
    const fullPath = path.join(process.cwd(), file);
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(`SKILL.md文件不存在: ${file}`);
    }
  }
});

// 测试9: 配置文件存在
await test('配置文件存在', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const configFiles = [
    'config/mcp-servers.yaml',
    'config/default.yaml'
  ];

  for (const file of configFiles) {
    const fullPath = path.join(process.cwd(), file);
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(`配置文件不存在: ${file}`);
    }
  }
});

// 测试10: 真实实现验证（无mocks）
await test('使用真实的Claude Agent SDK（无mocks）', async () => {
  const fs = await import('fs');

  const orchestratorFile = fs.readFileSync(
    './packages/services/src/orchestrator/orchestrator.service.ts',
    'utf-8'
  );

  if (!orchestratorFile.includes("from '@anthropic-ai/claude-agent-sdk'")) {
    throw new Error('未使用真实的Claude Agent SDK');
  }

  if (!orchestratorFile.includes('query(')) {
    throw new Error('未使用query函数');
  }

  // 移除注释，只检查代码部分
  const codeWithoutComments = orchestratorFile
    .split('\n')
    .filter(line => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
    .join('\n');

  // 检查代码中是否有mock（排除注释）
  const hasMockCode = /\b(mock|Mock|MOCK|stub|Stub|STUB)\b/.test(codeWithoutComments);
  if (hasMockCode) {
    throw new Error('使用了mock实现');
  }
});

// 总结
console.log('\n' + '═'.repeat(70));
console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
console.log('═'.repeat(70));

if (failed === 0) {
  console.log('\n🎉 所有测试通过！Plan 3实现验证成功！\n');
  process.exit(0);
} else {
  console.log('\n❌ 部分测试失败，请检查实现\n');
  process.exit(1);
}
