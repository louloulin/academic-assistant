// Journal Submission Skill
import type { ISkill, Task, SkillConfig } from '@assistant/core';
import { validateInput } from '@assistant/utils';
import { z } from 'zod';
import { log } from '@assistant/utils';
import { SkillType, TaskStatus } from '@assistant/core';

const SubmissionInputSchema = z.object({
  title: z.string().min(1),
  abstract: z.string().min(50),
  keywords: z.array(z.string()).min(3),
  researchArea: z.string().min(1),
  paperType: z.enum([
    'research-article',
    'review',
    'short-communication',
    'case-report',
    'letter'
  ]).default('research-article'),
  targetAudience: z.array(z.string()).optional(),
  wordCount: z.number().optional()
});

export type SubmissionInput = z.infer<typeof SubmissionInputSchema>;

export interface SubmissionPlan {
  recommendations: JournalRecommendation[];
  coverLetter: CoverLetter;
  checklists: SubmissionChecklist;
  timeline: SubmissionTimeline;
  tips: SubmissionTip[];
}

export interface JournalRecommendation {
  name: string;
  publisher: string;
  matchScore: number;
  impactFactor?: number;
  acceptanceRate?: number;
  reviewTime: string;
  openAccess: boolean;
  reason: string;
  url?: string;
}

export interface CoverLetter {
  salutation: string;
  opening: string;
  highlights: string[];
  significance: string;
  exclusivity: string;
  closing: string;
  template: string;
}

export interface SubmissionChecklist {
  beforeSubmission: ChecklistItem[];
  manuscriptRequirements: ChecklistItem[];
  formatting: ChecklistItem[];
  documents: ChecklistItem[];
}

export interface ChecklistItem {
  item: string;
  completed: boolean;
  notes?: string;
}

export interface SubmissionTimeline {
  preparation: number;
  submission: number;
  review: number;
  revision: number;
  publication: number;
  total: number;
}

export interface SubmissionTip {
  category: string;
  tip: string;
  priority: 'high' | 'medium' | 'low';
}

// Sample journal database (in production, this would come from an API)
const journalDatabase = [
  {
    name: 'Nature',
    publisher: 'Nature Portfolio',
    impactFactor: 69.5,
    acceptanceRate: 8,
    reviewTime: '3-6 months',
    openAccess: true,
    areas: ['multidisciplinary', 'science', 'nature', 'research']
  },
  {
    name: 'Science',
    publisher: 'AAAS',
    impactFactor: 56.9,
    acceptanceRate: 7,
    reviewTime: '3-6 months',
    openAccess: false,
    areas: ['multidisciplinary', 'science', 'research']
  },
  {
    name: 'PLOS ONE',
    publisher: 'Public Library of Science',
    impactFactor: 3.4,
    acceptanceRate: 60,
    reviewTime: '1-2 months',
    openAccess: true,
    areas: ['multidisciplinary', 'open-access', 'research']
  },
  {
    name: 'Scientific Reports',
    publisher: 'Nature Portfolio',
    impactFactor: 4.6,
    acceptanceRate: 50,
    reviewTime: '2-4 months',
    openAccess: true,
    areas: ['multidisciplinary', 'nature', 'research']
  },
  {
    name: 'IEEE Access',
    publisher: 'IEEE',
    impactFactor: 3.9,
    acceptanceRate: 30,
    reviewTime: '1-2 months',
    openAccess: true,
    areas: ['engineering', 'technology', 'computer-science', 'research']
  },
  {
    name: 'Springer Nature',
    publisher: 'Springer',
    impactFactor: null,
    acceptanceRate: 25,
    reviewTime: '2-4 months',
    openAccess: true,
    areas: ['multidisciplinary', 'research', 'science']
  }
];

const skillConfig: SkillConfig = {
  id: 'journal-submission',
  type: SkillType.JOURNAL_SUBMISSION,
  name: 'Journal Submission',
  description: 'Provide journal recommendations and submission guidance',
  version: '1.0.0',
  enabled: true
};

