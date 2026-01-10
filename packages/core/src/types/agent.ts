// Agent type definitions
export enum AgentType {
  WORKFLOW_MANAGER = 'workflow-manager',
  RESEARCHER = 'researcher',
  WRITER = 'writer',
  REVIEWER = 'reviewer',
  ANALYZER = 'analyzer'
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  COMPLETED = 'completed'
}

export interface AgentConfig {
  id: string;
  type: AgentType;
  name: string;
  description?: string;
  capabilities: string[];
  maxConcurrency: number;
}

export interface AgentState {
  status: AgentStatus;
  currentTask?: string;
  completedTasks: number;
  failedTasks: number;
}
