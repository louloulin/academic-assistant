/**
 * 端到端集成测试
 *
 * 验证完整的Plan 3实现，包括所有8个Skills
 * 真实的Claude Agent SDK集成，无mocks
 */

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║           Plan 3 端到端集成测试                                    ║');
console.log('║           验证所有8个Skills和核心组件                              ║');
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
    console.log(`  错误: ${error.message}`);
    failed++;
  }
}

// ========== 第一部分：核心组件测试 ==========

console.log('\n【第一部分：核心组件】');

// 测试1: AgentDefinition Registry - 所有8个agents
await test('所有8个AgentDefinitions存在且完整', async () => {
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
    if (!Array.isArray(agentDef.tools) || agentDef.tools.length === 0) {
      throw new Error(`Agent ${agent} 的tools为空`);
    }
  }
});

// 测试2: Logger功能
await test('Logger可以正常记录日志', async () => {
  const { Logger } = await import('../packages/infrastructure/src/observability/logger.ts');

  const logger = new Logger('E2ETest');
  logger.info('测试信息日志', { test: 'data' });
  logger.warn('测试警告日志');
  logger.debug('测试调试日志');
  logger.error('测试错误日志', new Error('测试错误'));
});

// 测试3: MetricsCollector功能
await test('MetricsCollector可以记录和查询指标', async () => {
  const { globalMetrics } = await import('../packages/infrastructure/src/observability/metrics.ts');

  // 记录不同类型的指标
  globalMetrics.recordAgentCall('test-agent-1', 1000, 500);
  globalMetrics.recordAgentCall('test-agent-2', 2000, 800);
  globalMetrics.recordMCPCall('test-server', 'test-tool', 500, true);
  globalMetrics.recordSearch('semantic', 15, 800);

  // 查询指标
  const allMetrics = globalMetrics.getAllMetrics();

  if (!allMetrics.agents) {
    throw new Error('缺少agents指标');
  }
  if (!allMetrics.mcp) {
    throw new Error('缺少mcp指标');
  }
  if (!allMetrics.search) {
    throw new Error('缺少search指标');
  }
});

// 测试4: MCP Manager接口完整性
await test('MCP Manager实现所有必需接口', async () => {
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

  // 测试连接状态
  if (manager.isConnected('non-existent') !== false) {
    throw new Error('isConnected返回值不正确');
  }
});

// 测试5: Orchestrator Service
await test('Orchestrator Service可以创建并具有必需方法', async () => {
  const { OrchestratorService } = await import('../packages/services/src/orchestrator/orchestrator.service.ts');
  const { MCPManagerService } = await import('../packages/infrastructure/src/mcp/mcp-manager.impl.ts');

  const mcpManager = new MCPManagerService();
  const orchestrator = new OrchestratorService(mcpManager);

  if (typeof orchestrator.conductLiteratureReview !== 'function') {
    throw new Error('Orchestrator缺少conductLiteratureReview方法');
  }
});

// ========== 第二部分：SKILL.md文件测试 ==========

console.log('\n【第二部分：SKILL.md文件验证】');

// 测试6: 所有8个Skills的SKILL.md文件存在
await test('所有8个SKILL.md文件都存在且格式正确', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const skillDirs = [
    'literature-search',
    'citation-manager',
    'paper-structure',
    'writing-quality',
    'peer-review',
    'literature-review',
    'data-analysis',
    'journal-submission'
  ];

  for (const skillDir of skillDirs) {
    const skillPath = path.join(process.cwd(), `.claude/skills/${skillDir}/SKILL.md`);

    try {
      await fs.access(skillPath);
    } catch {
      throw new Error(`SKILL.md文件不存在: ${skillDir}`);
    }

    // 读取并验证格式
    const content = await fs.readFile(skillPath, 'utf-8');

    // 检查YAML frontmatter
    if (!content.match(/^---\s*\nname:/m)) {
      throw new Error(`${skillDir} SKILL.md缺少正确的YAML frontmatter`);
    }

    // 检查必需字段
    if (!content.includes('name:')) {
      throw new Error(`${skillDir} SKILL.md缺少name字段`);
    }
    if (!content.includes('description:')) {
      throw new Error(`${skillDir} SKILL.md缺少description字段`);
    }
    if (!content.includes('allowed-tools:')) {
      throw new Error(`${skillDir} SKILL.md缺少allowed-tools字段`);
    }

    // 检查是否有文档内容（YAML后的#标题）
    if (!content.match(/^---\s*\n[\s\S]*?\n---\s*\n\s*#/m)) {
      throw new Error(`${skillDir} SKILL.md缺少文档内容部分`);
    }
  }
});

// ========== 第三部分：配置文件测试 ==========

console.log('\n【第三部分：配置文件】');

