// Peer Review Skill
import type { ISkill, Task, SkillConfig } from '@assistant/core';
import { validateInput } from '@assistant/utils';
import { z } from 'zod';
import { log } from '@assistant/utils';
import { SkillType, TaskStatus } from '@assistant/core';

const ReviewPaperInputSchema = z.object({
  title: z.string().min(1),
  abstract: z.string(),
  content: z.string().min(100),
  section: z.enum([
    'full-paper',
    'introduction',
    'methods',
    'results',
    'discussion',
    'conclusion'
  ]).default('full-paper'),
  reviewType: z.enum([
    'comprehensive',
    'structure',
    'content',
    'methodology'
  ]).default('comprehensive')
});

export type ReviewPaperInput = z.infer<typeof ReviewPaperInputSchema>;

export interface PeerReviewReport {
  overall: OverallAssessment;
  sections: SectionReview[];
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  score: ReviewScore;
  decision: ReviewDecision;
}

export interface OverallAssessment {
  summary: string;
  clarity: number;
  originality: number;
  significance: number;
  methodology: number;
  presentation: number;
}

export interface SectionReview {
  section: string;
  assessment: string;
  issues: ReviewIssue[];
  suggestions: string[];
}

export interface ReviewIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  location?: string;
}

export interface Recommendation {
  priority: 'essential' | 'important' | 'optional';
  category: string;
  description: string;
  action: string;
}

export interface ReviewScore {
  total: number;
  maxScore: number;
  percentage: number;
  breakdown: { criterion: string; score: number; max: number }[];
}

export type ReviewDecision = 'accept' | 'minor-revisions' | 'major-revisions' | 'reject' | 'resubmit';

const skillConfig: SkillConfig = {
  id: 'peer-review',
  type: SkillType.PEER_REVIEW,
  name: 'Peer Review',
  description: 'Simulate academic peer review process',
  version: '1.0.0',
  enabled: true
};

