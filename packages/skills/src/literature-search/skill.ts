// Literature Search Skill
import type { ISkill, Task, SkillConfig } from '@assistant/core';
import type { IMCPClient } from '@assistant/mcp-client';
import { validateInput } from '@assistant/utils';
import { z } from 'zod';
import { log } from '@assistant/utils';

const SearchInputSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().min(1).max(100).default(10),
  sources: z.array(z.enum(['arxiv', 'semantic-scholar', 'pubmed'])).default([
    'arxiv',
    'semantic-scholar'
  ]),
  yearFrom: z.number().optional(),
  yearTo: z.number().optional()
});

export type SearchInput = z.infer<typeof SearchInputSchema>;

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  venue?: string;
  url: string;
  pdfUrl?: string;
  citationCount?: number;
}

const skillConfig: SkillConfig = {
  id: 'literature-search',
  type: 'literature-search' as const,
  name: 'Literature Search',
  description: 'Search academic papers from multiple sources',
  version: '1.0.0',
  enabled: true
};

export class LiteratureSearchSkill implements ISkill {
  readonly id = skillConfig.id;
  readonly name = skillConfig.name;
  readonly description = skillConfig.description;
  readonly version = skillConfig.version;
  readonly config = skillConfig;

  constructor(private mcpClient: IMCPClient) {}

  canHandle<T>(task: Task<T>): boolean {
    return task.assignedAgent === undefined || task.requiredSkills?.includes(this.id);
  }

  async validate<T>(input: T): Promise<boolean> {
    try {
      await validateInput(SearchInputSchema, input);
      return true;
    } catch {
      return false;
    }
  }

  async execute<T extends SearchInput, U = Paper[]>(task: Task<T, U>): Promise<Task<T, U>> {
    // Validate input
    const validatedInput = await validateInput(SearchInputSchema, task.input);

    log.info(`Searching papers: ${validatedInput.query}`);

    const results: Paper[] = [];

    // Search each source
    for (const source of validatedInput.sources) {
      try {
        const response = await this.mcpClient.call<Paper[]>({
          server: 'literature-search',
          method: `search_${source}`,
          params: validatedInput
        });

        if (response.success && response.data) {
          results.push(...response.data);
        }
      } catch (error) {
        log.error(`Search failed for ${source}: ${error}`);
      }
    }

    // Deduplicate and sort
    const uniquePapers = this.deduplicatePapers(results);
    const sortedPapers = this.sortByRelevance(uniquePapers, validatedInput.query);
    const finalResults = sortedPapers.slice(0, validatedInput.maxResults);

    log.info(`Found ${finalResults.length} papers`);

    return {
      ...task,
      output: finalResults as U,
      status: 'completed',
      updatedAt: new Date()
    };
  }

  private deduplicatePapers(papers: Paper[]): Paper[] {
    const seen = new Set<string>();
    return papers.filter((paper) => {
      const normalizedTitle = paper.title.toLowerCase().trim();
      if (seen.has(normalizedTitle)) {
        return false;
      }
      seen.add(normalizedTitle);
      return true;
    });
  }

  private sortByRelevance(papers: Paper[], query: string): Paper[] {
    const queryTerms = query.toLowerCase().split(/\s+/);

    return papers.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, queryTerms);
      const scoreB = this.calculateRelevanceScore(b, queryTerms);
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(paper: Paper, queryTerms: string[]): number {
    const title = paper.title.toLowerCase();
    const abstract = paper.abstract.toLowerCase();

    let score = 0;

    for (const term of queryTerms) {
      if (title.includes(term)) score += 10;
      if (abstract.includes(term)) score += 1;
    }

    if (paper.citationCount) {
      score += Math.log10(paper.citationCount + 1);
    }

    return score;
  }
}
