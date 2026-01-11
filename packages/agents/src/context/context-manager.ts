/**
 * Context Manager
 *
 * Manage communication and result sharing between agents.
 * Provides shared context, state management, and message passing.
 * Plan 6 - Agent Orchestration System
 */

import { AgentDefinition, WorkflowContext, IContextManager } from '../core/agent.types';

/**
 * Context Message
 */
export interface ContextMessage {
  from: string;
  to: string | string[];
  type: 'request' | 'response' | 'notification' | 'error';
  content: any;
  timestamp: Date;
  id: string;
}

/**
 * Context State
 */
export interface ContextState {
  data: Map<string, any>;
  history: ContextMessage[];
  agents: Set<string>;
}

/**
 * Context Manager Implementation
 */
export class ContextManager implements IContextManager {
  private state: ContextState;
  private messageHandlers: Map<string, (message: ContextMessage) => Promise<void>> = new Map();

  constructor() {
    this.state = {
      data: new Map(),
      history: [],
      agents: new Set()
    };
    console.log('✨ Context Manager initialized');
    console.log('   Features: Shared state, message passing, history tracking');
  }

  /**
   * Initialize context for workflow
   */
  async initialize(context: WorkflowContext): Promise<void> {
    console.log('📋 Initializing workflow context');

    // Copy initial data
    if (context.data) {
      for (const [key, value] of Object.entries(context.data)) {
        this.state.data.set(key, value);
      }
    }

    console.log(`   Initial data keys: ${Array.from(this.state.data.keys()).join(', ')}`);
  }

  /**
   * Get value from context
   */
  get(key: string): any {
    return this.state.data.get(key);
  }

  /**
   * Set value in context
   */
  set(key: string, value: any): void {
    this.state.data.set(key, value);
    console.log(`📝 Context updated: ${key}`);
  }