export class PeerReviewSkill implements ISkill {
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
      await validateInput(ReviewPaperInputSchema, input);
      return true;
    } catch {
      return false;
    }
  }

  async execute<T, U>(task: Task<T, U>): Promise<Task<T, U>> {
    const validatedInput = await validateInput(ReviewPaperInputSchema, task.input as any);

    log.info(`Conducting peer review for: ${validatedInput.title}`);

    const review = await this.conductReview(validatedInput);

    log.info(`Review complete - Decision: ${review.decision}, Score: ${review.score.percentage}%`);

    return {
      ...task,
      output: review as U,
      status: TaskStatus.COMPLETED,
      updatedAt: new Date()
    };
  }

  private async conductReview(input: ReviewPaperInput): Promise<PeerReviewReport> {
    const { title, abstract, content, section, reviewType } = input;

    // Analyze content
    const overall = this.assessOverall(content, abstract);
    const sections = this.reviewSections(content, section);
    const strengths = this.identifyStrengths(content, abstract);
    const weaknesses = this.identifyWeaknesses(content, abstract);
    const recommendations = this.generateRecommendations(sections, weaknesses);
    const score = this.calculateScore(overall);
    const decision = this.makeDecision(score, recommendations);

    return {
      overall,
      sections,
      strengths,
      weaknesses,
      recommendations,
      score,
      decision
    };
  }

  private assessOverall(content: string, abstract: string): OverallAssessment {
    const wordCount = content.split(/\s+/).length;
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const avgSentenceLength = wordCount / sentences.length;

    // Calculate scores based on various criteria
    const clarity = this.assessClarity(content, avgSentenceLength);
    const originality = this.assessOriginality(content, abstract);
    const significance = this.assessSignificance(abstract);
    const methodology = this.assessMethodology(content);
    const presentation = this.assessPresentation(content);

    return {
      summary: this.generateSummary(clarity, originality, significance, methodology),
      clarity,
      originality,
      significance,
      methodology,
      presentation
    };
  }

  private assessClarity(content: string, avgSentenceLength: number): number {
    let score = 70; // Base score

    // Check sentence length
    if (avgSentenceLength >= 15 && avgSentenceLength <= 25) {
      score += 10;
    } else if (avgSentenceLength > 30) {
      score -= 10;
    }

    // Check for clear transitions
    const transitions = /\b(however|therefore|furthermore|moreover|consequently|nevertheless)\b/gi;
    const transitionCount = (content.match(transitions) || []).length;
    score += Math.min(transitionCount * 2, 10);

    // Check for vague language
    const vagueWords = /\b(stuff|things|very|really|basically|kind of|sort of)\b/gi;
    const vagueCount = (content.match(vagueWords) || []).length;
    score -= vagueCount * 3;

    return Math.max(0, Math.min(100, score));
  }

  private assessOriginality(content: string, abstract: string): number {
    let score = 70; // Base score

    // Check for novel approaches
    const novelIndicators = [
      /\b(novel|innovative|unique|original|groundbreaking|pioneering)\b/gi,
      /\b(first|new approach|innovative method|unique perspective)\b/gi
    ];

    for (const indicator of novelIndicators) {
      const matches = (abstract.match(indicator) || []).length;
      score += Math.min(matches * 5, 10);
    }

    // Check for references to own work (indicates ongoing program)
    const selfReference = /\b(our previous work|our earlier study|we previously)\b/gi;
    if (selfReference.test(content)) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private assessSignificance(abstract: string): number {
    let score = 70; // Base score

    // Check for impact statements
    const impactIndicators = [
      /\b(significant|important|critical|essential|valuable|contribution)\b/gi,
      /\b(advances|improves|enhances|addresses|solves)\b/gi,
      /\b(implications|applications|impact|relevance)\b/gi
    ];

    for (const indicator of impactIndicators) {
      const matches = (abstract.match(indicator) || []).length;
      score += Math.min(matches * 3, 8);
    }

    // Check for practical implications
    if (/\b(practical|real-world|industry|application|implementation)\b/gi.test(abstract)) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private assessMethodology(content: string): number {
    let score = 70; // Base score

    // Check for method description
    const methodIndicators = [
      /\b(method|methodology|approach|procedure|technique)\b/gi,
      /\b(participants|subjects|sample|data collection)\b/gi,
      /\b(analysis|statistical|qualitative|quantitative)\b/gi
    ];

    for (const indicator of methodIndicators) {
      if (indicator.test(content)) {
        score += 8;
      }
    }

    // Check for sample size
    const sampleSize = /\b(n\s*=\s*\d+|sample\s*size\s*(of|:)\s*\d+)\b/gi;
    if (sampleSize.test(content)) {
      score += 5;
    }

    // Check for validation
    const validation = /\b(validat|reliabil|cronbach|inter-rater|test-retest)\b/gi;
    if (validation.test(content)) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private assessPresentation(content: string): number {
    let score = 75; // Base score

    // Check for structure
    const hasHeadings = /\b(introduction|method|result|discuss|conclusion)\b/gi.test(content);
    if (hasHeadings) {
      score += 10;
    }

    // Check for citations
    const citations = /\b(\d{4}|et al\.|doi\.org)\b/g;
    const citationCount = (content.match(citations) || []).length;
    score += Math.min(citationCount * 2, 10);

    // Check for visual aids mention
    if (/\b(figure|table|graph|chart)\b/gi.test(content)) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private reviewSections(content: string, section: string): SectionReview[] {
    const reviews: SectionReview[] = [];

    if (section === 'full-paper' || section === 'introduction') {
      reviews.push(this.reviewIntroduction(content));
    }

    if (section === 'full-paper' || section === 'methods') {
      reviews.push(this.reviewMethods(content));
    }

    if (section === 'full-paper' || section === 'results') {
      reviews.push(this.reviewResults(content));
    }

    if (section === 'full-paper' || section === 'discussion') {
      reviews.push(this.reviewDiscussion(content));
    }

    return reviews;
  }

  private reviewIntroduction(content: string): SectionReview {
    const issues: ReviewIssue[] = [];
    const suggestions: string[] = [];

    // Check for research question
    if (!/\b(research question|objective|aim|purpose)\b/gi.test(content)) {
      issues.push({
        severity: 'major',
        category: 'Structure',
        description: 'Research question not clearly stated',
        location: 'Introduction'
      });
      suggestions.push('Clearly state the research question or objectives');
    }

    // Check for background
    if (!/\b(background|context|literature|previous studies)\b/gi.test(content)) {
      issues.push({
        severity: 'major',
        category: 'Content',
        description: 'Insufficient background information',
        location: 'Introduction'
      });
      suggestions.push('Provide more context and background literature');
    }

    const assessment = issues.length === 0
      ? 'Introduction is well-structured with clear research objectives'
      : 'Introduction needs improvement in structure and clarity';

    return { section: 'Introduction', assessment, issues, suggestions };
  }

  private reviewMethods(content: string): SectionReview {
    const issues: ReviewIssue[] = [];
    const suggestions: string[] = [];

    // Check for reproducibility
    if (!/\b(participants|procedure|data collection|measures)\b/gi.test(content)) {
      issues.push({
        severity: 'critical',
        category: 'Reproducibility',
        description: 'Insufficient method details for replication',
        location: 'Methods'
      });
    }

    // Check for ethical considerations
    if (!/\b(ethical|consent|approval|institutional review board|IRB)\b/gi.test(content)) {
      issues.push({
        severity: 'major',
        category: 'Ethics',
        description: 'Ethical considerations not addressed',
        location: 'Methods'
      });
      suggestions.push('Include statement on ethical approval and participant consent');
    }

    const assessment = issues.length === 0
      ? 'Methods section is comprehensive and replicable'
      : 'Methods section requires additional details';

    return { section: 'Methods', assessment, issues, suggestions };
  }

  private reviewResults(content: string): SectionReview {
    const issues: ReviewIssue[] = [];
    const suggestions: string[] = [];

    // Check for statistical results
    const hasStats = /\b(p\s*[<>=]\s*0\.05|significant|correlation|regression|t-test)\b/gi.test(content);
    if (!hasStats) {
      issues.push({
        severity: 'minor',
        category: 'Reporting',
        description: 'Statistical significance not clearly reported',
        location: 'Results'
      });
    }

    // Check for effect sizes
    if (!/\b(effect size|cohen's d|partial eta|odds ratio)\b/gi.test(content)) {
      suggestions.push('Consider reporting effect sizes for key findings');
    }

    const assessment = issues.length === 0
      ? 'Results are clearly presented with appropriate statistics'
      : 'Results presentation could be improved';

    return { section: 'Results', assessment, issues, suggestions };
  }

  private reviewDiscussion(content: string): SectionReview {
    const issues: ReviewIssue[] = [];
    const suggestions: string[] = [];

    // Check for interpretation
    if (!/\b(interpret|suggest|indicate|demonstrate|consistent with)\b/gi.test(content)) {
      issues.push({
        severity: 'major',
        category: 'Content',
        description: 'Results not adequately interpreted',
        location: 'Discussion'
      });
      suggestions.push('Provide deeper interpretation of findings');
    }

    // Check for limitations
    if (!/\b(limitation|constraint|weakness|shortcoming)\b/gi.test(content)) {
      issues.push({
        severity: 'major',
        category: 'Completeness',
        description: 'Study limitations not addressed',
        location: 'Discussion'
      });
      suggestions.push('Explicitly discuss study limitations');
    }

    const assessment = issues.length === 0
      ? 'Discussion provides good interpretation and addresses limitations'
      : 'Discussion section needs more depth';

    return { section: 'Discussion', assessment, issues, suggestions };
  }

  private identifyStrengths(content: string, abstract: string): string[] {
    const strengths: string[] = [];

    // Check for clear structure
    if (/\b(introduction|method|result|discuss)\b/gi.test(content)) {
      strengths.push('Well-organized paper structure following IMRaD format');
    }

    // Check for citations
    const citations = (content.match(/\d{4}/g) || []).length;
    if (citations > 10) {
      strengths.push('Good integration of literature and citations');
    }

    // Check for data-driven conclusions
    if (/\b(results indicate|data show|findings suggest)\b/gi.test(content)) {
      strengths.push('Conclusions are well-supported by data');
    }

    // Check for practical implications
    if (/\b(practical|implications|applications|real-world)\b/gi.test(abstract)) {
      strengths.push('Clear practical implications identified');
    }

    return strengths;
  }

  private identifyWeaknesses(content: string, abstract: string): string[] {
    const weaknesses: string[] = [];

    // Check for vague statements
    if (/\b(stuff|things|very|really)\b/gi.test(content)) {
      weaknesses.push('Informal language present in some sections');
    }

    // Check for very long sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 30);
    if (longSentences.length > 5) {
      weaknesses.push('Some sentences are overly long and complex');
    }

    // Check for missing methodology details
    const methodSection = content.substring(0, Math.min(content.length / 2, 2000));
    if (!/\b(participants|sample|procedure)\b/gi.test(methodSection)) {
      weaknesses.push('Methodology lacks detail for replication');
    }

    return weaknesses;
  }

  private generateRecommendations(sections: SectionReview[], weaknesses: string[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const section of sections) {
      for (const issue of section.issues) {
        recommendations.push({
          priority: issue.severity === 'critical' ? 'essential' : issue.severity === 'major' ? 'important' : 'optional',
          category: issue.category,
          description: issue.description,
          action: `Address in ${section.section} section`
        });
      }
    }

    for (const suggestion of sections.flatMap(s => s.suggestions)) {
      recommendations.push({
        priority: 'optional',
        category: 'Improvement',
        description: suggestion,
        action: 'Consider implementing'
      });
    }

    return recommendations.slice(0, 10);
  }

  private calculateScore(overall: OverallAssessment): ReviewScore {
    const breakdown = [
      { criterion: 'Clarity', score: overall.clarity, max: 100 },
      { criterion: 'Originality', score: overall.originality, max: 100 },
      { criterion: 'Significance', score: overall.significance, max: 100 },
      { criterion: 'Methodology', score: overall.methodology, max: 100 },
      { criterion: 'Presentation', score: overall.presentation, max: 100 }
    ];

    const total = breakdown.reduce((sum, item) => sum + item.score, 0);
    const maxScore = breakdown.reduce((sum, item) => sum + item.max, 0);

    return {
      total,
      maxScore,
      percentage: Math.round((total / maxScore) * 100),
      breakdown
    };
  }

  private makeDecision(score: ReviewScore, recommendations: Recommendation[]): ReviewDecision {
    const essentialCount = recommendations.filter(r => r.priority === 'essential').length;
    const importantCount = recommendations.filter(r => r.priority === 'important').length;

    if (score.percentage >= 85 && essentialCount === 0) {
      return 'accept';
    } else if (score.percentage >= 70 && essentialCount === 0) {
      return 'minor-revisions';
    } else if (score.percentage >= 50 && essentialCount <= 2) {
      return 'major-revisions';
    } else if (score.percentage >= 40) {
      return 'resubmit';
    } else {
      return 'reject';
    }
  }

  private generateSummary(clarity: number, originality: number, significance: number, methodology: number): string {
    const avg = (clarity + originality + significance + methodology) / 4;

    if (avg >= 80) {
      return 'This paper demonstrates high quality across all evaluated criteria.';
    } else if (avg >= 60) {
      return 'This paper shows merit but requires improvements in several areas.';
    } else if (avg >= 40) {
      return 'This paper has significant weaknesses that need to be addressed.';
    } else {
      return 'This paper requires substantial revision to meet publication standards.';
    }
  }
}
