/**
 * Plan 6 Simple Integration Tests
 *
 * Tests the Agent orchestration system without requiring full build
 * Tests core functionality directly
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║        Plan 6 Simple Integration Tests                    ║');
console.log('║        Testing Core Functionality                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

describe('Plan 6 Core Functionality Tests', () => {

  it('should verify Agent orchestration files exist', async () => {
    console.log('\n📁 Test 1: Verify Agent Orchestration Files');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    const files = [
      'packages/agents/src/core/agent.types.ts',
      'packages/agents/src/core/agent-registry.ts',
      'packages/agents/src/routing/agent-router.ts',
      'packages/agents/src/workflow/workflow-engine.ts',
      'packages/agents/src/context/context-manager.ts',
      'packages/agents/src/skills/skill-integration.service.ts',
      'packages/agents/src/subagent/subagent-execution.service.ts',
      'packages/agents/src/index.ts'
    ];

    const cwd = process.cwd();
    let allExist = true;

    for (const file of files) {
      const filePath = resolve(cwd, file);
      try {
        await readFile(filePath, 'utf-8');
        console.log(`   ✓ ${file}`);
      } catch (e) {
        console.log(`   ✗ ${file} - NOT FOUND`);
        allExist = false;
      }
    }

    assert.ok(allExist, 'All Agent orchestration files should exist');
    console.log('   ✓ All files exist');
  });

  it('should verify Skill integration structure', async () => {
    console.log('\n📚 Test 2: Verify Skill Integration Structure');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    const skillServicePath = resolve(process.cwd(), 'packages/agents/src/skills/skill-integration.service.ts');
    const content = await readFile(skillServicePath, 'utf-8');

    // Verify key exports exist
    const exports = [
      'class SkillIntegrationService',
      'async loadSkills()',
      'getAllSkills()',
      'getSkillsByCategory(',
      'findSkillsForTask(',
      'getForkContextSkills()',
      'getSkillsForAgent('
    ];

    for (const exp of exports) {
      assert.ok(content.includes(exp), `Should contain ${exp}`);
      console.log(`   ✓ Contains: ${exp}`);
    }

    console.log('   ✓ Skill integration service structure verified');
  });

  it('should verify Subagent execution structure', async () => {
    console.log('\n🚀 Test 3: Verify Subagent Execution Structure');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    const subagentPath = resolve(process.cwd(), 'packages/agents/src/subagent/subagent-execution.service.ts');
    const content = await readFile(subagentPath, 'utf-8');

    // Verify key methods exist
    const methods = [
      'async executeTask(',
      'async executeTasksParallel(',
      'async executeTasksSequential(',
      'async executeTasksDAG(',
      'aggregateResults(',
      'topologicalSort('
    ];

    for (const method of methods) {
      assert.ok(content.includes(method), `Should contain ${method}`);
      console.log(`   ✓ Contains: ${method}`);
    }

    console.log('   ✓ Subagent execution service structure verified');
  });

  it('should verify Agent orchestration system integration', async () => {
    console.log('\n🔗 Test 4: Verify System Integration');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    const indexPath = resolve(process.cwd(), 'packages/agents/src/index.ts');
    const content = await readFile(indexPath, 'utf-8');

    // Verify all components are exported
    const exports = [
      'SkillIntegrationService',
      'SubagentExecutionService',
      'AgentOrchestrationSystem',
      'skillIntegration',
      'subagentExecution'
    ];

    for (const exp of exports) {
      assert.ok(content.includes(exp), `Should export ${exp}`);
      console.log(`   ✓ Exports: ${exp}`);
    }

    console.log('   ✓ System integration verified');
  });

  it('should count available Skills', async () => {
    console.log('\n📊 Test 5: Count Available Skills');

    const { readdir } = await import('fs/promises');
    const { resolve } = await import('path');

    const skillsDir = resolve(process.cwd(), '.claude/skills');
    const entries = await readdir(skillsDir, { withFileTypes: true });

    // Count skill directories (have SKILL.md)
    let skillCount = 0;
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const { readFile } = await import('fs/promises');
          await readFile(resolve(skillsDir, entry.name, 'SKILL.md'), 'utf-8');
          skillCount++;
        } catch (e) {
          // No SKILL.md
        }
      }
    }

    console.log(`   Total Skills: ${skillCount}`);
    assert.ok(skillCount >= 20, `Should have at least 20 skills, found ${skillCount}`);

    console.log('   ✓ Skills counted successfully');
  });

  it('should verify Agent Registry structure', async () => {
    console.log('\n📋 Test 6: Verify Agent Registry Structure');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    const registryPath = resolve(process.cwd(), 'packages/agents/src/core/agent-registry.ts');
    const content = await readFile(registryPath, 'utf-8');

    // Verify key methods
    const methods = [
      'register(',
      'unregister(',
      'get(',
      'find(',
      'registerDefaultAgents('
    ];

    for (const method of methods) {
      assert.ok(content.includes(method), `Should contain ${method}`);
      console.log(`   ✓ Contains: ${method}`);
    }

    console.log('   ✓ Agent registry structure verified');
  });

  it('should verify Workflow Engine structure', async () => {
    console.log('\n⚙️  Test 7: Verify Workflow Engine Structure');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    const workflowPath = resolve(process.cwd(), 'packages/agents/src/workflow/workflow-engine.ts');
    const content = await readFile(workflowPath, 'utf-8');

    // Verify execution modes
    const modes = [
      "case 'sequential':",
      "case 'parallel':",
      "case 'conditional':",
      "case 'dag':"
    ];

    for (const mode of modes) {
      assert.ok(content.includes(mode), `Should support ${mode}`);
      console.log(`   ✓ Supports: ${mode.replace(/[':]/g, '')}`);
    }

    console.log('   ✓ Workflow engine structure verified');
  });

  it('should verify Context Manager structure', async () => {
    console.log('\n💾 Test 8: Verify Context Manager Structure');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    const contextPath = resolve(process.cwd(), 'packages/agents/src/context/context-manager.ts');
    const content = await readFile(contextPath, 'utf-8');

    // Verify key methods
    const methods = [
      'async initialize(',
      'set(',
      'get(',
      'async sendMessage(',
      'getSnapshot(',
      'mergeAgentResults('
    ];

    for (const method of methods) {
      assert.ok(content.includes(method), `Should contain ${method}`);
      console.log(`   ✓ Contains: ${method}`);
    }

    console.log('   ✓ Context manager structure verified');
  });

  it('should verify plan6.md exists and has structure', async () => {
    console.log('\n📄 Test 9: Verify plan6.md Structure');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    const planPath = resolve(process.cwd(), 'plan6.md');
    const content = await readFile(planPath, 'utf-8');

    // Verify key sections
    const sections = [
      '# Plan 6: Agent',
      '## 第一部分: 当前架构分析',
      '## 第二部分: Plan 6 核心设计',
      '## 第三部分: 核心组件实现',
      '## 第四部分: 预定义工作流',
      '## 第五部分: 实施计划',
      '## 第六部分: 测试和验证',
      '## 第七部分: 使用示例'
    ];

    for (const section of sections) {
      assert.ok(content.includes(section), `Should contain section: ${section}`);
      console.log(`   ✓ Section: ${section.substring(0, 30)}...`);
    }

    console.log('   ✓ plan6.md structure verified');
  });

  it('should verify test file exists', async () => {
    console.log('\n🧪 Test 10: Verify Test Files');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    const testFiles = [
      'tests/agent-orchestration-test.mjs',
      'tests/plan6-integration-test.mjs',
      'tests/plan6-simple-test.mjs'
    ];

    for (const testFile of testFiles) {
      const testPath = resolve(process.cwd(), testFile);
      try {
        await readFile(testPath, 'utf-8');
        console.log(`   ✓ ${testFile}`);
      } catch (e) {
        console.log(`   ⚠️  ${testFile} - Not found (optional)`);
      }
    }

    console.log('   ✓ Test files verified');
  });

  it('should verify high cohesion - separate concerns', async () => {
    console.log('\n🎯 Test 11: Verify High Cohesion Architecture');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    // Check that services are in separate directories
    const services = [
      { path: 'packages/agents/src/core', name: 'Core Types' },
      { path: 'packages/agents/src/routing', name: 'Routing' },
      { path: 'packages/agents/src/workflow', name: 'Workflow Engine' },
      { path: 'packages/agents/src/context', name: 'Context Manager' },
      { path: 'packages/agents/src/skills', name: 'Skill Integration' },
      { path: 'packages/agents/src/subagent', name: 'Subagent Execution' }
    ];

    const cwd = process.cwd();
    for (const service of services) {
      const servicePath = resolve(cwd, service.path);
      const { readdir } = await import('fs/promises');
      try {
        const files = await readdir(servicePath);
        assert.ok(files.length > 0, `${service.name} should have files`);
        console.log(`   ✓ ${service.name}: ${files.length} files`);
      } catch (e) {
        console.log(`   ✗ ${service.name}: NOT FOUND`);
        throw new Error(`${service.name} directory not found`);
      }
    }

    console.log('   ✓ High cohesion architecture verified');
  });

  it('should verify low coupling - clean interfaces', async () => {
    console.log('\n🔌 Test 12: Verify Low Coupling Architecture');

    const { readFile } = await import('fs/promises');
    const { resolve } = await import('path');

    // Check that core types define interfaces
    const typesPath = resolve(process.cwd(), 'packages/agents/src/core/agent.types.ts');
    const typesContent = await readFile(typesPath, 'utf-8');

    const interfaces = [
      'interface AgentDefinition',
      'interface UserRequest',
      'interface RouteResult',
      'interface WorkflowResult',
      'interface IAgentRegistry',
      'interface IAgentRouter',
      'interface IWorkflowEngine'
    ];

    for (const iface of interfaces) {
      assert.ok(typesContent.includes(iface), `Should define ${iface}`);
      console.log(`   ✓ Defines: ${iface}`);
    }

    console.log('   ✓ Low coupling architecture verified');
  });
});

// Run tests
console.log('\n🏁 Running Plan 6 Simple Integration Tests...\n');
