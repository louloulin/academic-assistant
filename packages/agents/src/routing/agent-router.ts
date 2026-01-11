/**
 * Agent Router
 *
 * Intelligent routing system that directs requests to appropriate agents.
 * Plan 6 - Agent Orchestration System
 */

import { AgentDefinition, UserRequest, RouteResult, WorkflowResult, IAgentRouter, IAgentRegistry } from '../core/agent.types';

// Claude SDK query function (will be null if not available)
let queryFunction: any = null;

// Try to import Claude SDK (optional)
try {
  // Dynamic import will be attempted at runtime
  /* eslint-disable @typescript-eslint/no-var-requires */
  try {
    queryFunction = require('@anthropic-ai/claude-agent-sdk').query;
  } catch (e) {
    // SDK not installed, will use fallback
  }
  /* eslint-enable */
} catch (e) {
  // Ignore
}

/**
 * Task Classifier
 */
class TaskClassifier {
  /**
   * Classify user request into task type
   */
  async classify(request: UserRequest): Promise<string> {
    console.log('🔍 Classifying task...');

    // If type is explicitly provided, use it
    if (request.type) {
      return request.type;
    }

    // Use Claude to classify
    const prompt = `Classify this research request into one of these categories:

Request: "${request.text}"

Categories:
- literature: Search and analyze academic literature
- writing: Create or improve academic text
- analysis: Analyze data or run experiments
- review: Review and improve paper quality
- submission: Prepare for journal submission
- comprehensive: Multi-step research task

Return only the category name (one word).`;

    try {
      if (queryFunction) {
        const response = await queryFunction({
          prompt,
          options: {
            model: 'claude-sonnet-4-5',
            maxTurns: 1
          }
        });

        const category = this.extractCategory(response);
        console.log(`   Classified as: ${category}`);
        return category;
      } else {
        // SDK not available, use keyword classification
        return this.keywordClassification(request.text);
      }
    } catch (error) {
      // Fallback to keyword-based classification
      return this.keywordClassification(request.text);
    }
  }

  private extractCategory(response: any): string {
    const text = typeof response === 'string' ? response : JSON.stringify(response);
    const lower = text.toLowerCase();

    if (lower.includes('literature') || lower.includes('search') || lower.includes('find papers')) {
      return 'literature';
    } else if (lower.includes('write') || lower.includes('draft') || lower.includes('compose')) {
      return 'writing';
    } else if (lower.includes('analyze') || lower.includes('data') || lower.includes('experiment')) {
      return 'analysis';
    } else if (lower.includes('review') || lower.includes('check') || lower.includes('improve')) {
      return 'review';
    } else if (lower.includes('submit') || lower.includes('journal') || lower.includes('publish')) {
      return 'submission';
    } else {
      return 'comprehensive';
    }
  }

  private keywordClassification(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('search') || lower.includes('literature') || lower.includes('find')) {
      return 'literature';
    } else if (lower.includes('write') || lower.includes('generate') || lower.includes('create')) {
      return 'writing';
    } else if (lower.includes('analyze') || lower.includes('data')) {
      return 'analysis';
    } else if (lower.includes('review') || lower.includes('check')) {
      return 'review';
    } else if (lower.includes('submit') || lower.includes('journal')) {
      return 'submission';
    } else {
      return 'comprehensive';
    }
  }
}

/**
 * Agent Router Implementation
 */
export class AgentRouter implements IAgentRouter {
  private registry: IAgentRegistry;
  private classifier: TaskClassifier;

  constructor(registry: IAgentRegistry) {
    this.registry = registry;
    this.classifier = new TaskClassifier();
    console.log('✨ Agent Router initialized');
  }

  /**
   * Route user request to appropriate agent(s)
   */
  async route(request: UserRequest): Promise<RouteResult> {
    console.log('\n🔀 Routing request...');
    console.log(`   Request: ${request.text.substring(0, 50)}...`);

    const startTime = Date.now();

    try {
      // Step 1: Classify task
      const taskType = await this.classifier.classify(request);

      // Step 2: Select agents
      const agents = await this.selectAgents(taskType, request);
      console.log(`   Selected ${agents.length} agent(s): ${agents.map(a => a.name).join(', ')}`);

      // Step 3: Execute workflow
      const result = await this.executeWorkflow(agents, request);

      const executionTime = Date.now() - startTime;
      console.log(`✓ Routing complete in ${executionTime}ms`);

      return {
        taskType,
        agents: agents.map(a => a.name),
        result,
        executionTime
      };
    } catch (error: any) {
      console.error('Routing failed:', error);
      throw error;
    }
  }

