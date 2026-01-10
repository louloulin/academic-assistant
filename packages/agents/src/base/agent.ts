// Base Agent class
import type { IAgent, IEventBus } from '@assistant/core';
import type { Task, AgentStatus, AgentConfig } from '@assistant/core';
import { EventEmitter } from 'events';
import { log } from '@assistant/utils';

export abstract class BaseAgent extends EventEmitter implements IAgent {
  protected status: AgentStatus = 'idle';
  protected currentTask: Task | null = null;

  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly name: string,
    public readonly config: AgentConfig
  ) {
    super();
  }

  async initialize(): Promise<void> {
    log.info(`Initializing agent: ${this.name} (${this.id})`);
    await this.onInitialize();
    this.emit('initialized', { agentId: this.id });
  }

  async execute<T, U>(task: Task<T, U>): Promise<Task<T, U>> {
    if (this.status === 'busy') {
      throw new Error(`${this.name} is busy`);
    }

    this.status = 'busy';
    this.currentTask = task;
    task.status = 'in-progress';
    task.startedAt = new Date();

    this.emit('task:start', { taskId: task.id, agentId: this.id });

    try {
      log.info(`${this.name} executing task: ${task.title}`);

      const result = await this.onExecute(task);

      result.status = 'completed';
      result.completedAt = new Date();

      this.emit('task:complete', { taskId: task.id, agentId: this.id, result });

      return result;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';

      this.emit('task:failed', { taskId: task.id, agentId: this.id, error });

      log.error(`${this.name} task failed: ${task.error}`);

      throw error;
    } finally {
      this.status = 'idle';
      this.currentTask = null;
    }
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  canHandle(task: Task): boolean {
    return this.status !== 'busy';
  }

  async dispose(): Promise<void> {
    log.info(`Disposing agent: ${this.name} (${this.id})`);
    await this.onDispose();
    this.removeAllListeners();
    this.emit('disposed', { agentId: this.id });
  }

  // Abstract methods to be implemented by subclasses
  protected abstract onInitialize(): Promise<void>;
  protected abstract onExecute<T, U>(task: Task<T, U>): Promise<Task<T, U>>;
  protected abstract onDispose(): Promise<void>;
}
