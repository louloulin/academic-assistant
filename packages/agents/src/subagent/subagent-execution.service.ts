/**
 * Subagent Execution Service
 *
 * Implements subagent patterns following Claude Agent SDK best practices
 * Handles parallelization, fork contexts, and result aggregation
 *
 * Plan 6 - Full Claude Agent SDK Subagent Integration
 */

import { join } from 'path';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';

export interface SubagentTask {
  id: string;
  name: string;
  prompt: string;
  context?: 'fork' | 'default';
  allowedTools?: string[];
  timeout?: number;
  dependencies?: string[];
}

export interface SubagentResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  agentId?: string;
}

export interface SubagentExecutionConfig {
  parallel: boolean;
  maxConcurrent: number;
  timeout: number;
  retryPolicy: 'none' | 'fixed' | 'exponential';
  maxRetries: number;
}

/**
 * Subagent Execution Service
 *
 * Manages execution of subagents with proper context isolation
 */
export class SubagentExecutionService {
  private workspace: string;
  private activeAgents: Map<string, any> = new Map();

  constructor(workspace: string = '/tmp/subagent-execution') {
    this.workspace = workspace;
    console.log('✨ Subagent Execution Service initialized');
    console.log('   Mode: Claude Agent SDK Subagent Patterns');
    console.log(`   Workspace: ${workspace}`);
  }

