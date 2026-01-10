// Paper Structure Skill
import type { ISkill, Task, SkillConfig } from '@assistant/core';
import { validateInput } from '@assistant/utils';
import { z } from 'zod';
import { log } from '@assistant/utils';
import { SkillType, TaskStatus } from '@assistant/core';

// Paper structure types
export enum PaperType {
  RESEARCH_PAPER = 'research-paper',
  REVIEW_PAPER = 'review-paper',
  CONFERENCE_PAPER = 'conference-paper',
  THESIS = 'thesis',
  SHORT_COMMUNICATION = 'short-communication'
}

const StructureInputSchema = z.object({
  title: z.string().min(1),
  paperType: z.nativeEnum(PaperType).default(PaperType.RESEARCH_PAPER),
  researchArea: z.string().optional(),
  keywords: z.array(z.string()).optional()
});

export type StructureInput = z.infer<typeof StructureInputSchema>;

export interface PaperStructure {
  title: string;
  abstract: string;
  sections: PaperSection[];
  estimatedWordCounts: Record<string, number>;
}

export interface PaperSection {
  title: string;
  order: number;
  description: string;
  subsections?: string[];
  tips: string[];
}

const skillConfig: SkillConfig = {
  id: 'paper-structure',
  type: SkillType.PAPER_STRUCTURE,
  name: 'Paper Structure',
  description: 'Generate paper structure following IMRaD format',
  version: '1.0.0',
  enabled: true
};

export class PaperStructureSkill implements ISkill {
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
      await validateInput(StructureInputSchema, input);
      return true;
    } catch {
      return false;
    }
  }

  async execute<T, U>(task: Task<T, U>): Promise<Task<T, U>> {
    const validatedInput = await validateInput(StructureInputSchema, task.input as any);

    log.info(`Generating ${validatedInput.paperType} structure for: ${validatedInput.title}`);

    const structure = this.generateStructure(validatedInput);

    log.info(`Generated structure with ${structure.sections.length} sections`);

    return {
      ...task,
      output: structure as U,
      status: TaskStatus.COMPLETED,
      updatedAt: new Date()
    };
  }

  private generateStructure(input: StructureInput): PaperStructure {
    const baseSections = this.getIMRaDSections();

    return {
      title: input.title,
      abstract: 'Provide a concise summary of the entire paper (150-250 words)',
      sections: baseSections,
      estimatedWordCounts: this.getWordCounts(input.paperType)
    };
  }

  private getIMRaDSections(): PaperSection[] {
    return [
      {
        title: 'Introduction',
        order: 1,
        description: 'Establish the research context and state the problem',
        subsections: [
          'Background and context',
          'Problem statement',
          'Research questions/objectives',
          'Significance of the study',
          'Organization of the paper'
        ],
        tips: [
          'Start broad and narrow down to specific research gap',
          'Clearly state the research problem or question',
          'Explain why this research is important',
          'Briefly outline the paper structure'
        ]
      },
      {
        title: 'Literature Review',
        order: 2,
        description: 'Review existing research and identify gaps',
        subsections: [
          'Theoretical framework',
          'Previous studies',
          'Methodological approaches',
          'Research gaps'
        ],
        tips: [
          'Organize by themes or chronology',
          'Critically analyze rather than just summarize',
          'Identify the gap your research addresses',
          'Connect literature to your research questions'
        ]
      },
      {
        title: 'Methods',
        order: 3,
        description: 'Describe the research methodology in detail',
        subsections: [
          'Research design',
          'Data collection',
          'Participants or materials',
          'Procedures',
          'Data analysis',
          'Ethical considerations'
        ],
        tips: [
          'Provide enough detail for replication',
          'Justify methodological choices',
          'Describe sample size and characteristics',
          'Explain statistical analysis methods',
          'Address ethical approval if applicable'
        ]
      },
      {
        title: 'Results',
        order: 4,
        description: 'Present findings objectively',
        subsections: [
          'Descriptive statistics',
          'Main findings',
          'Additional analyses',
          'Tables and figures'
        ],
        tips: [
          'Present data objectively without interpretation',
          'Use tables and figures effectively',
          'Report statistical significance',
          'Organize from most to least important',
          'Save interpretation for Discussion section'
        ]
      },
      {
        title: 'Discussion',
        order: 5,
        description: 'Interpret results and relate to existing knowledge',
        subsections: [
          'Summary of main findings',
          'Interpretation and implications',
          'Comparison with previous studies',
          'Limitations',
          'Future research directions',
          'Conclusions'
        ],
        tips: [
          'Start with summary of key findings',
          'Interpret results in context of literature',
          'Acknowledge limitations honestly',
          'Suggest practical and theoretical implications',
          'Propose directions for future research'
        ]
      },
      {
        title: 'References',
        order: 6,
        description: 'List all cited sources',
        subsections: [
          'Format according to journal guidelines',
          'Ensure all in-text citations are included',
          'Check for accuracy and completeness'
        ],
        tips: [
          'Use citation management software',
          'Follow required citation style (APA, MLA, etc.)',
          'Verify DOIs and URLs',
          'Check against in-text citations'
        ]
      }
    ];
  }

  private getWordCounts(paperType: PaperType): Record<string, number> {
    switch (paperType) {
      case PaperType.RESEARCH_PAPER:
        return {
          abstract: 250,
          introduction: 1000,
          literatureReview: 1500,
          methods: 1000,
          results: 1200,
          discussion: 1500,
          total: 6500
        };

      case PaperType.REVIEW_PAPER:
        return {
          abstract: 250,
          introduction: 800,
          literatureReview: 3000,
          methods: 500,
          results: 1500,
          discussion: 2000,
          total: 8500
        };

      case PaperType.CONFERENCE_PAPER:
        return {
          abstract: 200,
          introduction: 600,
          literatureReview: 800,
          methods: 600,
          results: 800,
          discussion: 600,
          total: 4000
        };

      case PaperType.THESIS:
        return {
          abstract: 500,
          introduction: 3000,
          literatureReview: 5000,
          methods: 2000,
          results: 3000,
          discussion: 3000,
          total: 17000
        };

      case PaperType.SHORT_COMMUNICATION:
        return {
          abstract: 150,
          introduction: 500,
          methods: 500,
          results: 800,
          discussion: 500,
          total: 2500
        };

      default:
        return {
          abstract: 250,
          introduction: 1000,
          literatureReview: 1500,
          methods: 1000,
          results: 1200,
          discussion: 1500,
          total: 6500
        };
    }
  }
}