  /**
   * Delete value from context
   */
  delete(key: string): void {
    this.state.data.delete(key);
    console.log(`🗑️ Context key deleted: ${key}`);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.state.data.has(key);
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.state.data.keys());
  }

  /**
   * Get all values
   */
  values(): any[] {
    return Array.from(this.state.data.values());
  }

  /**
   * Get all entries
   */
  entries(): [string, any][] {
    return Array.from(this.state.data.entries());
  }

  /**
   * Clear all context data
   */
  clear(): void {
    this.state.data.clear();
    this.state.history = [];
    console.log('🧹 Context cleared');
  }

  /**
   * Register agent
   */
  registerAgent(agent: AgentDefinition): void {
    this.state.agents.add(agent.name);
    console.log(`✓ Agent registered: ${agent.name}`);
  }

  /**
   * Unregister agent
   */
  unregisterAgent(agentName: string): void {
    this.state.agents.delete(agentName);
    console.log(`✓ Agent unregistered: ${agentName}`);
  }

  /**
   * Get list of registered agents
   */
  getAgents(): string[] {
    return Array.from(this.state.agents);
  }

  /**
   * Send message between agents
   */
  async sendMessage(message: Omit<ContextMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: ContextMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date()
    };

    this.state.history.push(fullMessage);
    console.log(`💬 Message: ${fullMessage.from} → ${fullMessage.to} (${fullMessage.type})`);

    // Deliver message to recipients
    const recipients = Array.isArray(fullMessage.to) ? fullMessage.to : [fullMessage.to];

    for (const recipient of recipients) {
      const handler = this.messageHandlers.get(recipient);
      if (handler) {
        await handler(fullMessage);
      }
    }
  }

  /**
   * Register message handler for agent
   */
  registerMessageHandler(agentName: string, handler: (message: ContextMessage) => Promise<void>): void {
    this.messageHandlers.set(agentName, handler);
    console.log(`✓ Message handler registered: ${agentName}`);
  }

  /**
   * Unregister message handler
   */
  unregisterMessageHandler(agentName: string): void {
    this.messageHandlers.delete(agentName);
  }

  /**
   * Get message history
   */
  getHistory(filter?: {
    from?: string;
    to?: string;
    type?: ContextMessage['type'];
    limit?: number;
  }): ContextMessage[] {
    let messages = [...this.state.history];

    if (filter) {
      if (filter.from) {
        messages = messages.filter(m => m.from === filter.from);
      }
      if (filter.to) {
        const to = Array.isArray(filter.to) ? filter.to : [filter.to];
        messages = messages.filter(m => {
          const mTo = Array.isArray(m.to) ? m.to : [m.to];
          return mTo.some(t => to.includes(t));
        });
      }
      if (filter.type) {
        messages = messages.filter(m => m.type === filter.type);
      }
      if (filter.limit) {
        messages = messages.slice(-filter.limit);
      }
    }

    return messages;
  }

  /**
   * Get context snapshot
   */
  getSnapshot(): {
    data: Record<string, any>;
    agents: string[];
    messageCount: number;
  } {
    return {
      data: Object.fromEntries(this.state.data.entries()),
      agents: Array.from(this.state.agents),
      messageCount: this.state.history.length
    };
  }

  /**
   * Restore context from snapshot
   */
  restoreSnapshot(snapshot: {
    data: Record<string, any>;
    agents: string[];
  }): void {
    this.state.data.clear();
    for (const [key, value] of Object.entries(snapshot.data)) {
      this.state.data.set(key, value);
    }

    this.state.agents = new Set(snapshot.agents);
    console.log('📦 Context restored from snapshot');
  }

  /**
   * Export context to JSON
   */
  export(): string {
    const exportData = {
      data: Object.fromEntries(this.state.data.entries()),
      agents: Array.from(this.state.agents),
      messages: this.state.history,
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import context from JSON
   */
  import(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      this.state.data.clear();
      for (const [key, value] of Object.entries(data.data || {})) {
        this.state.data.set(key, value);
      }

      this.state.agents = new Set(data.agents || []);
      this.state.history = data.messages || [];

      console.log('📥 Context imported from JSON');
    } catch (error: any) {
      throw new Error(`Failed to import context: ${error.message}`);
    }
  }

  /**
   * Get context statistics
   */
  getStatistics(): {
    dataKeys: number;
    agents: number;
    messages: number;
    lastMessageTime: Date | null;
  } {
    return {
      dataKeys: this.state.data.size,
      agents: this.state.agents.size,
      messages: this.state.history.length,
      lastMessageTime: this.state.history.length > 0
        ? this.state.history[this.state.history.length - 1].timestamp
        : null
    };
  }

  /**
   * Watch context key for changes
   */
  watch(key: string, callback: (newValue: any, oldValue: any) => void): () => void {
    const oldValue = this.get(key);

    // In production, would implement proper reactive watching
    // For now, return a no-op function
    console.log(`👀 Watching context key: ${key}`);
    return () => {
      console.log(`👁️ Unwatching context key: ${key}`);
    };
  }

  /**
   * Update multiple values atomically
   */
  update(updates: Record<string, any>): void {
    console.log(`🔄 Atomic update: ${Object.keys(updates).length} keys`);
    for (const [key, value] of Object.entries(updates)) {
      this.state.data.set(key, value);
    }
  }

  /**
   * Merge data into context
   */
  merge(data: Record<string, any>): void {
    for (const [key, value] of Object.entries(data)) {
      const existing = this.state.data.get(key);
      if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
        // Deep merge objects
        this.state.data.set(key, { ...existing, ...value });
      } else {
        this.state.data.set(key, value);
      }
    }
    console.log(`🔀 Merged ${Object.keys(data).length} keys into context`);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create scoped context (subset of main context)
   */
  createScope(keys: string[]): ContextManager {
    const scoped = new ContextManager();

    for (const key of keys) {
      if (this.state.data.has(key)) {
        scoped.set(key, this.get(key));
      }
    }

    console.log(`🎯 Created scoped context with ${keys.length} keys`);
    return scoped;
  }

  /**
   * Clone context
   */
  clone(): ContextManager {
    const cloned = new ContextManager();
    cloned.restoreSnapshot(this.getSnapshot());
    cloned.state.history = [...this.state.history];
    return cloned;
  }
}

/**
 * Context Manager Factory with Helpers
 */
export function createContextManager(): ContextManager {
  return new ContextManager();
}

/**
 * Create initial workflow context
 */
export function createInitialContext(data?: Record<string, any>): WorkflowContext {
  return {
    data: data || {},
    previousResults: [],
    failures: []
  };
}

/**
 * Merge agent results into context
 */
export function mergeAgentResults(
  context: WorkflowContext,
  results: any[]
): WorkflowContext {
  return {
    ...context,
    previousResults: [...context.previousResults, ...results],
    data: {
      ...context.data,
      lastResults: results,
      resultsCount: (context.data.resultsCount || 0) + results.length
    }
  };
}

/**
 * Extract data from agent results
 */
export function extractResultData<T = any>(
  results: any[],
  agentName: string
): T | undefined {
  for (const result of results) {
    if (result.agent === agentName) {
      return result.data as T;
    }
  }
  return undefined;
}
