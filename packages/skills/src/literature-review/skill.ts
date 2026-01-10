// Literature Review Skill
import type { ISkill, Task, SkillConfig } from '@assistant/core';
import { validateInput } from '@assistant/utils';
import { z } from 'zod';
import { log } from '@assistant/utils';
import { SkillType, TaskStatus } from '@assistant/core';

const ReviewInputSchema = z.object({
  papers: z.array(z.object({
    id: z.string(),
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number(),
    abstract: z.string(),
    keywords: z.array(z.string()).optional(),
    journal: z.string().optional(),
    citationCount: z.number().optional()
  })),
  researchQuestion: z.string().min(1),
  focusAreas: z.array(z.string()).optional()
});

export type ReviewInput = z.infer<typeof ReviewInputSchema>;

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  keywords?: string[];
  journal?: string;
  citationCount?: number;
}

export interface LiteratureReview {
  summary: ReviewSummary;
  themes: Theme[];
  methodology: MethodologyAnalysis;
  gaps: ResearchGap[];
  recommendations: string[];
  bibliography: Reference[];
}

export interface ReviewSummary {
  totalPapers: number;
  yearRange: { min: number; max: number };
  topJournals: { journal: string; count: number }[];
  averageCitations: number;
}

export interface Theme {
  name: string;
  description: string;
  papers: string[];
  keyFindings: string[];
}

export interface MethodologyAnalysis {
  qualitative: number;
  quantitative: number;
  mixed: number;
  review: number;
  commonMethods: { method: string; count: number }[];
}

export interface ResearchGap {
  description: string;
  papers: string[];
  opportunity: string;
}

export interface Reference {
  id: string;
  citation: string;
}

const skillConfig: SkillConfig = {
  id: 'literature-review',
  type: SkillType.LITERATURE_REVIEW,
  name: 'Literature Review',
  description: 'Analyze and synthesize academic papers into literature review',
  version: '1.0.0',
  enabled: true
};

export class LiteratureReviewSkill implements ISkill {
  readonly id = skillConfig.id;
  readonly name = skillConfig.name;
  readonly description = skillConfig.description;
  readonly version = skillConfig.version;
  readonly config = skillConfig;

  canHandle<T>(task: Task<T>): boolean {
    return task.assignedAgent === undefined ||
      (task.requiredSkills !== undefined && task.requiredSkills.includes(this.id));
  }

  async validate<T>(input: T): Promise<boolean> {
    try {
      await validateInput(ReviewInputSchema, input);
      return true;
    } catch {
      return false;
    }
  }

  async execute<T, U>(task: Task<T, U>): Promise<Task<T, U>> {
    const validatedInput = await validateInput(ReviewInputSchema, task.input as any);

    log.info(`Analyzing ${validatedInput.papers.length} papers for literature review`);

    const review = await this.analyzePapers(validatedInput);

    log.info(`Literature review complete - ${review.themes.length} themes identified`);

    return {
      ...task,
      output: review as U,
      status: TaskStatus.COMPLETED,
      updatedAt: new Date()
    };
  }

  private async analyzePapers(input: ReviewInput): Promise<LiteratureReview> {
    const { papers, researchQuestion, focusAreas } = input;

    // Generate summary
    const summary = this.generateSummary(papers);

    // Identify themes
    const themes = this.identifyThemes(papers, researchQuestion, focusAreas);

    // Analyze methodologies
    const methodology = this.analyzeMethodology(papers);

    // Identify research gaps
    const gaps = this.identifyGaps(papers, themes);

    // Generate recommendations
    const recommendations = this.generateRecommendations(themes, gaps);

    // Create bibliography
    const bibliography = this.createBibliography(papers);

    return {
      summary,
      themes,
      methodology,
      gaps,
      recommendations,
      bibliography
    };
  }

