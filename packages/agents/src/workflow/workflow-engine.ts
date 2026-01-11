/**
 * Workflow Engine
 *
 * Orchestrate complex multi-agent workflows with sequential,
 * parallel, conditional, and DAG execution modes.
 * Plan 6 - Agent Orchestration System
 */

import { AgentDefinition, Workflow, WorkflowStep, WorkflowResult, WorkflowContext, IWorkflowEngine } from '../core/agent.types';

/**
 * Workflow Engine Implementation
 */
export class WorkflowEngine implements IWorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();

  constructor() {
    console.log('✨ Workflow Engine initialized');
    console.log('   Supports: Sequential, Parallel, Conditional, DAG execution');
  }

  /**
   * Register workflow
   */
  register(workflow: Workflow): void {
    this.workflows.set(workflow.name, workflow);
    console.log(`✓ Workflow registered: ${workflow.name}`);
  }

  /**
   * Unregister workflow
   */
  unregister(name: string): void {
    this.workflows.delete(name);
  }

  /**
   * Get workflow by name
   */
  get(name: string): Workflow | undefined {
    return this.workflows.get(name);
  }

  /**
   * List all workflows
   */
  list(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Execute workflow by name
   */
  async execute(name: string, context: WorkflowContext): Promise<WorkflowResult> {
    const workflow = this.workflows.get(name);
    if (!workflow) {
      throw new Error(`Workflow not found: ${name}`);
    }

    return await this.executeWorkflow(workflow, context);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflow: Workflow, context: WorkflowContext): Promise<WorkflowResult> {
    console.log(`\n🔄 Executing workflow: ${workflow.name}`);
    console.log(`   Mode: ${workflow.mode}`);
    console.log(`   Steps: ${workflow.steps.length}`);

    const startTime = Date.now();

    try {
      let result: WorkflowResult;

      switch (workflow.mode) {
        case 'sequential':
          result = await this.executeSequential(workflow, context);
          break;
        case 'parallel':
          result = await this.executeParallel(workflow, context);
          break;
        case 'conditional':
          result = await this.executeConditional(workflow, context);
          break;
        case 'dag':
          result = await this.executeDAG(workflow, context);
          break;
        default:
          throw new Error(`Unknown workflow mode: ${workflow.mode}`);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✓ Workflow complete in ${executionTime}ms`);

      return {
        results: result.results,
        failures: result.failures,
        executionTime,
        mode: workflow.mode
      };
    } catch (error: any) {
      console.error(`Workflow execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute sequential workflow
   */
  private async executeSequential(workflow: Workflow, context: WorkflowContext): Promise<WorkflowResult> {
    console.log('📝 Sequential execution mode');

    const startTime = Date.now();
    const results: any[] = [];
    const failures: Error[] = [];

    for (const step of workflow.steps) {
      try {
        console.log(`   → Step: ${step.name}`);
        const result = await this.executeStep(step, context);
        results.push(result);
        // Update context with step results
        context = { ...context, previousResults: results };
      } catch (error: any) {
        failures.push(error);
        console.error(`   ✗ Step ${step.name} failed: ${error.message}`);

        // Stop on failure if configured
        if (step.stopOnFailure) {
          break;
        }
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
   * Execute parallel workflow
   */
  private async executeParallel(workflow: Workflow, context: WorkflowContext): Promise<WorkflowResult> {
    console.log('⚡ Parallel execution mode');

    const startTime = Date.now();

    const results = await Promise.allSettled(
      workflow.steps.map(step => this.executeStep(step, context))
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
   * Execute conditional workflow
   */
  private async executeConditional(workflow: Workflow, context: WorkflowContext): Promise<WorkflowResult> {
    console.log('🔀 Conditional execution mode');

    const startTime = Date.now();
    const results: any[] = [];
    const failures: Error[] = [];

    for (const step of workflow.steps) {
      // Check if condition is met
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        console.log(`   ⊘ Skipping step: ${step.name} (condition not met)`);
        continue;
      }

      try {
        console.log(`   → Step: ${step.name}`);
        const result = await this.executeStep(step, context);
        results.push(result);
        context = { ...context, previousResults: results };
      } catch (error: any) {
        failures.push(error);
        console.error(`   ✗ Step ${step.name} failed: ${error.message}`);
      }
    }

    return {
      results,
      failures,
      executionTime: Date.now() - startTime,
      mode: 'conditional'
    };
  }

  /**
   * Execute DAG workflow
   */
  private async executeDAG(workflow: Workflow, context: WorkflowContext): Promise<WorkflowResult> {
    console.log('🕸️ DAG execution mode');

    const startTime = Date.now();
    const results: any[] = [];
    const failures: Error[] = [];

    // Build dependency graph
    const graph = this.buildDependencyGraph(workflow.steps);
    const executed = new Set<string>();

    // Execute in topological order
    while (executed.size < workflow.steps.length) {
      // Find steps that can be executed (all dependencies satisfied)
      const ready = workflow.steps.filter(step =>
        !executed.has(step.id) &&
        (step.dependencies || []).every(dep => executed.has(dep))
      );

      if (ready.length === 0 && executed.size < workflow.steps.length) {
        throw new Error('Circular dependency detected in workflow');
      }

      // Execute ready steps in parallel
      const stepResults = await Promise.allSettled(
        ready.map(step => this.executeStep(step, context))
      );

      for (const result of stepResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          const step = ready.find(s => s.name === result.value.step);
          if (step) executed.add(step.id);
        } else {
          failures.push(result.reason);
        }
      }

      // Update context
      context = { ...context, previousResults: results };
    }

    return {
      results,
      failures,
      executionTime: Date.now() - startTime,
      mode: 'dag'
    };
  }

  /**
   * Execute single step
   */
  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    // In production, this would call the actual agent/skill
    // For now, simulate execution
    console.log(`      Executing ${step.agent || 'skill'}: ${step.name}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      step: step.name,
      agent: step.agent,
      status: 'success',
      timestamp: new Date().toISOString(),
      data: `Executed ${step.name} with ${step.agent || 'skill'}`
    };
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(steps: WorkflowStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const step of steps) {
      graph.set(step.id, step.dependencies || []);
    }

    return graph;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    // Simple condition evaluation
    // In production, use a proper expression evaluator

    const predicates: Record<string, (ctx: WorkflowContext) => boolean> = {
      'hasResults': (ctx) => ctx.previousResults && ctx.previousResults.length > 0,
      'hasFailures': (ctx) => ctx.failures && ctx.failures.length > 0,
      'isFirst': (ctx) => !ctx.previousResults || ctx.previousResults.length === 0,
      'always': () => true
    };

    const predicate = predicates[condition];
    if (predicate) {
      return predicate(context);
    }

    // Default: true
    return true;
  }

  /**
   * Create workflow from definition
   */
  createWorkflow(definition: Partial<Workflow>): Workflow {
    return {
      name: definition.name || 'unnamed',
      description: definition.description || '',
      mode: definition.mode || 'sequential',
      steps: definition.steps || [],
      timeout: definition.timeout,
      retryPolicy: definition.retryPolicy || 'none'
    };
  }

  /**
   * Validate workflow
   */
  validate(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    // Check for circular dependencies in DAG mode
    if (workflow.mode === 'dag') {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      for (const step of workflow.steps) {
        if (this.hasCycle(step, workflow.steps, visited, recursionStack)) {
          errors.push('Circular dependency detected');
          break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for circular dependencies
   */
  private hasCycle(
    step: WorkflowStep,
    steps: WorkflowStep[],
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(step.id);
    recursionStack.add(step.id);

    for (const depId of step.dependencies || []) {
      const depStep = steps.find(s => s.id === depId);
      if (!depStep) continue;

      if (!visited.has(depId)) {
        if (this.hasCycle(depStep, steps, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(depId)) {
        return true;
      }
    }

    recursionStack.delete(step.id);
    return false;
  }
}

/**
 * Predefined Workflows
 */
export function registerDefaultWorkflows(engine: WorkflowEngine): void {
  // Literature Review Workflow
  const literatureReviewWorkflow: Workflow = {
    name: 'literature-review',
    description: 'Comprehensive literature review process',
    mode: 'sequential',
    steps: [
      {
        id: 'search',
        name: 'Search Literature',
        agent: 'literature-agent',
        capabilities: ['literature-search']
      },
      {
        id: 'analyze',
        name: 'Analyze Papers',
        agent: 'literature-agent',
        capabilities: ['literature-analysis'],
        dependencies: ['search']
      },
      {
        id: 'synthesize',
        name: 'Synthesize Findings',
        agent: 'writing-agent',
        capabilities: ['literature-synthesis'],
        dependencies: ['analyze']
      }
    ]
  };

  // Paper Writing Workflow
  const paperWritingWorkflow: Workflow = {
    name: 'paper-writing',
    description: 'Complete academic paper writing process',
    mode: 'dag',
    steps: [
      {
        id: 'structure',
        name: 'Create Structure',
        agent: 'writing-agent',
        capabilities: ['paper-structure']
      },
      {
        id: 'literature',
        name: 'Literature Review',
        agent: 'literature-agent',
        capabilities: ['literature-review']
      },
      {
        id: 'methods',
        name: 'Write Methods',
        agent: 'writing-agent',
        capabilities: ['academic-writing'],
        dependencies: ['structure']
      },
      {
        id: 'results',
        name: 'Write Results',
        agent: 'writing-agent',
        capabilities: ['academic-writing'],
        dependencies: ['structure']
      },
      {
        id: 'discussion',
        name: 'Write Discussion',
        agent: 'writing-agent',
        capabilities: ['academic-writing'],
        dependencies: ['methods', 'results']
      },
      {
        id: 'review',
        name: 'Review Paper',
        agent: 'review-agent',
        capabilities: ['peer-review'],
        dependencies: ['discussion']
      }
    ]
  };

  // Parallel Analysis Workflow
  const parallelAnalysisWorkflow: Workflow = {
    name: 'parallel-analysis',
    description: 'Run multiple analyses in parallel',
    mode: 'parallel',
    steps: [
      {
        id: 'grammar',
        name: 'Grammar Check',
        agent: 'review-agent',
        capabilities: ['grammar-check']
      },
      {
        id: 'quality',
        name: 'Quality Assessment',
        agent: 'review-agent',
        capabilities: ['quality-assessment']
      },
      {
        id: 'citation',
        name: 'Citation Check',
        agent: 'literature-agent',
        capabilities: ['citation-validation']
      }
    ]
  };

  // Conditional Submission Workflow
  const conditionalSubmissionWorkflow: Workflow = {
    name: 'conditional-submission',
    description: 'Journal submission with quality gates',
    mode: 'conditional',
    steps: [
      {
        id: 'check',
        name: 'Quality Check',
        agent: 'review-agent',
        capabilities: ['quality-check']
      },
      {
        id: 'improve',
        name: 'Improve if Needed',
        agent: 'writing-agent',
        capabilities: ['text-improvement'],
        condition: 'hasFailures',
        dependencies: ['check']
      },
      {
        id: 'select',
        name: 'Select Journal',
        agent: 'submission-agent',
        capabilities: ['journal-selection'],
        dependencies: ['improve']
      },
      {
        id: 'submit',
        name: 'Prepare Submission',
        agent: 'submission-agent',
        capabilities: ['submission-prep'],
        dependencies: ['select']
      }
    ]
  };

  engine.register(literatureReviewWorkflow);
  engine.register(paperWritingWorkflow);
  engine.register(parallelAnalysisWorkflow);
  engine.register(conditionalSubmissionWorkflow);
}

// Export factory
export function createWorkflowEngine(): WorkflowEngine {
  const engine = new WorkflowEngine();
  registerDefaultWorkflows(engine);
  return engine;
}