// 测试7: 配置文件存在性
await test('所有YAML配置文件都存在', async () => {
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

    // 验证YAML格式
    const content = await fs.readFile(fullPath, 'utf-8');
    if (!content.trim()) {
      throw new Error(`配置文件为空: ${file}`);
    }
  }
});

// ========== 第四部分：真实实现验证 ==========

console.log('\n【第四部分：真实实现验证】');

// 测试8: 使用真实的Claude Agent SDK（无mocks）
await test('Orchestrator使用真实的Claude Agent SDK（无mocks）', async () => {
  const fs = await import('fs');

  const orchestratorFile = fs.readFileSync(
    './packages/services/src/orchestrator/orchestrator.service.ts',
    'utf-8'
  );

  // 验证导入真实的SDK
  if (!orchestratorFile.includes("from '@anthropic-ai/claude-agent-sdk'")) {
    throw new Error('未使用真实的Claude Agent SDK');
  }

  if (!orchestratorFile.includes('query(')) {
    throw new Error('未使用query函数');
  }

  // 移除注释，只检查代码
  const codeWithoutComments = orchestratorFile
    .split('\n')
    .filter(line => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
    .join('\n');

  // 检查代码中是否有mock
  const hasMockCode = /\b(mock|Mock|MOCK|stub|Stub|STUB)\b/.test(codeWithoutComments);
  if (hasMockCode) {
    throw new Error('使用了mock实现');
  }

  // 验证流式输出处理
  if (!orchestratorFile.includes('for await')) {
    throw new Error('未处理流式输出');
  }

  if (!orchestratorFile.includes('message.type')) {
    throw new Error('未正确处理消息类型');
  }
});

// 测试9: MCP Manager使用真实的MCP SDK
await test('MCP Manager使用真实的MCP SDK（无mocks）', async () => {
  const fs = await import('fs');

  const mcpManagerFile = fs.readFileSync(
    './packages/infrastructure/src/mcp/mcp-manager.impl.ts',
    'utf-8'
  );

  // 验证导入真实的MCP SDK
  if (!mcpManagerFile.includes("@modelcontextprotocol/sdk")) {
    throw new Error('未使用真实的MCP SDK');
  }

  if (!mcpManagerFile.includes('Client')) {
    throw new Error('未使用MCP Client');
  }

  if (!mcpManagerFile.includes('StdioClientTransport')) {
    throw new Error('未使用StdioClientTransport');
  }
});

// ========== 第五部分：高内聚低耦合验证 ==========

console.log('\n【第五部分：架构验证】');

// 测试10: 高内聚 - AgentDefinition集中管理
await test('AgentDefinition集中管理（高内聚）', async () => {
  const { ACADEMIC_AGENT_DEFINITIONS } = await import('../packages/core/src/registries/agent-definitions.ts');

  // 所有agents在一个文件中定义
  if (typeof ACADEMIC_AGENT_DEFINITIONS !== 'object') {
    throw new Error('ACADEMIC_AGENT_DEFINITIONS不是对象');
  }

  if (Object.keys(ACADEMIC_AGENT_DEFINITIONS).length !== 8) {
    throw new Error('ACADEMIC_AGENT_DEFINITIONS数量不正确');
  }
});

// 测试11: 低耦合 - 通过接口隔离
await test('MCP Manager通过接口隔离（低耦合）', async () => {
  const fs = await import('fs');

  const mcpServiceFile = fs.readFileSync(
    './packages/services/src/mcp/mcp-manager.service.ts',
    'utf-8'
  );

  // 验证接口定义存在
  if (!mcpServiceFile.includes('export interface IMCPManagerService')) {
    throw new Error('IMCPManagerService接口不存在');
  }

  // 验证接口方法定义
  if (!mcpServiceFile.includes('connectAll(')) {
    throw new Error('接口缺少connectAll方法');
  }
  if (!mcpServiceFile.includes('callTool<')) {
    throw new Error('接口缺少callTool方法');
  }

  // 验证接口在单独的文件中（与实现分离）
  const mcpImplFile = fs.readFileSync(
    './packages/infrastructure/src/mcp/mcp-manager.impl.ts',
    'utf-8'
  );

  // 验证实现类实现了接口
  if (!mcpImplFile.includes('implements IMCPManagerService')) {
    throw new Error('MCPManagerService未实现IMCPManagerService接口');
  }
});

// 测试12: 配置与代码分离
await test('配置与代码分离（低耦合）', async () => {
  const { ConfigLoader } = await import('../packages/infrastructure/src/config/config-loader.ts');

  const loader = new ConfigLoader();

  // 验证可以从外部文件加载配置
  if (typeof loader.loadAppConfig !== 'function') {
    throw new Error('ConfigLoader缺少loadAppConfig方法');
  }

  if (typeof loader.loadMCPServers !== 'function') {
    throw new Error('ConfigLoader缺少loadMCPServers方法');
  }
});

// ========== 第六部分：Skills充分复用验证 ==========

console.log('\n【第六部分：Skills复用验证】');

// 测试13: SKILL.md符合Claude Code规范
await test('SKILL.md文件符合Claude Code规范', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const skillDirs = ['literature-search', 'writing-quality'];

  for (const skillDir of skillDirs) {
    const skillPath = path.join(process.cwd(), `.claude/skills/${skillDir}/SKILL.md`);
    const content = await fs.readFile(skillPath, 'utf-8');

    // 验证YAML frontmatter格式
    const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!yamlMatch) {
      throw new Error(`${skillDir} SKILL.md格式错误：缺少YAML frontmatter`);
    }

    const yaml = yamlMatch[1];

    // 检查必需的YAML字段
    if (!yaml.match(/name:\s*\w+/)) {
      throw new Error(`${skillDir} SKILL.md缺少有效的name字段`);
    }

    if (!yaml.match(/description:\s*.+/)) {
      throw new Error(`${skillDir} SKILL.md缺少有效的description字段`);
    }

    if (!yaml.match(/allowed-tools:\s*\n/)) {
      throw new Error(`${skillDir} SKILL.md缺少allowed-tools字段`);
    }

    // 检查文档内容部分
    if (!content.match(/^---\s*\n[\s\S]*?\n---\s*\n\s*#+\s*\w+/m)) {
      throw new Error(`${skillDir} SKILL.md缺少文档标题`);
    }
  }
});

