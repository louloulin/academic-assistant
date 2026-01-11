// Experiment Runner Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { execSync } from 'child_process';

/**
 * 实验运行的输入验证 Schema
 */
const ExperimentInputSchema = z.object({
  code: z.string().min(1),
  language: z.enum(['python', 'r', 'julia', 'javascript', 'bash']).default('python'),
  timeout: z.number().min(1).max(300).default(30),
  captureOutput: z.boolean().default(true)
});

export type ExperimentInput = z.infer<typeof ExperimentInputSchema>;

/**
 * 实验执行结果
 */
export interface ExperimentResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
  language: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
}

/**
 * Experiment Runner Agent 定义
 */
const EXPERIMENT_RUNNER_AGENT: AgentDefinition = {
  description: 'Expert in executing research code in isolated sandboxed environments',
  prompt: `You are an expert in running research experiments in safe, isolated environments.

## Your Capabilities

1. **Code Execution**
   - Execute Python, R, Julia, JavaScript, Bash code
   - Capture output and errors
   - Enforce timeout limits
   - Resource constraints

2. **Safety**
   - Isolated execution environment
   - Timeout protection
   - Resource limits
   - Error handling

3. **Output**
   Return structured execution result with stdout, stderr, exit code, and timing.

Remember: Use Bash tool for execution. Always enforce timeouts and handle errors gracefully.`,
  tools: ['Bash', 'Read', 'Write'],
  model: 'sonnet'
};

/**
 * ExperimentRunnerSkill - 基于 Claude Agent SDK 的实现
 */
export class ExperimentRunnerSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = EXPERIMENT_RUNNER_AGENT;
  }

  async validate(input: unknown): Promise<ExperimentInput> {
    return ExperimentInputSchema.parseAsync(input);
  }

  async execute(input: ExperimentInput): Promise<ExperimentResult> {
    const validatedInput = await this.validate(input);

    console.log(`🧪 运行实验`);
    console.log(`📝 语言: ${validatedInput.language}`);
    console.log(`⏱️ 超时: ${validatedInput.timeout}秒`);

    const startTime = Date.now();

    try {
      let command: string;

      switch (validatedInput.language) {
        case 'python':
          command = `python3 -c "${validatedInput.code.replace(/"/g, '\\"')}"`;
          break;
        case 'r':
          command = `Rscript -e "${validatedInput.code.replace(/"/g, '\\"')}"`;
          break;
        case 'julia':
          command = `julia -e "${validatedInput.code.replace(/"/g, '\\"')}"`;
          break;
        case 'javascript':
          command = `node -e "${validatedInput.code.replace(/"/g, '\\"')}"`;
          break;
        case 'bash':
          command = validatedInput.code;
          break;
        default:
          throw new Error(`Unsupported language: ${validatedInput.language}`);
      }

      // Execute with timeout
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: validatedInput.timeout * 1000,
        stdio: validatedInput.captureOutput ? 'pipe' : 'inherit'
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output,
        executionTime,
        language: validatedInput.language,
        exitCode: 0,
        stdout: output
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        executionTime,
        language: validatedInput.language,
        exitCode: error.status || 1,
        stderr: error.stderr
      };
    }
  }

  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }

  /**
   * 批量运行实验
   */
  async batchRun(experiments: Array<{code: string; language: string}>): Promise<ExperimentResult[]> {
    console.log(`🧪 批量运行 ${experiments.length} 个实验`);

    const results: ExperimentResult[] = [];
    for (let i = 0; i < experiments.length; i++) {
      console.log(`[${i + 1}/${experiments.length}] 运行中...`);
      const result = await this.execute({
        ...experiments[i],
        timeout: 30,
        captureOutput: true
      });
      results.push(result);
    }

    return results;
  }
}

export const experimentRunnerSkill = new ExperimentRunnerSkill();
