// Agent capabilities and constants
import { AgentType } from '../types/agent.js';

export const AGENT_CAPABILITIES: Record<AgentType, string[]> = {
  [AgentType.WORKFLOW_MANAGER]: [
    'task-planning',
    'resource-allocation',
    'progress-tracking',
    'coordination'
  ],
  [AgentType.RESEARCHER]: [
    'literature-search',
    'data-collection',
    'analysis',
    'synthesis'
  ],
  [AgentType.WRITER]: [
    'drafting',
    'editing',
    'formatting',
    'citation'
  ],
  [AgentType.REVIEWER]: [
    'peer-review',
    'quality-check',
    'feedback-generation',
    'error-detection'
  ],
  [AgentType.ANALYZER]: [
    'data-analysis',
    'statistics',
    'visualization',
    'interpretation'
  ]
} as const;

export const AGENT_DEFAULT_CONFIG = {
  maxConcurrency: 3,
  timeout: 300000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000
} as const;

export const AGENT_EVENTS = {
  CREATED: 'agent:created',
  INITIALIZED: 'agent:initialized',
  TASK_START: 'agent:task:start',
  TASK_COMPLETE: 'agent:task:complete',
  TASK_FAILED: 'agent:task:failed',
  DISPOSED: 'agent:disposed'
} as const;