  /**
   * Select agents based on task type
   */
  async selectAgents(taskType: string, request: UserRequest): Promise<AgentDefinition[]> {
    // Task type to agent mapping
    const taskToAgents: Record<string, string[]> = {
      'literature': ['literature-agent'],
      'writing': ['writing-agent'],
      'analysis': ['analysis-agent'],
      'review': ['review-agent'],
      'submission': ['submission-agent'],
      'comprehensive': ['literature-agent', 'writing-agent', 'review-agent']
    };

    const agentNames = taskToAgents[taskType] || [];
    const agents: AgentDefinition[] = [];

    for (const name of agentNames) {
      const agent = this.registry.get(name);
      if (agent) {
        agents.push(agent);
      }
    }

    if (agents.length === 0) {
      throw new Error(`No agent found for task type: ${taskType}`);
    }

    return agents;
  }

  /**
   * Execute workflow (sequential or parallel)
   */
  private async executeWorkflow(agents: AgentDefinition[], request: UserRequest): Promise<WorkflowResult> {
    // Determine execution mode based on agent count and dependencies
    const mode = agents.length === 1 ? 'sequential' : this.determineExecutionMode(agents, request);

    if (mode === 'parallel') {
      return await this.executeParallel(agents, request);
    } else {
      return await this.executeSequential(agents, request);
    }
  }

  /**
   * Determine execution mode
   */
  private determineExecutionMode(agents: AgentDefinition[], request: UserRequest): 'sequential' | 'parallel' {
    // Check if agents have dependencies
    const hasDependencies = agents.some(agent => agent.dependencies && agent.dependencies.length > 0);

    if (hasDependencies) {
      return 'sequential';
    }

    // Check execution mode of agents
    const allParallel = agents.every(agent => agent.execution.mode === 'parallel');
    const allFork = agents.every(agent => agent.execution.mode === 'fork');

    if (allParallel || allFork) {
      return 'parallel';
    }

    return 'sequential';
  }

  /**
   * Execute agents in parallel
   */
  private async executeParallel(agents: AgentDefinition[], request: UserRequest): Promise<WorkflowResult> {
    console.log(`⚡ Executing ${agents.length} agents in parallel...`);

    const startTime = Date.now();

    const results = await Promise.allSettled(
      agents.map(agent => this.executeAgent(agent, request))
    );

    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value);

    const failed = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason);

    return {
      results: successful,
      failures: failed,
      executionTime: Date.now() - startTime,
      mode: 'parallel'
    };
  }

  /**
   * Execute agents sequentially
   */
  private async executeSequential(agents: AgentDefinition[], request: UserRequest): Promise<WorkflowResult> {
    console.log(`📝 Executing ${agents.length} agents sequentially...`);

    const startTime = Date.now();
    const results: any[] = [];
    const failures: Error[] = [];
    let context = request;

    for (const agent of agents) {
      try {
        console.log(`   → Executing ${agent.name}...`);
        const result = await this.executeAgent(agent, context);
        results.push(result);
        // Pass results to next agent
        context = { ...request, previousResults: results };
      } catch (error: any) {
        failures.push(error);
        console.error(`   ✗ Agent ${agent.name} failed: ${error.message}`);
      }
    }

    return {
      results,
      failures,
      executionTime: Date.now() - startTime,
      mode: 'sequential'
    };
  }

  /**
   * Execute single agent using Claude Agent SDK
   */
  private async executeAgent(agent: AgentDefinition, request: any): Promise<any> {
    const prompt = this.buildAgentPrompt(agent, request);

    if (!queryFunction) {
      throw new Error('Claude Agent SDK not available. Please install @anthropic-ai/claude-agent-sdk');
    }

    try {
      console.log(`   🤖 Calling ${agent.name}...`);

      const response = await queryFunction({
        prompt,
        options: {
          model: 'claude-sonnet-4-5',
          maxTurns: 5,
          settingSources: ['user', 'project'],
          allowedTools: ['Skill', 'WebSearch', 'WebFetch', 'Read', 'Write', 'Bash', 'Edit'],
        }
      });

      let content = '';
      let messageCount = 0;

      for await (const message of response) {
        if (message.type === 'text') {
          messageCount++;
          content += message.text;
        }
      }

      console.log(`   ✓ ${agent.name} completed (${messageCount} messages)`);

      return {
        agent: agent.name,
        status: 'success',
        timestamp: new Date().toISOString(),
        data: content,
        messageCount,
        capabilities: agent.capabilities
      };
    } catch (error: any) {
      console.error(`   ✗ ${agent.name} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build agent execution prompt
   */
  private buildAgentPrompt(agent: AgentDefinition, request: any): string {
    return `You are ${agent.name}, ${agent.description}.

Your capabilities: ${agent.capabilities.join(', ')}

User request: ${request.text}

Execute your specialized function and provide a helpful response.`;
  }
}

// Export factory
export function createAgentRouter(registry: IAgentRegistry): AgentRouter {
  return new AgentRouter(registry);
}