  private generateSummary(papers: Paper[]): ReviewSummary {
    const years = papers.map(p => p.year);
    const journalCounts = new Map<string, number>();

    for (const paper of papers) {
      if (paper.journal) {
        journalCounts.set(paper.journal, (journalCounts.get(paper.journal) || 0) + 1);
      }
    }

    const topJournals = Array.from(journalCounts.entries())
      .map(([journal, count]) => ({ journal, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const citations = papers.map(p => p.citationCount || 0);
    const avgCitations = citations.length > 0
      ? citations.reduce((a, b) => a + b, 0) / citations.length
      : 0;

    return {
      totalPapers: papers.length,
      yearRange: {
        min: Math.min(...years),
        max: Math.max(...years)
      },
      topJournals,
      averageCitations: Math.round(avgCitations)
    };
  }

  private identifyThemes(papers: Paper[], researchQuestion: string, focusAreas?: string[]): Theme[] {
    const themes: Theme[] = [];

    // Extract keywords from all papers
    const allKeywords = new Map<string, Set<string>>();

    for (const paper of papers) {
      const keywords = paper.keywords || this.extractKeywords(paper);
      for (const keyword of keywords) {
        if (!allKeywords.has(keyword)) {
          allKeywords.set(keyword, new Set());
        }
        allKeywords.get(keyword)!.add(paper.id);
      }
    }

    // Group into themes based on keyword co-occurrence
    const keywordEntries = Array.from(allKeywords.entries())
      .filter(([_, ids]) => ids.size >= 2) // Only keywords appearing in 2+ papers
      .sort((a, b) => b[1].size - a[1].size);

    // Create top themes
    const topKeywords = keywordEntries.slice(0, 5);

    for (const [keyword, paperIds] of topKeywords) {
      const themePapers = papers.filter(p => paperIds.has(p.id));
      const keyFindings = themePapers.map(p => p.abstract.substring(0, 200) + '...');

      themes.push({
        name: this.capitalizeFirst(keyword),
        description: `Research focusing on ${keyword} and related concepts`,
        papers: Array.from(paperIds),
        keyFindings: keyFindings.slice(0, 3) // Top 3 findings
      });
    }

    // Add theme for research question focus
    if (focusAreas && focusAreas.length > 0) {
      for (const area of focusAreas) {
        const relevantPapers = papers.filter(p =>
          p.title.toLowerCase().includes(area.toLowerCase()) ||
          p.abstract.toLowerCase().includes(area.toLowerCase())
        );

        if (relevantPapers.length >= 2) {
          themes.push({
            name: this.capitalizeFirst(area),
            description: `Research related to ${area}`,
            papers: relevantPapers.map(p => p.id),
            keyFindings: relevantPapers.map(p => p.abstract.substring(0, 200) + '...')
          });
        }
      }
    }

    return themes.slice(0, 6); // Return top 6 themes
  }

  private analyzeMethodology(papers: Paper[]): MethodologyAnalysis {
    let qualitative = 0;
    let quantitative = 0;
    let mixed = 0;
    let review = 0;

    const methodCounts = new Map<string, number>();

    for (const paper of papers) {
      const abstract = paper.abstract.toLowerCase();

      // Simple heuristic-based classification
      const isQualitative = /\b(qualitative|interview|case study|ethnographic|phenomenological|grounded theory)\b/.test(abstract);
      const isQuantitative = /\b(quantitative|experimental|statistical|survey|regression|hypothesis|correlation)\b/.test(abstract);
      const isReview = /\b(systematic review|literature review|meta-analysis|review paper)\b/.test(abstract);

      if (isReview) {
        review++;
      } else if (isQualitative && isQuantitative) {
        mixed++;
      } else if (isQualitative) {
        qualitative++;
      } else if (isQuantitative) {
        quantitative++;
      } else {
        mixed++; // Default to mixed if unclear
      }

      // Extract method mentions
      const methods = abstract.match(/\b(interview|survey|experiment|case study|questionnaire|observation|simulation)\b/g);
      if (methods) {
        for (const method of methods) {
          methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
        }
      }
    }

    const commonMethods = Array.from(methodCounts.entries())
      .map(([method, count]) => ({ method: this.capitalizeFirst(method), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      qualitative,
      quantitative,
      mixed,
      review,
      commonMethods
    };
  }

  private identifyGaps(papers: Paper[], themes: Theme[]): ResearchGap[] {
    const gaps: ResearchGap[] = [];

    // Gap 1: Temporal gaps
    const recentPapers = papers.filter(p => p.year >= 2022);
    if (recentPapers.length < papers.length * 0.3) {
      gaps.push({
        description: 'Limited recent research in this area',
        papers: [],
        opportunity: 'Conduct up-to-date studies to address current challenges'
      });
    }

    // Gap 2: Geographic gaps
    const hasGeographicMention = papers.some(p =>
      /\b(multi-country|cross-cultural|international|global|comparative)\b/i.test(p.abstract)
    );
    if (!hasGeographicMention) {
      gaps.push({
        description: 'Lack of cross-cultural or comparative studies',
        papers: papers.filter(p => p.year < 2020).map(p => p.id),
        opportunity: 'Extend research to diverse geographic and cultural contexts'
      });
    }

    // Gap 3: Methodological gaps
    const themesWithPapers = themes.flatMap(t => t.papers);
    const uniquePapersInThemes = new Set(themesWithPapers);
    if (uniquePapersInThemes.size < papers.length) {
      gaps.push({
        description: 'Some areas remain underexplored',
        papers: papers.filter(p => !uniquePapersInThemes.has(p.id)).map(p => p.id),
        opportunity: 'Investigate emerging themes and overlooked aspects'
      });
    }

    // Gap 4: Practical application gaps
    const hasPracticalApplication = papers.some(p =>
      /\b(practical application|implementation|real-world|industry|practice)\b/i.test(p.abstract)
    );
    if (!hasPracticalApplication) {
      gaps.push({
        description: 'Limited focus on practical applications',
        papers: [],
        opportunity: 'Bridge the gap between theory and practice'
      });
    }

    return gaps.slice(0, 4);
  }

  private generateRecommendations(themes: Theme[], gaps: ResearchGap[]): string[] {
    const recommendations: string[] = [];

    // Theme-based recommendations
    if (themes.length > 0) {
      const topTheme = themes[0];
      recommendations.push(
        `Focus on "${topTheme.name}" as it represents the most established area with ${topTheme.papers.length} related studies`
      );
    }

    // Gap-based recommendations
    for (const gap of gaps) {
      recommendations.push(gap.opportunity);
    }

    // General recommendations
    recommendations.push(
      'Consider longitudinal studies to establish causal relationships',
      'Integrate interdisciplinary perspectives for novel insights',
      'Develop and validate new measurement instruments',
      'Increase sample sizes and demographic diversity'
    );

    return recommendations.slice(0, 6);
  }

  private createBibliography(papers: Paper[]): Reference[] {
    return papers.map(paper => ({
      id: paper.id,
      citation: this.formatAPA(paper)
    }));
  }

  private formatAPA(paper: Paper): string {
    const authors = paper.authors.length <= 3
      ? paper.authors.join(', ')
      : `${paper.authors[0]} et al.`;

    let citation = `${authors} (${paper.year}). ${paper.title}.`;
    if (paper.journal) {
      citation += ` ${paper.journal}.`;
    }

    return citation;
  }

  private extractKeywords(paper: Paper): string[] {
    const text = `${paper.title} ${paper.abstract}`.toLowerCase();
    const words = text.match(/\b[a-z]{4,}\b/g) || [];

    // Count word frequency
    const wordFreq = new Map<string, number>();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Filter common words and return top keywords
    const commonWords = new Set([
      'that', 'this', 'with', 'from', 'have', 'been', 'were', 'they', 'their',
      'study', 'research', 'paper', 'analysis', 'results', 'found', 'between'
    ]);

    return Array.from(wordFreq.entries())
      .filter(([word, _]) => !commonWords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, _]) => word);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
