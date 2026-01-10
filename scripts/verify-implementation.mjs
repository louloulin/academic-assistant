/**
 * 验证脚本 - Plan 3 实现验证
 */

import { getAgentDefinition, listAgentDefinitions } from '../packages/core/index.ts';
import { Logger, globalMetrics } from '../packages/infrastructure/index.ts';
import { MCPManagerService } from '../packages/infrastructure/src/mcp/mcp-manager.impl';
import { ConfigLoader } from '../packages/infrastructure/src/config/config-loader';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         🧪 验证脚本 - Plan 3 实现验证                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function verifyImplementation() {
  const logger = new Logger('Verification');
  const results = { passed: 0, failed: 0 };

  // 1. 验证 AgentDefinition Registry
  console.log('1️⃣  验证 AgentDefinition Registry');
  try {
    const agents = listAgentDefinitions();
    console.log(\`   ✓ 找到 \${agents.length} 个 AgentDefinitions\`);

    const litSearcher = getAgentDefinition('literature-searcher');
    if (litSearcher) {
      console.log(\`   ✓ literature-searcher AgentDefinition 存在\`);
      console.log(\`   ✓ 描述: \${litSearcher.description.substring(0, 50)}...\`);
      results.passed += 3;
    } else {
      console.log('   ✗ literature-searcher AgentDefinition 不存在');
      results.failed++;
    }
  } catch (error) {
    console.log(\`   ✗ AgentDefinition Registry 错误: \${error.message}\`);
    results.failed++;
  }
  console.log();

  // 2. 验证可观测性
  console.log('2️⃣  验证可观测性 (Logger & Metrics)');
  try {
    const testLogger = new Logger('Test');
    testLogger.info('Test log message');
    console.log('   ✓ Logger 工作正常');

    globalMetrics.recordAgentCall('test-agent', 1000, 500);
    const metrics = globalMetrics.getAgentMetrics('test-agent');
    if (metrics && metrics.calls === 1) {
      console.log('   ✓ MetricsCollector 工作正常');
      results.passed += 2;
    } else {
      console.log('   ✗ MetricsCollector 错误');
      results.failed++;
    }
  } catch (error) {
    console.log(\`   ✗ 可观测性错误: \${error.message}\`);
    results.failed++;
  }
  console.log();

  // 3. 验证 MCP Manager
  console.log('3️⃣  验证 MCP Manager Service');
  try {
    const mcpManager = new MCPManagerService();
    const connected = mcpManager.getConnectedServers();
    console.log(\`   ✓ MCP Manager 实例创建成功\`);
    console.log(\`   ✓ 当前连接的服务器: \${connected.length} 个\`);
    results.passed += 2;
  } catch (error) {
    console.log(\`   ✗ MCP Manager 错误: \${error.message}\`);
    results.failed++;
  }
  console.log();

  // 4. 验证配置加载器
  console.log('4️⃣  验证配置加载器');
  try {
    const configLoader = new ConfigLoader();
    const servers = await configLoader.loadMCPServers('./config/mcp-servers.yaml');
    console.log(\`   ✓ 加载了 \${servers.length} 个 MCP 服务器配置\`);
    if (servers.length > 0) {
      console.log(\`   ✓ 示例: \${servers[0].name} (\${servers[0].command})\`);
      results.passed += 2;
    } else {
      console.log('   ⚠️  未找到 MCP 服务器配置');
      results.passed++;
    }
  } catch (error) {
    console.log(\`   ✗ 配置加载器错误: \${error.message}\`);
    results.failed++;
  }
  console.log();

  // 5. 验证 SKILL.md 文件
  console.log('5️⃣  验证 SKILL.md 文件');
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const skills = ['literature-search', 'citation-manager', 'paper-structure'];
    for (const skill of skills) {
      const skillPath = path.join(process.cwd(), \`.claude/skills/\${skill}/SKILL.md\`);
      const content = await fs.readFile(skillPath, 'utf-8');

      if (content.includes('name:') && content.includes('description:')) {
        console.log(\`   ✓ \${skill}/SKILL.md 存在且格式正确\`);
        results.passed++;
      } else {
        console.log(\`   ✗ \${skill}/SKILL.md 格式错误\`);
        results.failed++;
      }
    }
  } catch (error) {
    console.log(\`   ✗ SKILL.md 验证错误: \${error.message}\`);
    results.failed++;
  }
  console.log();

  // 打印结果
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 验证结果                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(\`   ✅ 通过: \${results.passed}\`);
  console.log(\`   ❌ 失败: \${results.failed}\`);
  console.log(\`   📈 成功率: \${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\`);
  console.log();

  if (results.failed === 0) {
    console.log('🎉 所有验证通过！Plan 3 实现成功！');
  } else {
    console.log('⚠️  部分验证失败，需要修复');
  }

  // 打印指标摘要
  console.log();
  globalMetrics.printSummary();
}

verifyImplementation().catch(console.error);
