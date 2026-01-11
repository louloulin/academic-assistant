// Version Control Skill - 基于 Claude Agent SDK 的真实实现
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { execSync } from 'child_process';

/**
 * 版本控制操作的输入验证 Schema
 */
const VersionControlInputSchema = z.object({
  operation: z.enum(['init', 'commit', 'branch', 'diff', 'log', 'merge', 'revert', 'status']),
  filePath: z.string().optional(),
  message: z.string().optional(),
  branchName: z.string().optional(),
  targetBranch: z.string().optional()
});

export type VersionControlInput = z.infer<typeof VersionControlInputSchema>;

/**
 * Git 操作结果
 */
export interface VersionControlResult {
  operation: string;
  success: boolean;
  output?: string;
  error?: string;
  data?: {
    commits?: Array<{
      hash: string;
      author: string;
      date: string;
      message: string;
    }>;
    branches?: string[];
    status?: {
      modified: string[];
      added: string[];
      deleted: string[];
      untracked: string[];
    };
    diff?: string;
  };
}

/**
 * Version Control Agent 定义
 */
const VERSION_CONTROL_AGENT: AgentDefinition = {
  description: 'Expert in Git version control for managing paper versions and collaboration',
  prompt: `You are an expert in Git version control for academic writing.

## Your Capabilities

1. **Version Management**
   - Initialize Git repository for papers
   - Create commits with descriptive messages
   - Manage branches for different versions
   - Compare versions with diff

2. **Collaboration Support**
   - Merge changes from co-authors
   - Resolve conflicts intelligently
   - Track contributions
   - Maintain clean history

3. **Operations**
   - init: Initialize repository
   - commit: Save changes with message
   - branch: Create/manage branches
   - diff: Show differences
   - log: View commit history
   - merge: Combine branches
   - revert: Undo changes

Remember: Use Git commands through Bash tool. Always provide clear output.`,
  tools: ['Bash', 'Read', 'Write'],
  model: 'sonnet'
};

/**
 * VersionControlSkill - 基于 Claude Agent SDK 的实现
 */
export class VersionControlSkill {
  private agent: AgentDefinition;

  constructor() {
    this.agent = VERSION_CONTROL_AGENT;
  }

  async validate(input: unknown): Promise<VersionControlInput> {
    return VersionControlInputSchema.parseAsync(input);
  }

  async execute(input: VersionControlInput): Promise<VersionControlResult> {
    const validatedInput = await this.validate(input);

    console.log(`🔧 版本控制: ${validatedInput.operation}`);

    try {
      switch (validatedInput.operation) {
        case 'init':
          return this.initRepo();
        case 'commit':
          return this.commitChanges(validatedInput.filePath, validatedInput.message);
        case 'branch':
          return this.createBranch(validatedInput.branchName);
        case 'diff':
          return this.showDiff(validatedInput.filePath);
        case 'log':
          return this.showLog();
        case 'status':
          return this.showStatus();
        case 'merge':
          return this.mergeBranch(validatedInput.targetBranch);
        case 'revert':
          return this.revertChanges(validatedInput.filePath);
        default:
          throw new Error(`Unknown operation: ${validatedInput.operation}`);
      }
    } catch (error) {
      return {
        operation: validatedInput.operation,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private initRepo(): VersionControlResult {
    try {
      execSync('git init', { encoding: 'utf-8' });
      return {
        operation: 'init',
        success: true,
        output: 'Git repository initialized'
      };
    } catch (error) {
      return {
        operation: 'init',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private commitChanges(filePath?: string, message?: string): VersionControlResult {
    try {
      if (filePath) {
        execSync(`git add ${filePath}`, { encoding: 'utf-8' });
      } else {
        execSync('git add .', { encoding: 'utf-8' });
      }

      const commitMsg = message || 'Update paper';
      execSync(`git commit -m "${commitMsg}"`, { encoding: 'utf-8' });

      return {
        operation: 'commit',
        success: true,
        output: `Committed changes: ${commitMsg}`
      };
    } catch (error) {
      return {
        operation: 'commit',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private createBranch(branchName?: string): VersionControlResult {
    try {
      const name = branchName || 'new-branch';
      execSync(`git checkout -b ${name}`, { encoding: 'utf-8' });

      return {
        operation: 'branch',
        success: true,
        output: `Created and switched to branch: ${name}`
      };
    } catch (error) {
      return {
        operation: 'branch',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private showDiff(filePath?: string): VersionControlResult {
    try {
      const target = filePath ? filePath : '';
      const diff = execSync(`git diff ${target}`, { encoding: 'utf-8' });

      return {
        operation: 'diff',
        success: true,
        output: diff,
        data: { diff }
      };
    } catch (error) {
      return {
        operation: 'diff',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private showLog(): VersionControlResult {
    try {
      const log = execSync('git log -10 --pretty=format:"%H|%an|%ad|%s" --date=short', { encoding: 'utf-8' });
      const commits = log.split('\n').filter(l => l).map(line => {
        const [hash, author, date, message] = line.split('|');
        return { hash, author, date, message };
      });

      return {
        operation: 'log',
        success: true,
        data: { commits }
      };
    } catch (error) {
      return {
        operation: 'log',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private showStatus(): VersionControlResult {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      const lines = status.split('\n').filter(l => l);

      const result: VersionControlResult = {
        operation: 'status',
        success: true,
        data: {
          status: {
            modified: [],
            added: [],
            deleted: [],
            untracked: []
          }
        }
      };

      for (const line of lines) {
        const statusCode = line.substring(0, 2);
        const filePath = line.substring(3);

        if (statusCode.includes('M')) {
          result.data?.status?.modified.push(filePath);
        }
        if (statusCode.includes('A')) {
          result.data?.status?.added.push(filePath);
        }
        if (statusCode.includes('D')) {
          result.data?.status?.deleted.push(filePath);
        }
        if (statusCode === '??') {
          result.data?.status?.untracked.push(filePath);
        }
      }

      return result;
    } catch (error) {
      return {
        operation: 'status',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private mergeBranch(targetBranch?: string): VersionControlResult {
    try {
      const branch = targetBranch || 'main';
      execSync(`git merge ${branch}`, { encoding: 'utf-8' });

      return {
        operation: 'merge',
        success: true,
        output: `Merged branch: ${branch}`
      };
    } catch (error) {
      return {
        operation: 'merge',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private revertChanges(filePath?: string): VersionControlResult {
    try {
      if (filePath) {
        execSync(`git checkout -- ${filePath}`, { encoding: 'utf-8' });
      } else {
        execSync('git checkout -- .', { encoding: 'utf-8' });
      }

      return {
        operation: 'revert',
        success: true,
        output: 'Reverted uncommitted changes'
      };
    } catch (error) {
      return {
        operation: 'revert',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  getAgentDefinition(): AgentDefinition {
    return this.agent;
  }
}

export const versionControlSkill = new VersionControlSkill();
