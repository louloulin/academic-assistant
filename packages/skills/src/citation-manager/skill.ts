// Citation Manager Skill
import type { ISkill, Task, SkillConfig } from '@assistant/core';
import { validateInput } from '@assistant/utils';
import { z } from 'zod';
import { log } from '@assistant/utils';
import { SkillType, TaskStatus } from '@assistant/core';

// Citation types
export enum CitationStyle {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  IEEE = 'ieee',
  HARVARD = 'harvard'
}

const CitationInputSchema = z.object({
  papers: z.array(z.object({
    id: z.string(),
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number(),
    journal: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().optional()
  })),
  style: z.nativeEnum(CitationStyle).default(CitationStyle.APA)
});

export type CitationInput = z.infer<typeof CitationInputSchema>;

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
}

export interface FormattedCitation {
  inText: string;
  bibliography: string;
}

const skillConfig: SkillConfig = {
  id: 'citation-manager',
  type: SkillType.CITATION_MANAGER,
  name: 'Citation Manager',
  description: 'Format and validate academic citations in multiple styles',
  version: '1.0.0',
  enabled: true
};

export class CitationManagerSkill implements ISkill {
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
      await validateInput(CitationInputSchema, input);
      return true;
    } catch {
      return false;
    }
  }

  async execute<T, U>(task: Task<T, U>): Promise<Task<T, U>> {
    const validatedInput = await validateInput(CitationInputSchema, task.input as any);

    log.info(`Formatting ${validatedInput.papers.length} citations in ${validatedInput.style} style`);

    const formattedCitations: FormattedCitation[] = [];

    for (const paper of validatedInput.papers) {
      const citation = this.formatCitation(paper, validatedInput.style);
      formattedCitations.push(citation);
    }

    // Generate bibliography list
    const bibliography = formattedCitations.map(c => c.bibliography).join('\n');

    log.info(`Formatted ${formattedCitations.length} citations`);

    return {
      ...task,
      output: {
        citations: formattedCitations,
        bibliography,
        style: validatedInput.style
      } as U,
      status: TaskStatus.COMPLETED,
      updatedAt: new Date()
    };
  }

  private formatCitation(paper: Paper, style: CitationStyle): FormattedCitation {
    switch (style) {
      case CitationStyle.APA:
        return this.formatAPA(paper);
      case CitationStyle.MLA:
        return this.formatMLA(paper);
      case CitationStyle.CHICAGO:
        return this.formatChicago(paper);
      case CitationStyle.IEEE:
        return this.formatIEEE(paper);
      case CitationStyle.HARVARD:
        return this.formatHarvard(paper);
      default:
        return this.formatAPA(paper);
    }
  }

  private formatAPA(paper: Paper): FormattedCitation {
    const authors = this.formatAuthorsAPA(paper.authors);
    const year = `(${paper.year})`;

    let inText = '';
    if (paper.authors.length === 1) {
      inText = `(${paper.authors[0].split(' ').pop()}, ${paper.year})`;
    } else if (paper.authors.length === 2) {
      inText = `(${paper.authors[0].split(' ').pop()} & ${paper.authors[1].split(' ').pop()}, ${paper.year})`;
    } else {
      inText = `(${paper.authors[0].split(' ').pop()} et al., ${paper.year})`;
    }

    let bibliography = `${authors} ${year}. ${paper.title}`;
    if (paper.journal) {
      bibliography += `. ${paper.journal}`;
      if (paper.volume) bibliography += `, ${paper.volume}`;
      if (paper.issue) bibliography += `(${paper.issue})`;
      if (paper.pages) bibliography += `, ${paper.pages}`;
    }
    if (paper.doi) {
      bibliography += `. https://doi.org/${paper.doi}`;
    } else if (paper.url) {
      bibliography += `. ${paper.url}`;
    }
    bibliography += '.';

    return { inText, bibliography };
  }

  private formatMLA(paper: Paper): FormattedCitation {
    const authors = this.formatAuthorsMLA(paper.authors);
    const inText = `(${paper.authors[0].split(' ').pop()} ${paper.year})`;

    let bibliography = `${authors}. "${paper.title}."`;
    if (paper.journal) {
      bibliography += ` ${paper.journal}`;
      if (paper.volume) bibliography += `, vol. ${paper.volume}`;
      if (paper.issue) bibliography += `, no. ${paper.issue}`;
      if (paper.year) bibliography += `, ${paper.year}`;
      if (paper.pages) bibliography += `, pp. ${paper.pages}`;
    }
    bibliography += '.';

    return { inText, bibliography };
  }

  private formatChicago(paper: Paper): FormattedCitation {
    const authors = this.formatAuthorsChicago(paper.authors);
    const inText = `(${paper.authors[0].split(' ').pop()} ${paper.year})`;

    let bibliography = `${authors}. "${paper.title}."`;
    if (paper.journal) {
      bibliography += ` ${paper.journal}`;
      if (paper.volume) bibliography += ` ${paper.volume}`;
      if (paper.issue) bibliography += `, no. ${paper.issue}`;
      if (paper.year) bibliography += ` (${paper.year})`;
      if (paper.pages) bibliography += `: ${paper.pages}`;
    }
    bibliography += '.';

    return { inText, bibliography };
  }

  private formatIEEE(paper: Paper): FormattedCitation {
    const authorAbbr = paper.authors[0].split(' ').pop();
    const inText = `[${authorAbbr}, ${paper.year}]`;

    let bibliography = '';
    if (paper.authors.length <= 3) {
      bibliography += paper.authors.join(', ');
    } else {
      bibliography += `${paper.authors[0]} et al.`;
    }
    bibliography += `, "${paper.title},"`;
    if (paper.journal) {
      bibliography += ` ${paper.journal}`;
      if (paper.volume) bibliography += `, vol. ${paper.volume}`;
      if (paper.issue) bibliography += `, no. ${paper.issue}`;
      if (paper.pages) bibliography += `, pp. ${paper.pages}`;
      if (paper.year) bibliography += `, ${paper.year}`;
    }
    bibliography += '.';
    if (paper.doi) {
      bibliography += ` doi: ${paper.doi}`;
    }

    return { inText, bibliography };
  }

  private formatHarvard(paper: Paper): FormattedCitation {
    const authorAbbr = paper.authors[0].split(' ').pop();
    const inText = `(${authorAbbr} ${paper.year})`;

    let bibliography = `${paper.authors.join(', ')} (${paper.year}) '${paper.title}',`;
    if (paper.journal) {
      bibliography += ` ${paper.journal}`;
      if (paper.volume) bibliography += `, ${paper.volume}`;
      if (paper.issue) bibliography += `(${paper.issue})`;
      if (paper.pages) bibliography += `, pp. ${paper.pages}`;
    }
    bibliography += '.';

    return { inText, bibliography };
  }

  private formatAuthorsAPA(authors: string[]): string {
    if (authors.length === 0) return '';

    if (authors.length === 1) {
      const parts = authors[0].split(' ');
      const surname = parts.pop();
      const initials = parts.map(n => n[0]).join('. ');
      return `${surname}, ${initials}`;
    }

    const formatted = authors.map(author => {
      const parts = author.split(' ');
      const surname = parts.pop();
      const initials = parts.map(n => `${n[0]}.`).join('');
      return `${surname}, ${initials}`;
    });

    if (formatted.length <= 7) {
      return formatted.join(', & ').replace(', &', ', &');
    }

    return `${formatted.slice(0, 6).join(', ')} ... ${formatted[formatted.length - 1]}`;
  }

  private formatAuthorsMLA(authors: string[]): string {
    if (authors.length === 0) return '';

    if (authors.length === 1) {
      const parts = authors[0].split(' ');
      const surname = parts.pop();
      return `${surname}, ${parts.join(' ')}`;
    }

    const first = authors[0];
    const parts = first.split(' ');
    const surname = parts.pop();
    const firstFormatted = `${surname}, ${parts.join(' ')}`;

    if (authors.length === 2) {
      return `${firstFormatted}, and ${authors[1]}`;
    }

    return `${firstFormatted}, et al.`;
  }

  private formatAuthorsChicago(authors: string[]): string {
    if (authors.length === 0) return '';

    if (authors.length === 1) {
      return authors[0];
    }

    if (authors.length === 2) {
      return `${authors[0]} and ${authors[1]}`;
    }

    if (authors.length <= 10) {
      return authors.join(', ');
    }

    return `${authors.slice(0, 7).join(', ')}, et al.`;
  }
}
