/**
 * Skill Integration Service
 *
 * Bridges Agent orchestration system with existing Skills
 * Enables Agents to invoke Skills through the Skill tool
 *
 * Plan 6 - Full Claude Agent SDK Integration with Skills
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

export interface SkillMetadata {
  name: string;
  description: string;
  category: 'P0' | 'P1' | 'P2' | 'Core';
  context: 'fork' | 'default';
  allowedTools: string[];
  capabilities: string[];
}

export interface SkillInvocationRequest {
  skillName: string;
  parameters: Record<string, any>;
  context?: 'fork' | 'default';
}

export interface SkillInvocationResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

/**
 * Skill Integration Service
 *
 * Manages integration between Agent orchestration and Skills
 */
export class SkillIntegrationService {
  private skills: Map<string, SkillMetadata> = new Map();
  private skillBasePath: string;

  constructor(skillBasePath: string = '/var/tmp/vibe-kanban/worktrees/de3c-plan5/skills/.claude/skills') {
    this.skillBasePath = skillBasePath;
    console.log('✨ Skill Integration Service initialized');
    console.log('   Mode: Full Claude Agent SDK Skill Integration');
    console.log(`   Skill Path: ${skillBasePath}`);
  }

  /**
   * Load all available Skills
   */
  async loadSkills(): Promise<void> {
    console.log('📚 Loading Skills...');

    const skillCategories = [
      { path: 'academic-polisher', category: 'P1' as const },
      { path: 'citation-graph', category: 'P0' as const },
      { path: 'citation-manager', category: 'Core' as const },
      { path: 'collaboration-hub', category: 'P2' as const },
      { path: 'conversational-editor', category: 'P2' as const },
      { path: 'creative-expander', category: 'P2' as const },
      { path: 'data-analysis', category: 'P1' as const },
      { path: 'data-analyzer', category: 'P1' as const },
      { path: 'experiment-runner', category: 'P1' as const },
      { path: 'journal-matchmaker', category: 'P1' as const },
      { path: 'journal-submission', category: 'P1' as const },
      { path: 'literature-review', category: 'Core' as const },
      { path: 'literature-search', category: 'Core' as const },
      { path: 'multilingual-writer', category: 'P2' as const },
      { path: 'paper-structure', category: 'Core' as const },
      { path: 'pdf-analyzer', category: 'P0' as const },
      { path: 'peer-review', category: 'Core' as const },
      { path: 'personalized-recommender', category: 'P2' as const },
      { path: 'plagiarism-checker', category: 'P1' as const },
      { path: 'semantic-search', category: 'P1' as const },
      { path: 'version-control', category: 'P2' as const },
      { path: 'workflow-manager', category: 'P2' as const },
      { path: 'writing-quality', category: 'Core' as const },
      { path: 'zotero-integrator', category: 'P1' as const }
    ];

    for (const { path, category } of skillCategories) {
      try {
        const metadata = await this.loadSkillMetadata(path, category);
        if (metadata) {
          this.skills.set(metadata.name, metadata);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to load skill: ${path}`);
      }
    }

    console.log(`✓ Loaded ${this.skills.size} Skills`);
    this.logSkillSummary();
  }

  /**
   * Load metadata for a single Skill
   */
  private async loadSkillMetadata(
    skillPath: string,
    category: 'P0' | 'P1' | 'P2' | 'Core'
  ): Promise<SkillMetadata | null> {
    const skillFile = join(this.skillBasePath, skillPath, 'SKILL.md');

    try {
      const content = await readFile(skillFile, 'utf-8');
      const metadata = this.parseSkillMetadata(content, skillPath, category);
      return metadata;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse metadata from SKILL.md content
   */
  private parseSkillMetadata(
    content: string,
    skillPath: string,
    category: 'P0' | 'P1' | 'P2' | 'Core'
  ): SkillMetadata {
    // Extract name from frontmatter
    const nameMatch = content.match(/name:\s*(.+)/);
    const name = nameMatch ? nameMatch[1].trim() : skillPath;

    // Extract description from frontmatter
    const descMatch = content.match(/description:\s*(.+)/);
    const description = descMatch ? descMatch[1].trim() : `Skill for ${skillPath}`;

    // Extract context
    const contextMatch = content.match(/context:\s*(.+)/);
    const context = (contextMatch ? contextMatch[1].trim() : 'default') as 'fork' | 'default';

    // Extract allowed-tools
    const toolsMatch = content.match(/allowed-tools:\s*\[(.*?)\]/s);
    let allowedTools: string[] = ['Skill']; // Default
    if (toolsMatch) {
      const toolsStr = toolsMatch[1];
      allowedTools = toolsStr
        .split(',')
        .map(t => t.trim().replace(/['"]/g, ''))
        .filter(t => t.length > 0);
      if (allowedTools.length === 0) {
        allowedTools = ['Skill'];
      }
    }

    // Extract capabilities from description section
    const capabilities = this.extractCapabilities(content);

    return {
      name,
      description,
      category,
      context,
      allowedTools,
      capabilities
    };
  }

  /**
   * Extract capabilities from SKILL.md content
   */
  private extractCapabilities(content: string): string[] {
    const capabilities: string[] = [];

    // Look for bullet points in the description section
    const lines = content.split('\n');
    let inDescription = false;

    for (const line of lines) {
      if (line.startsWith('##')) {
        if (inDescription) break;
        if (line.includes('escription') || line.includes('What this skill does')) {
          inDescription = true;
        }
        continue;
      }

      if (inDescription && line.trim().startsWith('-')) {
        const capability = line.replace(/^-\s*/, '').trim();
        if (capability.length > 0) {
          capabilities.push(capability);
        }
      }
    }

    return capabilities.slice(0, 5); // Limit to 5 key capabilities
  }

  /**
   * Get all Skills
   */
  getAllSkills(): SkillMetadata[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get Skills by category
   */
  getSkillsByCategory(category: 'P0' | 'P1' | 'P2' | 'Core'): SkillMetadata[] {
    return Array.from(this.skills.values()).filter(s => s.category === category);
  }

  /**
   * Get Skill by name
   */
  getSkill(name: string): SkillMetadata | undefined {
    return this.skills.get(name);
  }

  /**
   * Find Skills that can handle a specific task
   */
  findSkillsForTask(taskDescription: string): SkillMetadata[] {
    const keywords = taskDescription.toLowerCase().split(/\s+/);
    const matchedSkills: Array<{ skill: SkillMetadata; score: number }> = [];

    for (const skill of this.skills.values()) {
      let score = 0;

      // Check name match
      for (const keyword of keywords) {
        if (skill.name.toLowerCase().includes(keyword)) {
          score += 3;
        }
      }

      // Check description match
      for (const keyword of keywords) {
        if (skill.description.toLowerCase().includes(keyword)) {
          score += 1;
        }
      }

      // Check capabilities match
      for (const capability of skill.capabilities) {
        for (const keyword of keywords) {
          if (capability.toLowerCase().includes(keyword)) {
            score += 2;
          }
        }
      }

      if (score > 0) {
        matchedSkills.push({ skill, score });
      }
    }

    // Sort by score and return
    matchedSkills.sort((a, b) => b.score - a.score);
    return matchedSkills.slice(0, 5).map(m => m.skill);
  }

  /**
   * Get Skills that use fork context
   */
  getForkContextSkills(): SkillMetadata[] {
    return Array.from(this.skills.values()).filter(s => s.context === 'fork');
  }

  /**
   * Get Skills that can call other Skills
   */
  getSkillsWithSkillTool(): SkillMetadata[] {
    return Array.from(this.skills.values()).filter(s =>
      s.allowedTools.includes('Skill')
    );
  }

  /**
   * Build Skill invocation prompt
   */
  buildSkillInvocationPrompt(request: SkillInvocationRequest): string {
    const skill = this.getSkill(request.skillName);
    if (!skill) {
      throw new Error(`Skill not found: ${request.skillName}`);
    }

    return `You are to invoke the ${skill.name} skill.

Description: ${skill.description}

Parameters:
${JSON.stringify(request.parameters, null, 2)}

Use the Skill tool to invoke ${skill.name} with the provided parameters.`;
  }

  /**
   * Log skill summary
   */
  private logSkillSummary(): void {
    const byCategory: Record<string, number> = {};
    const forkContext = this.getForkContextSkills().length;
    const withSkillTool = this.getSkillsWithSkillTool().length;

    for (const skill of this.skills.values()) {
      byCategory[skill.category] = (byCategory[skill.category] || 0) + 1;
    }

    console.log('\n   📊 Skill Summary:');
    console.log(`   ┌────────────────────────────────────┐`);
    for (const [category, count] of Object.entries(byCategory)) {
      console.log(`   │ ${category.padEnd(8)} │ ${count.toString().padStart(4)} Skills │`);
    }
    console.log(`   ├────────────────────────────────────┤`);
    console.log(`   │ Fork Context │ ${forkContext.toString().padStart(4)} Skills │`);
    console.log(`   │ Skill Tool   │ ${withSkillTool.toString().padStart(4)} Skills │`);
    console.log(`   └────────────────────────────────────┘\n`);
  }

  /**
   * Generate Agent-Skill mapping
   */
  generateAgentSkillMapping(): Record<string, string[]> {
    return {
      'literature-agent': [
        'literature-search',
        'pdf-analyzer',
        'citation-graph',
        'semantic-search'
      ],
      'writing-agent': [
        'paper-structure',
        'academic-polisher',
        'conversational-editor',
        'creative-expander',
        'writing-quality'
      ],
      'analysis-agent': [
        'data-analysis',
        'data-analyzer',
        'experiment-runner'
      ],
      'review-agent': [
        'peer-review',
        'writing-quality',
        'plagiarism-checker'
      ],
      'submission-agent': [
        'journal-submission',
        'journal-matchmaker',
        'citation-manager'
      ]
    };
  }

  /**
   * Get Skills for an Agent
   */
  getSkillsForAgent(agentName: string): SkillMetadata[] {
    const mapping = this.generateAgentSkillMapping();
    const skillNames = mapping[agentName] || [];

    return skillNames
      .map(name => this.getSkill(name))
      .filter((s): s is SkillMetadata => s !== undefined);
  }
}

/**
 * Factory function
 */
export function createSkillIntegrationService(
  skillBasePath?: string
): SkillIntegrationService {
  return new SkillIntegrationService(skillBasePath);
}
