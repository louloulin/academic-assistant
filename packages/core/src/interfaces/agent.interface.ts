// Agent interface
import type { Task } from '../types/task.js';
import type { AgentStatus, AgentConfig } from '../types/agent.js';

export interface IAgent {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly config: AgentConfig;

  initialize(): Promise<void>;
  execute<T, U>(task: Task<T, U>): Promise<Task<T, U>>;
  getStatus(): AgentStatus;
  canHandle(task: Task): boolean;
  dispose(): Promise<void>;
}

export interface IAgentFactory {
  create(config: AgentConfig): IAgent;
  getSupportedTypes(): string[];
}