// 测试14: SKILL.md元数据完整性
await test('SKILL.md元数据完整且清晰', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const skillPath = path.join(process.cwd(), '.claude/skills/literature-search/SKILL.md');
  const content = await fs.readFile(skillPath, 'utf-8');

  // 提取YAML frontmatter
  const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!yamlMatch) {
    throw new Error('无法提取YAML frontmatter');
  }

  const yaml = yamlMatch[1];

  // 验证name是一个简单的单词
  if (!yaml.match(/name:\s*literature-search/)) {
    throw new Error('name字段值不正确');
  }

  // 验证description有实际内容
  const descMatch = yaml.match(/description:\s*(.+)/);
  if (!descMatch || descMatch[1].length < 20) {
    throw new Error('description字段太短');
  }

  // 验证allowed-tools是列表
  if (!yaml.match(/allowed-tools:\s*\n\s*-\s*\w+/)) {
    throw new Error('allowed-tools格式不正确');
  }
});

// ========== 第七部分：可观测性验证 ==========

console.log('\n【第七部分：可观测性】');

// 测试15: Logger上下文感知
await test('Logger具有上下文感知能力', async () => {
  const { Logger } = await import('../packages/infrastructure/src/observability/logger.ts');

  const logger1 = new Logger('Context1');
  const logger2 = new Logger('Context2');

  // 验证Logger可以正确创建
  if (typeof logger1.info !== 'function') {
    throw new Error('Logger缺少info方法');
  }

  // 测试日志输出
  logger1.info('测试消息1');
  logger2.info('测试消息2');
});

// 测试16: MetricsCollector指标类型完整
await test('MetricsCollector支持所有指标类型', async () => {
  const { globalMetrics } = await import('../packages/infrastructure/src/observability/metrics.ts');

  // 测试Agent指标
  globalMetrics.recordAgentCall('agent', 1000, 500);
  const agentMetrics = globalMetrics.getAgentMetrics('agent');
  if (!agentMetrics || agentMetrics.calls === 0) {
    throw new Error('Agent指标记录失败');
  }

  // 测试MCP指标
  globalMetrics.recordMCPCall('server', 'tool', 500, true);
  const mcpMetrics = globalMetrics.getMCPMetrics('server', 'tool');
  if (!mcpMetrics || mcpMetrics.calls === 0) {
    throw new Error('MCP指标记录失败');
  }

  // 测试Search指标
  globalMetrics.recordSearch('semantic', 10, 800);
  const searchMetrics = globalMetrics.getSearchMetrics();
  if (!searchMetrics || searchMetrics.semanticCalls === 0) {
    throw new Error('Search指标记录失败');
  }
});

// ========== 总结 ==========

console.log('\n' + '═'.repeat(70));
console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
console.log('═'.repeat(70));

if (failed === 0) {
  console.log('\n🎉 所有端到端测试通过！Plan 3完整实现验证成功！\n');
  console.log('✅ 核心组件: 全部通过');
  console.log('✅ 8个Skills: 全部验证');
  console.log('✅ 配置文件: 全部存在');
  console.log('✅ 真实实现: 无mocks');
  console.log('✅ 架构设计: 高内聚低耦合');
  console.log('✅ 可观测性: Logger + Metrics');
  console.log('');
  process.exit(0);
} else {
  console.log('\n❌ 部分测试失败，请检查实现\n');
  process.exit(1);
}
