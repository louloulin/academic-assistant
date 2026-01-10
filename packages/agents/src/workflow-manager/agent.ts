// Workflow Manager Agent
import { BaseAgent } from '../base/agent.js';
import type { Task, AgentConfig } from '@assistant/core';
import type { ISkill } from '@assistant/core';
import type { IMCPClient } from '@assistant/mcp-client';
import { log } from '@assistant/utils';
import { TaskStatus } from '@assistant/core';

interface WorkflowConfig {
  skills: Map<string, ISkill>;
  mcpClient: IMCPClient;
}

interface ExecutionPlan {
  steps: ExecutionStep[];
}

interface ExecutionStep {
  order: number;
  agentType: string;
  skillId: string;
  title: string;
  input?: unknown;
}

export class WorkflowManagerAgent extends BaseAgent {
  readonly type = 'workflow-manager';
  private workflowConfig: WorkflowConfig;

  constructor(
    id: string,
    name: string,
    config: AgentConfig,
    workflowConfig: WorkflowConfig
  ) {
    super(id, 'workflow-manager', name, config);
    this.workflowConfig = workflowConfig;
  }

  protected async onInitialize(): Promise<void> {
    log.info(`${this.name} initialized with ${this.workflowConfig.skills.size} skills`);
  }

  protected async onExecute<T, U>(task: Task<T, U>): Promise<Task<T, U>> {
    // Plan execution
    const plan = await this.planExecution(task);

    // Allocate subtasks
    const subtasks = await this.allocateSubtasks(plan);

    // Execute subtasks
    const results = await this.executeSubtasks(subtasks);

    // Synthesize results
    return this.synthesizeResults(task, results) as Task<T, U>;
  }

  private async planExecution(task: Task): Promise<ExecutionPlan> {
    log.info(`Planning execution for: ${task.title}`);

    // Simple planning - in production, use Claude Agent SDK
    const steps: ExecutionStep[] = [
      {
        order: 1,
        agentType: 'researcher',
        skillId: 'literature-search',
        title: `Search literature for: ${task.title}`
      }
    ];

    return { steps };
  }

  private async allocateSubtasks(plan: ExecutionPlan): Promise<Task[]> {
    const subtasks: Task[] = [];

    for (const step of plan.steps) {
      const skill = this.workflowConfig.skills.get(step.skillId);
      if (!skill) {
        log.warn(`No skill found for: ${step.skillId}`);
        continue;
      }

      const subtask: Task = {
        id: crypto.randomUUID(),
        title: step.title,
        status: TaskStatus.PENDING,
        priority: 2,
        input: step.input,
        createdAt: new Date(),
        updatedAt: new Date(),
        requiredSkills: [step.skillId]
      };

      subtasks.push(subtask);
    }

    return subtasks;
  }

  private async executeSubtasks(subtasks: Task[]): Promise<Task[]> {
    const results: Task[] = [];

    for (const subtask of subtasks) {
      try {
        const skillId = subtask.requiredSkills?.[0];
        if (!skillId) continue;

        const skill = this.workflowConfig.skills.get(skillId);
        if (!skill) {
          throw new Error(`Skill not found: ${skillId}`);
        }

        const result = await skill.execute(subtask);
        results.push(result);
      } catch (error) {
        log.error(`Subtask failed: ${error}`);
        subtask.status = TaskStatus.FAILED;
        subtask.error = error instanceof Error ? error.message : 'Unknown error';
        results.push(subtask);
      }
    }

    return results;
  }

  private synthesizeResults(originalTask: Task, results: Task[]): Task {
    log.info(`Synthesizing ${results.length} subtask results`);

    originalTask.output = {
      subtaskResults: results.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        output: r.output
      }))
    } as unknown;

    return originalTask;
  }

  protected async onDispose(): Promise<void> {
    // Cleanup
  }
}
