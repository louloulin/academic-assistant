/**
 * Core Agent Definitions and Types
 *
 * Plan 6 - Agent Orchestration System
 */

/**
 * Agent Definition Interface
 */
export interface AgentDefinition {
  name: string;
  description: string;
  skills: string[];
  capabilities: string[];
  inputFormat: string;
  outputFormat: string;

  execution: AgentExecutionConfig;
  requirements?: AgentRequirements;
  dependencies?: string[];
  provides?: string[];
}

/**
 * Agent Execution Configuration
 */
export interface AgentExecutionConfig {
  mode: 'sequential' | 'parallel' | 'fork';
  timeout?: number;
  retryPolicy?: 'none' | 'fixed' | 'exponential';
  maxRetries?: number;
}

/**
 * Agent Resource Requirements
 */
export interface AgentRequirements {
  memory?: number;
  cpu?: number;
  capabilities?: string[];
}

/**
 * User Request
 */
export interface UserRequest {
  text: string;
  type?: string;
  options?: Record<string, any>;
}

/**
 * Route Result
 */
export interface RouteResult {
  taskType: string;
  agents: string[];
  result: WorkflowResult;
  executionTime: number;
}

/**
 * Workflow Result
 */
export interface WorkflowResult {
  results: AgentResult[];
  failures: Error[];
  executionTime: number;
  mode: 'sequential' | 'parallel' | 'dag';
}

/**
 * Agent Execution Result
 */
export interface AgentResult {
  agent: string;
  result: any;
  timestamp: string;
}

/**
 * Workflow Step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  action: string;
  inputs: Record<string, any>;
  dependencies?: string[];
}

/**
 * Workflow Definition
 */
export interface Workflow {
  name: string;
  description: string;
  type: 'sequential' | 'parallel' | 'conditional' | 'dag';
  steps: WorkflowStep[];
}

/**
 * Agent Registry Interface
 */
export interface IAgentRegistry {
  register(agent: AgentDefinition): void;
  unregister(name: string): void;
  get(name: string): AgentDefinition | undefined;
  find(capability: string): AgentDefinition[];
  listAll(): AgentDefinition[];
}

/**
 * Agent Router Interface
 */
export interface IAgentRouter {
  route(request: UserRequest): Promise<RouteResult>;
  selectAgents(taskType: string, request: UserRequest): Promise<AgentDefinition[]>;
}

/**
 * Workflow Engine Interface
 */
export interface IWorkflowEngine {
  execute(workflow: Workflow, input: any): Promise<WorkflowResult>;
  executeSequential(steps: WorkflowStep[], input: any): Promise<WorkflowResult>;
  executeParallel(steps: WorkflowStep[], input: any): Promise<WorkflowResult>;
  executeConditional(workflow: Workflow, input: any): Promise<WorkflowResult>;
  executeDAG(workflow: Workflow, input: any): Promise<WorkflowResult>;
}
