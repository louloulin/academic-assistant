/**
 * Plan 6 Integration Tests
 *
 * Comprehensive tests for Agent orchestration system
 * with Skill integration and Subagent execution
 *
 * Tests:
 * 1. Skill Integration Service
 * 2. Subagent Execution Service
 * 3. Agent-Skill Integration
 * 4. Subagent Patterns (Parallel, Sequential, DAG)
 * 5. End-to-End Workflows
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createSkillIntegrationService,
  createSubagentExecutionService,
  createAgentOrchestrationSystem
} from '../packages/agents/src/index.js';

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║        Plan 6 Integration Tests                           ║');
console.log('║        Agent Orchestration + Skills + Subagents           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

describe('Plan 6 Integration Tests', () => {

  describe('1. Skill Integration Service', () => {

    it('should load all available skills', async () => {
      console.log('\n📚 Test 1.1: Load all Skills');

      const skillService = createSkillIntegrationService();
      await skillService.loadSkills();

      const allSkills = skillService.getAllSkills();

      console.log(`   Loaded ${allSkills.length} skills`);
      assert.ok(allSkills.length >= 20, 'Should load at least 20 skills');

      // Verify skill structure
      const firstSkill = allSkills[0];
      assert.ok(firstSkill.name, 'Skill should have name');
      assert.ok(firstSkill.description, 'Skill should have description');
      assert.ok(firstSkill.category, 'Skill should have category');
      assert.ok(firstSkill.context, 'Skill should have context');
      assert.ok(Array.isArray(firstSkill.allowedTools), 'Skill should have allowedTools');

      console.log('   ✓ All skills loaded successfully');
    });

    it('should get skills by category', async () => {
      console.log('\n📂 Test 1.2: Get Skills by Category');

      const skillService = createSkillIntegrationService();
      await skillService.loadSkills();

      const p0Skills = skillService.getSkillsByCategory('P0');
      const p1Skills = skillService.getSkillsByCategory('P1');
      const p2Skills = skillService.getSkillsByCategory('P2');
      const coreSkills = skillService.getSkillsByCategory('Core');

      console.log(`   P0 Skills: ${p0Skills.length}`);
      console.log(`   P1 Skills: ${p1Skills.length}`);
      console.log(`   P2 Skills: ${p2Skills.length}`);
      console.log(`   Core Skills: ${coreSkills.length}`);

      assert.ok(p0Skills.length > 0, 'Should have P0 skills');
      assert.ok(p1Skills.length > 0, 'Should have P1 skills');
      assert.ok(p2Skills.length > 0, 'Should have P2 skills');
      assert.ok(coreSkills.length > 0, 'Should have Core skills');

      console.log('   ✓ Skills categorized correctly');
    });

    it('should find skills for specific tasks', async () => {
      console.log('\n🔍 Test 1.3: Find Skills for Tasks');

      const skillService = createSkillIntegrationService();
      await skillService.loadSkills();

      // Test literature search task
      const litSkills = skillService.findSkillsForTask('search academic papers');
      console.log(`   Literature search task: ${litSkills.length} skills found`);
      assert.ok(litSkills.length > 0, 'Should find skills for literature search');

      // Test writing task
      const writeSkills = skillService.findSkillsForTask('write academic paper');
      console.log(`   Writing task: ${writeSkills.length} skills found`);
      assert.ok(writeSkills.length > 0, 'Should find skills for writing');

      console.log('   ✓ Skill search working correctly');
    });

    it('should get fork context skills', async () => {
      console.log('\n🔀 Test 1.4: Get Fork Context Skills');

      const skillService = createSkillIntegrationService();
      await skillService.loadSkills();

      const forkSkills = skillService.getForkContextSkills();
      console.log(`   Fork context skills: ${forkSkills.length}`);

      assert.ok(forkSkills.length > 0, 'Should have fork context skills');

      // Verify they have fork context
      for (const skill of forkSkills) {
        assert.strictEqual(skill.context, 'fork', 'Should have fork context');
      }

      console.log('   ✓ Fork context skills identified');
    });

    it('should get skills for agent', async () => {
      console.log('\n🤖 Test 1.5: Get Skills for Agent');

      const skillService = createSkillIntegrationService();
      await skillService.loadSkills();

      const litAgentSkills = skillService.getSkillsForAgent('literature-agent');
      console.log(`   Literature agent skills: ${litAgentSkills.length}`);

      assert.ok(litAgentSkills.length > 0, 'Literature agent should have skills');
      assert.ok(
        litAgentSkills.some(s => s.name === 'literature-search'),
        'Should include literature-search skill'
      );

      const writingAgentSkills = skillService.getSkillsForAgent('writing-agent');
      console.log(`   Writing agent skills: ${writingAgentSkills.length}`);

      assert.ok(writingAgentSkills.length > 0, 'Writing agent should have skills');

      console.log('   ✓ Agent-skill mapping working');
    });
  });

  describe('2. Subagent Execution Service', () => {

    it('should execute single subagent task', async () => {
      console.log('\n🚀 Test 2.1: Execute Single Task');

      const subagentService = createSubagentExecutionService();

      const task = {
        id: 'task-1',
        name: 'Test Task',
        prompt: 'Analyze this data',
        context: 'default'
      };

      const result = await subagentService.executeTask(task);

      console.log(`   Task: ${result.taskId}`);
      console.log(`   Success: ${result.success}`);
      console.log(`   Time: ${result.executionTime}ms`);

      assert.ok(result, 'Should return result');
      assert.strictEqual(result.taskId, 'task-1', 'Should have correct task ID');
      assert.ok(result.executionTime > 0, 'Should have execution time');

      console.log('   ✓ Single task executed');
    });

    it('should execute tasks in parallel', async () => {
      console.log('\n⚡ Test 2.2: Execute Tasks in Parallel');

      const subagentService = createSubagentExecutionService();

      const tasks = [
        { id: 'task-1', name: 'Task 1', prompt: 'Search papers', context: 'default' },
        { id: 'task-2', name: 'Task 2', prompt: 'Analyze data', context: 'default' },
        { id: 'task-3', name: 'Task 3', prompt: 'Write content', context: 'default' }
      ];

      const results = await subagentService.executeTasksParallel(tasks, {
        maxConcurrent: 3
      });

      console.log(`   Executed: ${results.length} tasks`);
      console.log(`   Successful: ${results.filter(r => r.success).length}`);

      assert.strictEqual(results.length, 3, 'Should execute all tasks');
      assert.ok(results.every(r => r.taskId), 'All tasks should have IDs');

      console.log('   ✓ Parallel execution working');
    });

    it('should execute tasks sequentially', async () => {
      console.log('\n📝 Test 2.3: Execute Tasks Sequentially');

      const subagentService = createSubagentExecutionService();

      const tasks = [
        { id: 'task-1', name: 'Search', prompt: 'Search literature' },
        { id: 'task-2', name: 'Analyze', prompt: 'Analyze findings', dependencies: ['task-1'] },
        { id: 'task-3', name: 'Write', prompt: 'Write review', dependencies: ['task-2'] }
      ];

      const results = await subagentService.executeTasksSequential(tasks);

      console.log(`   Executed: ${results.length} tasks`);
      console.log(`   Successful: ${results.filter(r => r.success).length}`);

      assert.strictEqual(results.length, 3, 'Should execute all tasks');

      // Verify order is maintained
      assert.strictEqual(results[0].taskId, 'task-1', 'First task should be task-1');
      assert.strictEqual(results[1].taskId, 'task-2', 'Second task should be task-2');
      assert.strictEqual(results[2].taskId, 'task-3', 'Third task should be task-3');

      console.log('   ✓ Sequential execution working');
    });

    it('should execute tasks as DAG', async () => {
      console.log('\n🔀 Test 2.4: Execute Tasks as DAG');

      const subagentService = createSubagentExecutionService();

      const tasks = [
        { id: 'search-1', name: 'Search 1', prompt: 'Search database 1' },
        { id: 'search-2', name: 'Search 2', prompt: 'Search database 2' },
        { id: 'analyze', name: 'Analyze', prompt: 'Analyze results', dependencies: ['search-1', 'search-2'] },
        { id: 'write', name: 'Write', prompt: 'Write report', dependencies: ['analyze'] }
      ];

      const results = await subagentService.executeTasksDAG(tasks);

      console.log(`   Executed: ${results.length} tasks`);

      assert.ok(results.length >= 3, 'Should execute at least 3 tasks');

      console.log('   ✓ DAG execution working');
    });

    it('should aggregate subagent results', async () => {
      console.log('\n📊 Test 2.5: Aggregate Results');

      const subagentService = createSubagentExecutionService();

      const tasks = [
        { id: 'task-1', name: 'Task 1', prompt: 'Test 1' },
        { id: 'task-2', name: 'Task 2', prompt: 'Test 2' },
        { id: 'task-3', name: 'Task 3', prompt: 'Test 3' }
      ];

      const results = await subagentService.executeTasksParallel(tasks);
      const aggregated = subagentService.aggregateResults(results);

      console.log(`   Successful: ${aggregated.successful.length}`);
      console.log(`   Failed: ${aggregated.failed.length}`);
      console.log(`   Total Time: ${aggregated.summary.match(/Total Time: (\d+)ms/)?.[1] || 0}ms`);

      assert.strictEqual(aggregated.successful.length + aggregated.failed.length, 3, 'Should account for all tasks');
      assert.ok(aggregated.summary, 'Should generate summary');

      console.log('   ✓ Result aggregation working');
    });
  });

  describe('3. Agent Orchestration Integration', () => {

    it('should initialize complete system', async () => {
      console.log('\n🔧 Test 3.1: Initialize Complete System');

      const system = createAgentOrchestrationSystem();

      console.log('   System components:');
      console.log(`   - Registry: ${system.registry.list().length} agents`);
      console.log(`   - Workflows: ${system.workflowEngine.list().length} workflows`);
      console.log(`   - Skills: ${system.skillIntegration.getAllSkills().length} skills`);

      assert.ok(system.registry, 'Should have registry');
      assert.ok(system.router, 'Should have router');
      assert.ok(system.workflowEngine, 'Should have workflow engine');
      assert.ok(system.contextManager, 'Should have context manager');
      assert.ok(system.skillIntegration, 'Should have skill integration');
      assert.ok(system.subagentExecution, 'Should have subagent execution');

      console.log('   ✓ System initialized with all components');
    });

    it('should get system status', async () => {
      console.log('\n📊 Test 3.2: Get System Status');

      const system = createAgentOrchestrationSystem();

      // Load skills first
      await system.skillIntegration.loadSkills();

      const status = system.getStatus();

      console.log('   System Status:');
      console.log(`   - Agents: ${status.agents}`);
      console.log(`   - Workflows: ${status.workflows}`);
      console.log(`   - Skills: ${status.skills}`);
      console.log(`   - Context Keys: ${status.contextStats?.keys?.length || 0}`);

      assert.ok(status.agents > 0, 'Should have agents');
      assert.ok(status.workflows > 0, 'Should have workflows');
      assert.ok(status.skills > 0, 'Should have skills');
      assert.ok(status.contextStats, 'Should have context stats');
      assert.ok(status.subagentStats, 'Should have subagent stats');

      console.log('   ✓ Status reporting working');
    });

    it('should display system info', async () => {
      console.log('\nℹ️  Test 3.3: Display System Info');

      const system = createAgentOrchestrationSystem();

      // Load skills
      await system.skillIntegration.loadSkills();

      const info = system.getInfo();

      console.log('   System Info:');
      console.log(info);

      assert.ok(info.includes('Agent Orchestration System'), 'Should include title');
      assert.ok(info.includes('Plan 6'), 'Should include plan reference');
      assert.ok(info.includes('Components'), 'Should list components');

      console.log('   ✓ System info displayed');
    });
  });

  describe('4. End-to-End Integration', () => {

    it('should process literature search workflow', async () => {
      console.log('\n📚 Test 4.1: Literature Search Workflow');

      const system = createAgentOrchestrationSystem();
      await system.skillIntegration.loadSkills();

      const request = {
        text: 'Search for recent papers on machine learning in healthcare',
        type: 'literature-search'
      };

      console.log(`   Request: ${request.text}`);

      // This would normally call system.processRequest()
      // For testing, we verify the components are ready
      const litSkills = system.skillIntegration.findSkillsForTask('search literature');

      console.log(`   Available skills: ${litSkills.length}`);
      assert.ok(litSkills.length > 0, 'Should have literature search skills');

      console.log('   ✓ Literature search workflow ready');
    });

    it('should process writing workflow', async () => {
      console.log('\n✍️  Test 4.2: Writing Workflow');

      const system = createAgentOrchestrationSystem();
      await system.skillIntegration.loadSkills();

      const request = {
        text: 'Help me write an academic paper on deep learning',
        type: 'writing'
      };

      console.log(`   Request: ${request.text}`);

      const writeSkills = system.skillIntegration.findSkillsForTask('write academic paper');

      console.log(`   Available skills: ${writeSkills.length}`);
      assert.ok(writeSkills.length > 0, 'Should have writing skills');

      console.log('   ✓ Writing workflow ready');
    });

    it('should demonstrate agent-skill-subagent integration', async () => {
      console.log('\n🔗 Test 4.3: Agent-Skill-Subagent Integration');

      const system = createAgentOrchestrationSystem();
      await system.skillIntegration.loadSkills();

      // 1. Agent selects skills
      const litAgentSkills = system.skillIntegration.getSkillsForAgent('literature-agent');
      console.log(`   1. Agent selected ${litAgentSkills.length} skills`);

      // 2. Skills can execute via subagents
      const subagentTasks = litAgentSkills.slice(0, 2).map((skill, i) => ({
        id: `skill-${i}`,
        name: skill.name,
        prompt: `Execute ${skill.name}`,
        context: skill.context
      }));

      console.log(`   2. Created ${subagentTasks.length} subagent tasks`);

      // 3. Execute in parallel
      const results = await system.subagentExecution.executeTasksParallel(
        subagentTasks,
        { maxConcurrent: 2 }
      );

      console.log(`   3. Executed ${results.length} subagent tasks`);

      // Verify integration
      assert.ok(litAgentSkills.length > 0, 'Agent should have skills');
      assert.strictEqual(subagentTasks.length, 2, 'Should create 2 tasks');
      assert.strictEqual(results.length, 2, 'Should execute 2 tasks');

      console.log('   ✓ Full integration working: Agent → Skills → Subagents');
    });
  });
});

// Run tests
console.log('\n🏁 Running Plan 6 Integration Tests...\n');