export class JournalSubmissionSkill implements ISkill {
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
      await validateInput(SubmissionInputSchema, input);
      return true;
    } catch {
      return false;
    }
  }

  async execute<T, U>(task: Task<T, U>): Promise<Task<T, U>> {
    const validatedInput = await validateInput(SubmissionInputSchema, task.input as any);

    log.info(`Generating submission plan for: ${validatedInput.title}`);

    const plan = await this.generateSubmissionPlan(validatedInput);

    log.info(`Submission plan ready - ${plan.recommendations.length} journals recommended`);

    return {
      ...task,
      output: plan as U,
      status: TaskStatus.COMPLETED,
      updatedAt: new Date()
    };
  }

  private async generateSubmissionPlan(input: SubmissionInput): Promise<SubmissionPlan> {
    const { title, abstract, keywords, researchArea, paperType, targetAudience, wordCount } = input;

    // Generate journal recommendations
    const recommendations = this.recommendJournals(researchArea, paperType, impactEstimate(abstract));

    // Generate cover letter
    const coverLetter = this.generateCoverLetter(title, abstract, keywords);

    // Generate checklists
    const checklists = this.generateChecklists(paperType);

    // Generate timeline
    const timeline = this.generateTimeline(paperType);

    // Generate tips
    const tips = this.generateTips();

    return {
      recommendations,
      coverLetter,
      checklists,
      timeline,
      tips
    };
  }

  private recommendJournals(researchArea: string, paperType: string, impactLevel: 'high' | 'medium' | 'low'): JournalRecommendation[] {
    const recommendations: JournalRecommendation[] = [];

    const areaLower = researchArea.toLowerCase();

    for (const journal of journalDatabase) {
      // Calculate match score based on research area and impact level
      let matchScore = 50; // Base score

      // Check area match
      const areaMatch = journal.areas.some(area =>
        areaLower.includes(area) || area.includes(areaLower)
      );
      if (areaMatch) {
        matchScore += 30;
      }

      // Adjust based on impact factor alignment
      if (journal.impactFactor) {
        if (impactLevel === 'high' && journal.impactFactor > 10) {
          matchScore += 20;
        } else if (impactLevel === 'medium' && journal.impactFactor >= 3 && journal.impactFactor <= 10) {
          matchScore += 20;
        } else if (impactLevel === 'low' && journal.impactFactor < 5) {
          matchScore += 20;
        }
      }

      // Prefer open access for faster publication
      if (journal.openAccess) {
        matchScore += 10;
      }

      // Adjust for acceptance rate (higher acceptance = better for new authors)
      if (journal.acceptanceRate && journal.acceptanceRate > 30) {
        matchScore += 10;
      }

      // Generate reason
      const reasons: string[] = [];
      if (areaMatch) reasons.push('subject area match');
      if (journal.openAccess) reasons.push('open access option');
      if (journal.acceptanceRate && journal.acceptanceRate > 30) {
        reasons.push('reasonable acceptance rate');
      }
      if (journal.reviewTime.includes('1-2')) {
        reasons.push('fast review process');
      }

      recommendations.push({
        name: journal.name,
        publisher: journal.publisher,
        matchScore: Math.min(100, matchScore),
        impactFactor: journal.impactFactor ?? undefined,
        acceptanceRate: journal.acceptanceRate,
        reviewTime: journal.reviewTime,
        openAccess: journal.openAccess,
        reason: reasons.join(', '),
        url: `https://www.${journal.name.toLowerCase().replace(/\s+/g, '-')}.com`
      });
    }

    // Sort by match score and return top 5
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  private generateCoverLetter(title: string, abstract: string, keywords: string[]): CoverLetter {
    const highlights = [
      'This study addresses a significant gap in the current literature',
      'Our findings provide novel insights into this research area',
      'The methodology combines robust quantitative analysis with rigorous validation',
      'Results have practical implications for both researchers and practitioners'
    ];

    return {
      salutation: 'Dear Editor,',
      opening: `We are pleased to submit our manuscript entitled "${title}" for consideration for publication in your journal.`,
      highlights,
      significance: 'This work makes a significant contribution to the field by addressing a critical research question that has important theoretical and practical implications. Our findings advance the current understanding and provide a foundation for future research.',
      exclusivity: 'We confirm that this work has not been published elsewhere and is not under consideration by another journal. All authors have approved the manuscript and agree with its submission.',
      closing: 'Thank you for your time and consideration. We look forward to hearing from you.',
      template: `${this.coverLetterTemplate(title, abstract, keywords)}`
    };
  }

  private coverLetterTemplate(title: string, abstract: string, keywords: string[]): string {
    return `Dear Editor,

We are pleased to submit our manuscript entitled "${title}" for consideration for publication in your journal.

[Highlight 1 - main finding]
[Highlight 2 - methodology strength]
[Highlight 3 - practical implications]
[Highlight 4 - novelty/innovation]

This study addresses an important gap in the literature by investigating key aspects of [research area]. Our findings contribute significantly to the field by [main contribution].

The methodology employed in this study [method description, e.g., combines rigorous quantitative analysis with robust validation procedures]. We believe this approach provides novel insights that will be valuable to researchers and practitioners alike.

The significance of this work lies in [theoretical contribution] and [practical implications]. These findings have the potential to influence both future research directions and practical applications in the field.

This manuscript has not been published elsewhere and is not under consideration by another journal. All authors have approved the manuscript and agree with its submission. We confirm that we have complied with ethical standards in the treatment of research participants.

Thank you for your time and consideration. We look forward to hearing from you.

Sincerely,

[Corresponding Author Name]
[Title/Position]
[Institution]
[Email]
[Phone]`;
  }

  private generateChecklists(paperType: string): SubmissionChecklist {
    return {
      beforeSubmission: [
        { item: 'Proofread for spelling and grammar errors', completed: false },
        { item: 'Verify all references are complete and accurate', completed: false },
        { item: 'Check all figures and tables are numbered and titled', completed: false },
        { item: 'Ensure all citations have corresponding references', completed: false },
        { item: 'Verify author order and affiliations', completed: false },
        { item: 'Obtain conflict of interest statements from all authors', completed: false },
        { item: 'Check word count meets journal requirements', completed: false, notes: 'Typically 3000-8000 words' }
      ],
      manuscriptRequirements: [
        { item: 'Title page with all author information', completed: false },
        { item: 'Abstract within word limit (usually 150-250 words)', completed: false },
        { item: 'Keywords (usually 3-6)', completed: false },
        { item: 'Main text with appropriate headings', completed: false },
        { item: 'References in correct format', completed: false },
        { item: 'Figure captions', completed: false },
        { item: 'Table titles', completed: false }
      ],
      formatting: [
        { item: 'Double spacing throughout', completed: false },
        { item: 'Consistent font (usually Times New Roman, 12pt)', completed: false },
        { item: '1-inch margins on all sides', completed: false },
        { item: 'Page numbers included', completed: false },
        { item: 'Continuous line numbering', completed: false, notes: 'Required by some journals' },
        { item: 'Figures and tables at end of document', completed: false, notes: 'Or in separate files' }
      ],
      documents: [
        { item: 'Cover letter', completed: false },
        { item: 'Manuscript file (Word or LaTeX)', completed: false },
        { item: 'Figure files (high resolution)', completed: false, notes: 'Usually TIFF, EPS, or high-res PDF' },
        { item: 'Table files', completed: false },
        { item: 'Supplementary materials (if applicable)', completed: false },
        { item: 'Conflict of interest statement', completed: false },
        { item: 'Author contribution statement', completed: false, notes: 'CRediT format recommended' }
      ]
    };
  }

  private generateTimeline(paperType: string): SubmissionTimeline {
    const timelines: Record<string, SubmissionTimeline> = {
      'research-article': {
        preparation: 4,
        submission: 1,
        review: 4,
        revision: 2,
        publication: 2,
        total: 13
      },
      'review': {
        preparation: 3,
        submission: 1,
        review: 3,
        revision: 1,
        publication: 1,
        total: 9
      },
      'short-communication': {
        preparation: 2,
        submission: 1,
        review: 2,
        revision: 1,
        publication: 1,
        total: 7
      },
      'case-report': {
        preparation: 2,
        submission: 1,
        review: 3,
        revision: 1,
        publication: 1,
        total: 8
      },
      'letter': {
        preparation: 1,
        submission: 1,
        review: 1,
        revision: 1,
        publication: 1,
        total: 5
      }
    };

    return timelines[paperType] || timelines['research-article'];
  }

  private generateTips(): SubmissionTip[] {
    return [
      {
        category: 'Journal Selection',
        tip: 'Choose journals that have published similar work - check their recent articles',
        priority: 'high'
      },
      {
        category: 'Journal Selection',
        tip: 'Consider impact factor vs. acceptance rate trade-off - higher impact often means lower acceptance',
        priority: 'medium'
      },
      {
        category: 'Cover Letter',
        tip: 'Customize the cover letter for each journal - show you know the journal',
        priority: 'high'
      },
      {
        category: 'Cover Letter',
        tip: 'Keep it concise - typically 1 page maximum',
        priority: 'medium'
      },
      {
        category: 'Formatting',
        tip: 'Follow author guidelines precisely - failure leads to immediate rejection',
        priority: 'high'
      },
      {
        category: 'Formatting',
        tip: 'Use reference management software (EndNote, Zotero, Mendeley) to ensure accurate citations',
        priority: 'medium'
      },
      {
        category: 'Submission Process',
        tip: 'Submit during non-peak times (avoid holidays and conference periods)',
        priority: 'low'
      },
      {
        category: 'Peer Review',
        tip: 'Respond to every reviewer comment in your revision, even if you disagree',
        priority: 'high'
      },
      {
        category: 'Peer Review',
        tip: 'Provide a point-by-point response document with your revised manuscript',
        priority: 'high'
      },
      {
        category: 'Ethics',
        tip: 'Ensure proper attribution and avoid plagiarism - use plagiarism detection software',
        priority: 'high'
      },
      {
        category: 'Open Access',
        tip: 'Consider open access options for wider dissemination, but be aware of article processing charges',
        priority: 'medium'
      },
      {
        category: 'Preprints',
        tip: 'Consider posting a preprint (bioRxiv, arXiv) to establish priority while under review',
        priority: 'medium'
      }
    ];
  }
}

// Helper function to estimate impact level from abstract
function impactEstimate(abstract: string): 'high' | 'medium' | 'low' {
  const novelIndicators = /\b(novel|innovative|groundbreaking|revolutionary|paradigm-shift|first|discovery)\b/gi;
  const significantIndicators = /\b(significant|important|critical|essential|major|substantial)\b/gi;

  const novelCount = (abstract.match(novelIndicators) || []).length;
  const significantCount = (abstract.match(significantIndicators) || []).length;

  if (novelCount >= 2) return 'high';
  if (significantCount >= 2 || novelCount >= 1) return 'medium';
  return 'low';
}
