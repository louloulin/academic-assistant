/**
 * Agent Orchestration System
 *
 * Main entry point for Plan 6 - Agent Orchestration
 * Exports all components for multi-agent collaboration
 *
 * Plan 6 - Agent Orchestration System
 */

// Core types
export * from './core/agent.types.js';

// Core components
export { AgentRegistry, createAgentRegistry, registerDefaultAgents } from './core/agent-registry.js';
export { AgentRouter, createAgentRouter } from './routing/agent-router.js';
export { WorkflowEngine, createWorkflowEngine, registerDefaultWorkflows } from './workflow/workflow-engine.js';
export {
  ContextManager,
  createContextManager,
  createInitialContext,
  mergeAgentResults,
  extractResultData
} from './context/context-manager.js';

// Skill integration
export {
  SkillIntegrationService,
  createSkillIntegrationService
} from './skills/skill-integration.service.js';

// Subagent execution
export {
  SubagentExecutionService,
  createSubagentExecutionService
} from './subagent/subagent-execution.service.js';

/**
 * Agent Orchestration System
 *
 * Main class that combines all orchestration components
 * Now includes Skill integration and Subagent execution
 */
export class AgentOrchestrationSystem {
  public registry: any;
  public router: any;
  public workflowEngine: any;
  public contextManager: any;
  public skillIntegration: any;
  public subagentExecution: any;

  constructor() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║     Agent Orchestration System - Plan 6                    ║');
    console.log('║     Enhanced with Skill & Subagent Integration            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Initialize components
    this.registry = createAgentRegistry();
    this.router = createAgentRouter(this.registry);
    this.workflowEngine = createWorkflowEngine();
    this.contextManager = createContextManager();
    this.skillIntegration = createSkillIntegrationService();
    this.subagentExecution = createSubagentExecutionService();

    console.log('✨ All components initialized\n');
  }

  /**
   * Process user request
   */
  async processRequest(request: {
    text: string;
    type?: string;
    data?: Record<string, any>;
  }): Promise<{
    taskType: string;
    agents: string[];
    result: any;
    executionTime: number;
  }> {
    // Initialize context
    await this.contextManager.initialize(createInitialContext(request.data));

    // Route request
    const result = await this.router.route({
      text: request.text,
      type: request.type,
      data: request.data
    });

    return result;
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowName: string,
    contextData?: Record<string, any>
  ): Promise<any> {
    const context = createInitialContext(contextData);
    await this.contextManager.initialize(context);

    return await this.workflowEngine.execute(workflowName, context);
  }

  /**
   * Get system status
   */
  getStatus(): {
    agents: number;
    workflows: number;
    contextStats: any;
    skills: number;
    subagentStats: any;
  } {
    return {
      agents: this.registry.list().length,
      workflows: this.workflowEngine.list().length,
      contextStats: this.contextManager.getStatistics(),
      skills: this.skillIntegration.getAllSkills().length,
      subagentStats: this.subagentExecution.getStatistics()
    };
  }

  /**
   * Get system information
   */
  getInfo(): string {
    const skills = this.skillIntegration.getAllSkills();
    const forkSkills = skills.filter(s => s.context === 'fork').length;

    return `
╔══════════════════════════════════════════════════════════════╗
║           Agent Orchestration System                        ║
║           Plan 6 - Multi-Agent Collaboration                ║
╠══════════════════════════════════════════════════════════════╣
║  Registered Agents: ${this.registry.list().length.toString().padEnd(45)}║
║  Available Workflows: ${this.workflowEngine.list().length.toString().padEnd(43)}║
║  Integrated Skills: ${skills.length.toString().padEnd(43)}║
║  Fork Context Skills: ${forkSkills.toString().padEnd(43)}║
╠══════════════════════════════════════════════════════════════╣
║  Components:                                                ║
║  - Agent Registry: Manage available agents                  ║
║  - Agent Router: Intelligent request routing                ║
║  - Workflow Engine: Orchestrate complex workflows           ║
║  - Context Manager: Share state between agents              ║
║  - Skill Integration: Bridge agents to 24 skills           ║
║  - Subagent Execution: Parallel & DAG execution            ║
╚══════════════════════════════════════════════════════════════╝
    `.trim();
  }
}

/**
 * Factory function
 */
export function createAgentOrchestrationSystem(): AgentOrchestrationSystem {
  return new AgentOrchestrationSystem();
}
