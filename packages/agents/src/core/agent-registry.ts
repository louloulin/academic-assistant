/**
 * Agent Registry
 *
 * Central registry for all available agents.
 * Plan 6 - Agent Orchestration System
 */

import { AgentDefinition, IAgentRegistry } from './agent.types';

export class AgentRegistry implements IAgentRegistry {
  private agents: Map<string, AgentDefinition>;

  constructor() {
    this.agents = new Map();
    console.log('✨ Agent Registry initialized');
  }

  /**
   * Register an agent
   */
  register(agent: AgentDefinition): void {
    console.log(`   Registering agent: ${agent.name}`);
    this.agents.set(agent.name, agent);
  }

  /**
   * Unregister an agent
   */
  unregister(name: string): void {
    console.log(`   Unregistering agent: ${name}`);
    this.agents.delete(name);
  }

  /**
   * Get agent by name
   */
  get(name: string): AgentDefinition | undefined {
    return this.agents.get(name);
  }

  /**
   * Find agents by capability
   */
  find(capability: string): AgentDefinition[] {
    const found: AgentDefinition[] = [];

    for (const agent of this.agents.values()) {
      if (agent.capabilities.includes(capability)) {
        found.push(agent);
      }
    }

    return found;
  }

  /**
   * List all registered agents
   */
  listAll(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by skill
   */
  getBySkill(skill: string): AgentDefinition[] {
    const found: AgentDefinition[] = [];

    for (const agent of this.agents.values()) {
      if (agent.skills.includes(skill)) {
        found.push(agent);
      }
    }

    return found;
  }

  /**
   * Get agents by type/category
   */
  getByType(type: string): AgentDefinition[] {
    // Determine type based on agent naming
    return this.listAll().filter(agent => agent.name.includes(type));
  }
}

/**
 * Predefined Agents
 */
export function registerDefaultAgents(registry: AgentRegistry): void {
  // Literature Agent
  registry.register({
    name: 'literature-agent',
    description: 'Specialized agent for literature search and analysis',
    skills: ['literature-search', 'pdf-analyzer', 'citation-graph', 'semantic-search'],
    capabilities: [
      'Search across multiple academic databases',
      'Extract and analyze PDF content',
      'Generate citation graphs',
      'Perform semantic similarity search'
    ],
    inputFormat: 'Research topic or query',
    outputFormat: 'Literature review with citations and graph',
    execution: {
      mode: 'parallel',
      timeout: 120000,
      retryPolicy: 'exponential',
      maxRetries: 3
    }
  });

  // Writing Agent
  registry.register({
    name: 'writing-agent',
    description: 'Specialized agent for academic writing assistance',
    skills: ['paper-structure', 'academic-polisher', 'conversational-editor', 'creative-expander'],
    capabilities: [
      'Generate paper structure',
      'Polish academic language',
      'Interactive writing assistance',
      'Creative expansion of ideas'
    ],
    inputFormat: 'Research topic or partial draft',
    outputFormat: 'Complete or expanded academic text',
    execution: {
      mode: 'sequential',
      timeout: 180000,
      retryPolicy: 'fixed',
      maxRetries: 2
    }
  });

  // Analysis Agent
  registry.register({
    name: 'analysis-agent',
    description: 'Specialized agent for data analysis and experimentation',
    skills: ['data-analyzer', 'experiment-runner', 'data-analysis'],
    capabilities: [
      'Statistical analysis',
      'Experiment execution',
      'Visualization generation',
      'Report writing'
    ],
    inputFormat: 'Dataset or experiment code',
    outputFormat: 'Analysis report with visualizations',
    execution: {
      mode: 'fork', // Isolated execution for safety
      timeout: 300000,
      retryPolicy: 'exponential',
      maxRetries: 2
    },
    requirements: {
      memory: 1024,
      capabilities: ['python', 'r', 'javascript']
    }
  });

  // Review Agent
  registry.register({
    name: 'review-agent',
    description: 'Specialized agent for peer review simulation',
    skills: ['peer-review', 'writing-quality', 'plagiarism-checker'],
    capabilities: [
      'Simulate peer review process',
      'Check writing quality',
      'Detect potential plagiarism',
      'Provide improvement suggestions'
    ],
    inputFormat: 'Complete manuscript',
    outputFormat: 'Review report with decision',
    execution: {
      mode: 'parallel',
      timeout: 60000,
      retryPolicy: 'none'
    }
  });

  // Submission Agent
  registry.register({
    name: 'submission-agent',
    description: 'Specialized agent for journal submission',
    skills: ['journal-submission', 'journal-matchmaker', 'citation-manager'],
    capabilities: [
      'Match suitable journals',
      'Generate cover letters',
      'Format citations',
      'Prepare submission package'
    ],
    inputFormat: 'Final manuscript',
    outputFormat: 'Submission-ready package',
    execution: {
      mode: 'sequential',
      timeout: 90000,
      retryPolicy: 'fixed',
      maxRetries: 2
    }
  });

  console.log(`✓ Registered ${registry.listAll().length} default agents`);
}

// Export factory
export function createAgentRegistry(): AgentRegistry {
  const registry = new AgentRegistry();
  registerDefaultAgents(registry);
  return registry;
}