  /**
   * Initialize workspace
   */
  private async initializeWorkspace(): Promise<void> {
    const dirs = [
      join(this.workspace, 'tasks'),
      join(this.workspace, 'results'),
      join(this.workspace, 'contexts'),
      join(this.workspace, 'logs')
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Execute single subagent task
   */
  async executeTask(task: SubagentTask): Promise<SubagentResult> {
    const startTime = Date.now();

    console.log(`🚀 Executing subagent task: ${task.name}`);
    console.log(`   ID: ${task.id}`);
    console.log(`   Context: ${task.context || 'default'}`);

    try {
      // Write task specification
      await this.writeTaskSpec(task);

      // Execute based on context type
      const result = await this.executeInContext(task);

      const executionTime = Date.now() - startTime;

      console.log(`✓ Task completed: ${task.name}`);
      console.log(`   Time: ${executionTime}ms`);

      return {
        taskId: task.id,
        success: true,
        result,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      console.error(`✗ Task failed: ${task.name}`);
      console.error(`   Error: ${error.message}`);

      return {
        taskId: task.id,
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeTasksParallel(
    tasks: SubagentTask[],
    config: Partial<SubagentExecutionConfig> = {}
  ): Promise<SubagentResult[]> {
    const finalConfig: SubagentExecutionConfig = {
      parallel: true,
      maxConcurrent: config.maxConcurrent || 5,
      timeout: config.timeout || 120000,
      retryPolicy: config.retryPolicy || 'none',
      maxRetries: config.maxRetries || 1
    };

    console.log(`⚡ Executing ${tasks.length} tasks in parallel`);
    console.log(`   Max Concurrent: ${finalConfig.maxConcurrent}`);

    const results: SubagentResult[] = [];
    const executionQueue = [...tasks];

    // Execute in batches
    while (executionQueue.length > 0) {
      const batch = executionQueue.splice(0, finalConfig.maxConcurrent);

      const batchResults = await Promise.all(
        batch.map(task => this.executeTaskWithRetry(task, finalConfig))
      );

      results.push(...batchResults);
    }

    const successful = results.filter(r => r.success).length;
    console.log(`✓ Parallel execution complete: ${successful}/${tasks.length} successful`);

    return results;
  }

  /**
   * Execute tasks sequentially with result passing
   */
  async executeTasksSequential(
    tasks: SubagentTask[]
  ): Promise<SubagentResult[]> {
    console.log(`📝 Executing ${tasks.length} tasks sequentially`);

    const results: SubagentResult[] = [];
    const contextData: Record<string, any> = {};

    for (const task of tasks) {
      // Check dependencies
      if (task.dependencies) {
        const depsMet = task.dependencies.every(dep =>
          results.some(r => r.taskId === dep && r.success)
        );

        if (!depsMet) {
          console.log(`⚠️  Skipping ${task.name}: dependencies not met`);
          continue;
        }
      }

      // Add previous results to context
      const enrichedTask = {
        ...task,
        prompt: this.enrichPromptWithContext(task.prompt, contextData)
      };

      const result = await this.executeTask(enrichedTask);
      results.push(result);

      // Update context data
      if (result.success) {
        contextData[task.id] = result.result;
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`✓ Sequential execution complete: ${successful}/${tasks.length} successful`);

    return results;
  }

  /**
   * Execute tasks as a DAG (Directed Acyclic Graph)
   */
  async executeTasksDAG(
    tasks: SubagentTask[]
  ): Promise<SubagentResult[]> {
    console.log(`🔀 Executing ${tasks.length} tasks as DAG`);

    const results: Map<string, SubagentResult> = new Map();
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const executed = new Set<string>();
    const contextData: Record<string, any> = {};

    // Topological sort
    const sorted = this.topologicalSort(tasks);

    for (const taskId of sorted) {
      const task = taskMap.get(taskId);
      if (!task) continue;

      // Check if dependencies are met
      if (task.dependencies) {
        const depsMet = task.dependencies.every(dep => executed.has(dep));

        if (!depsMet) {
          console.log(`⚠️  Skipping ${task.name}: dependencies not met`);
          continue;
        }
      }

      // Execute task
      const enrichedTask = {
        ...task,
        prompt: this.enrichPromptWithContext(task.prompt, contextData)
      };

      const result = await this.executeTask(enrichedTask);
      results.set(taskId, result);
      executed.add(taskId);

      // Update context data
      if (result.success) {
        contextData[task.id] = result.result;
      }
    }

    const successful = Array.from(results.values()).filter(r => r.success).length;
    console.log(`✓ DAG execution complete: ${successful}/${tasks.length} successful`);

    return Array.from(results.values());
  }

  /**
   * Execute task with retry logic
   */
  private async executeTaskWithRetry(
    task: SubagentTask,
    config: SubagentExecutionConfig
  ): Promise<SubagentResult> {
    let lastResult: SubagentResult | null = null;
    let delay = 1000; // Initial delay for exponential backoff

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      const result = await this.executeTask(task);

      if (result.success) {
        return result;
      }

      lastResult = result;

      if (attempt < config.maxRetries) {
        console.log(`   Retrying ${task.name} (attempt ${attempt + 1}/${config.maxRetries})`);

        if (config.retryPolicy === 'exponential') {
          delay *= 2;
        }

        await this.sleep(delay);
      }
    }

    return lastResult!;
  }

  /**
   * Execute task in appropriate context
   */
  private async executeInContext(task: SubagentTask): Promise<any> {
    // In real implementation, this would use Claude Agent SDK's fork context
    // For now, simulate execution with task analysis

    const context = task.context || 'default';

    if (context === 'fork') {
      return await this.executeInForkContext(task);
    } else {
      return await this.executeInDefaultContext(task);
    }
  }

  /**
   * Execute in fork context (isolated)
   */
  private async executeInForkContext(task: SubagentTask): Promise<any> {
    // Fork context provides isolation
    // In real implementation, would use SDK's fork context API

    const result = {
      context: 'fork',
      isolation: true,
      task: task.id,
      timestamp: new Date().toISOString(),
      // Simulated result based on task
      output: this.analyzeTaskOutput(task)
    };

    return result;
  }

  /**
   * Execute in default context (shared)
   */
  private async executeInDefaultContext(task: SubagentTask): Promise<any> {
    // Default context shares state
    const result = {
      context: 'default',
      isolation: false,
      task: task.id,
      timestamp: new Date().toISOString(),
      output: this.analyzeTaskOutput(task)
    };

    return result;
  }

  /**
   * Analyze task and generate simulated output
   */
  private analyzeTaskOutput(task: SubagentTask): any {
    // Extract key information from task prompt
    const keywords = task.prompt.toLowerCase().split(/\s+/);

    if (keywords.some(k => k.includes('search') || k.includes('find'))) {
      return {
        type: 'search',
        results: [
          { id: 1, title: 'Result 1', relevance: 0.95 },
          { id: 2, title: 'Result 2', relevance: 0.87 }
        ]
      };
    }

    if (keywords.some(k => k.includes('analyze') || k.includes('extract'))) {
      return {
        type: 'analysis',
        findings: [
          'Finding 1: Key insight detected',
          'Finding 2: Pattern identified'
        ],
        confidence: 0.92
      };
    }

    if (keywords.some(k => k.includes('write') || k.includes('generate'))) {
      return {
        type: 'generation',
        content: `Generated content for ${task.name}`,
        wordCount: Math.floor(Math.random() * 500) + 200
      };
    }

    return {
      type: 'general',
      message: `Task ${task.name} completed successfully`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Write task specification to file
   */
  private async writeTaskSpec(task: SubagentTask): Promise<void> {
    const taskFile = join(this.workspace, 'tasks', `${task.id}.json`);

    const spec = {
      id: task.id,
      name: task.name,
      prompt: task.prompt,
      context: task.context || 'default',
      allowedTools: task.allowedTools || ['Read', 'Write', 'Skill'],
      timeout: task.timeout || 60000,
      dependencies: task.dependencies || [],
      createdAt: new Date().toISOString()
    };

    await writeFile(taskFile, JSON.stringify(spec, null, 2), 'utf-8');
  }

  /**
   * Enrich prompt with context data
   */
  private enrichPromptWithContext(
    prompt: string,
    contextData: Record<string, any>
  ): string {
    if (Object.keys(contextData).length === 0) {
      return prompt;
    }

    const contextSection = '\n\n## Context from Previous Tasks\n\n';
    const contextEntries = Object.entries(contextData)
      .map(([id, data]) => `### ${id}\n${JSON.stringify(data, null, 2)}`)
      .join('\n\n');

    return prompt + contextSection + contextEntries;
  }

  /**
   * Topological sort for DAG execution
   */
  private topologicalSort(tasks: SubagentTask[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const visit = (taskId: string): void => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving ${taskId}`);
      }

      visiting.add(taskId);

      const task = taskMap.get(taskId);
      if (task?.dependencies) {
        for (const dep of task.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);
      sorted.push(taskId);
    };

    for (const task of tasks) {
      visit(task.id);
    }

    return sorted;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Aggregate results from multiple subagents
   */
  aggregateResults(results: SubagentResult[]): {
    successful: SubagentResult[];
    failed: SubagentResult[];
    summary: string;
  } {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);

    const summary = `
Subagent Execution Summary
─────────────────────────
Total Tasks: ${results.length}
Successful: ${successful.length}
Failed: ${failed.length}
Total Time: ${totalExecutionTime}ms
Average Time: ${Math.round(totalExecutionTime / results.length)}ms
    `.trim();

    return { successful, failed, summary };
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    activeAgents: number;
    completedTasks: number;
    workspace: string;
  } {
    return {
      activeAgents: this.activeAgents.size,
      completedTasks: 0, // Would track actual completions
      workspace: this.workspace
    };
  }
}

/**
 * Factory function
 */
export function createSubagentExecutionService(
  workspace?: string
): SubagentExecutionService {
  return new SubagentExecutionService(workspace);
}
