// Writing Quality Skill
import type { ISkill, Task, SkillConfig } from '@assistant/core';
import { validateInput } from '@assistant/utils';
import { z } from 'zod';
import { log } from '@assistant/utils';
import { SkillType, TaskStatus } from '@assistant/core';

const QualityCheckInputSchema = z.object({
  text: z.string().min(50),
  checks: z.array(z.enum([
    'grammar',
    'clarity',
    'tone',
    'readability',
    'consistency',
    'vocabulary'
  ])).default(['grammar', 'clarity', 'readability'])
});

export type QualityCheckInput = z.infer<typeof QualityCheckInputSchema>;

export interface QualityReport {
  overallScore: number;
  checks: QualityCheck[];
  suggestions: Suggestion[];
  statistics: TextStatistics;
}

export interface QualityCheck {
  name: string;
  score: number;
  issues: Issue[];
  passed: boolean;
}

export interface Issue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    line?: number;
    context: string;
  };
  suggestion?: string;
}

export interface Suggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  example?: {
    original: string;
    improved: string;
  };
}

export interface TextStatistics {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  avgCharsPerWord: number;
  readingTime: number;
}

const skillConfig: SkillConfig = {
  id: 'writing-quality',
  type: SkillType.WRITING_QUALITY,
  name: 'Writing Quality',
  description: 'Check and improve academic writing quality',
  version: '1.0.0',
  enabled: true
};

export class WritingQualitySkill implements ISkill {
  readonly id = skillConfig.id;
  readonly name = skillConfig.name;
  readonly description = skillConfig.description;
  readonly version = skillConfig.version;
  readonly config = skillConfig;

  // Common academic words that should be used
  private readonly academicWords = new Set([
    'furthermore', 'moreover', 'however', 'nevertheless', 'consequently',
    'therefore', 'thus', 'hence', 'accordingly', 'subsequently',
    'demonstrate', 'illustrate', 'indicate', 'suggest', 'reveal',
    'significant', 'substantial', 'considerable', 'notable', 'remarkable',
    'approximately', 'regarding', 'concerning', 'with respect to',
    'utilize', 'employ', 'implement', 'establish', 'determine'
  ]);

  // Words to avoid in academic writing
  private readonly wordsToAvoid = new Set([
    'very', 'really', 'totally', 'basically', 'things', 'stuff',
    'got', 'a lot', 'kind of', 'sort of', 'good', 'bad',
    'huge', 'big', 'okay', 'nice', 'pretty'
  ]);

  canHandle<T>(task: Task<T>): boolean {
    return task.assignedAgent === undefined ||
      (task.requiredSkills !== undefined && task.requiredSkills.includes(this.id));
  }

  async validate<T>(input: T): Promise<boolean> {
    try {
      await validateInput(QualityCheckInputSchema, input);
      return true;
    } catch {
      return false;
    }
  }

  async execute<T, U>(task: Task<T, U>): Promise<Task<T, U>> {
    const validatedInput = await validateInput(QualityCheckInputSchema, task.input as any);

    log.info(`Running ${validatedInput.checks.length} quality checks on text`);

    const report = await this.analyzeQuality(validatedInput.text, validatedInput.checks);

    log.info(`Quality analysis complete - Overall score: ${report.overallScore}/100`);

    return {
      ...task,
      output: report as U,
      status: TaskStatus.COMPLETED,
      updatedAt: new Date()
    };
  }

  private async analyzeQuality(text: string, checks: string[]): Promise<QualityReport> {
    const results: QualityCheck[] = [];
    const suggestions: Suggestion[] = [];

    // Run requested checks
    for (const check of checks) {
      switch (check) {
        case 'grammar':
          results.push(this.checkGrammar(text));
          break;
        case 'clarity':
          results.push(this.checkClarity(text));
          break;
        case 'tone':
          results.push(this.checkTone(text));
          break;
        case 'readability':
          results.push(this.checkReadability(text));
          break;
        case 'consistency':
          results.push(this.checkConsistency(text));
          break;
        case 'vocabulary':
          results.push(this.checkVocabulary(text));
          break;
      }
    }

    // Generate suggestions based on issues
    for (const check of results) {
      for (const issue of check.issues) {
        if (issue.suggestion) {
          suggestions.push({
            category: check.name,
            priority: issue.severity === 'error' ? 'high' : issue.severity === 'warning' ? 'medium' : 'low',
            description: issue.suggestion,
            example: issue.location ? {
              original: issue.location.context,
              improved: issue.suggestion
            } : undefined
          });
        }
      }
    }

    // Calculate overall score
    const overallScore = Math.round(
      results.reduce((sum, check) => sum + check.score, 0) / results.length
    );

    return {
      overallScore,
      checks: results,
      suggestions,
      statistics: this.calculateStatistics(text)
    };
  }

  private checkGrammar(text: string): QualityCheck {
    const issues: Issue[] = [];

    // Check for common grammar issues
    const patterns = [
      {
        pattern: /\ba\s+[aeiou]/gi,
        message: 'Use "an" before words starting with a vowel',
        suggestion: 'an'
      },
      {
        pattern: /\b(an)\s+[bcdfghjklmnpqrstvwxyz]/gi,
        message: 'Use "a" before words starting with a consonant',
        suggestion: 'a'
      },
      {
        pattern: /\s\.$/gm,
        message: 'Extra space before period',
        suggestion: '.'
      },
      {
        pattern: /\.\s\s+/,
        message: 'Multiple spaces after period',
        suggestion: '. '
      }
    ];

    for (const { pattern, message, suggestion } of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const lines = text.split('\n');
        const lineIndex = lines.findIndex(line => line.includes(match[0]));
        issues.push({
          type: 'grammar',
          severity: 'warning',
          message,
          location: {
            line: lineIndex + 1,
            context: match[0]
          },
          suggestion
        });
      }
    }

    return {
      name: 'Grammar',
      score: Math.max(0, 100 - issues.length * 5),
      issues,
      passed: issues.length === 0
    };
  }

  private checkClarity(text: string): QualityCheck {
    const issues: Issue[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    sentences.forEach((sentence, idx) => {
      const words = sentence.trim().split(/\s+/);

      // Check for very long sentences
      if (words.length > 30) {
        issues.push({
          type: 'clarity',
          severity: 'warning',
          message: `Very long sentence (${words.length} words)`,
          location: {
            line: idx + 1,
            context: sentence.substring(0, 50) + '...'
          },
          suggestion: 'Consider breaking this into shorter sentences'
        });
      }

      // Check for passive voice indicators
      if (/\b(was|were|been|being)\s+\w+ed\b/.test(sentence)) {
        issues.push({
          type: 'clarity',
          severity: 'info',
          message: 'Possible passive voice',
          location: {
            line: idx + 1,
            context: sentence.substring(0, 50) + '...'
          },
          suggestion: 'Consider using active voice for clarity'
        });
      }
    });

    return {
      name: 'Clarity',
      score: Math.max(0, 100 - issues.length * 5),
      issues,
      passed: issues.length < 3
    };
  }

  private checkTone(text: string): QualityCheck {
    const issues: Issue[] = [];
    const words = text.toLowerCase().split(/\s+/);

    // Check for informal words
    const informalFound = words.filter(w => this.wordsToAvoid.has(w.replace(/[.,!?;:]/g, '')));

    if (informalFound.length > 0) {
      issues.push({
        type: 'tone',
        severity: 'warning',
        message: `Found ${informalFound.length} informal word(s)`,
        suggestion: 'Replace with more formal alternatives',
        location: {
          context: `Examples: ${informalFound.slice(0, 3).join(', ')}`
        }
      });
    }

    // Check for contractions
    const contractions = text.match(/\b\w+['']\w+\b/g) || [];
    if (contractions.length > 0) {
      issues.push({
        type: 'tone',
        severity: 'info',
        message: `Found ${contractions.length} contraction(s)`,
        suggestion: 'Expand contractions for formal writing',
        location: {
          context: `Examples: ${contractions.slice(0, 3).join(', ')}`
        }
      });
    }

    return {
      name: 'Tone',
      score: Math.max(0, 100 - issues.length * 10),
      issues,
      passed: informalFound.length === 0
    };
  }

  private checkReadability(text: string): QualityCheck {
    const issues: Issue[] = [];
    const words = text.split(/\s+/);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord = text.replace(/\s/g, '').length / words.length;

    // Check average sentence length
    if (avgWordsPerSentence > 25) {
      issues.push({
        type: 'readability',
        severity: 'warning',
        message: `Average sentence length is ${avgWordsPerSentence.toFixed(1)} words`,
        suggestion: 'Aim for 15-20 words per sentence for academic writing',
        location: {
          context: `Current: ${avgWordsPerSentence.toFixed(1)}, Recommended: 15-20`
        }
      });
    }

    // Check word complexity
    const complexWords = words.filter(w => w.length > 15);
    if (complexWords.length > words.length * 0.1) {
      issues.push({
        type: 'readability',
        severity: 'info',
        message: 'High proportion of complex words',
        suggestion: 'Consider simplifying some terms or defining them clearly'
      });
    }

    return {
      name: 'Readability',
      score: Math.max(0, 100 - issues.length * 10),
      issues,
      passed: avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25
    };
  }

  private checkConsistency(text: string): QualityCheck {
    const issues: Issue[] = [];

    // Check for consistent abbreviation usage
    const abbreviations = text.match(/\b[A-Z]{2,}\b/g) || [];
    const uniqueAbbreviations = [...new Set(abbreviations)];

    // This is a simplified check - in reality, you'd track if abbreviations are defined
    if (uniqueAbbreviations.length > 5) {
      issues.push({
        type: 'consistency',
        severity: 'info',
        message: `Found ${uniqueAbbreviations.length} unique abbreviations`,
        suggestion: 'Ensure all abbreviations are defined on first use'
      });
    }

    return {
      name: 'Consistency',
      score: Math.max(0, 100 - issues.length * 5),
      issues,
      passed: true
    };
  }

  private checkVocabulary(text: string): QualityCheck {
    const issues: Issue[] = [];
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);

    // Calculate vocabulary richness
    const vocabularyRichness = uniqueWords.size / words.length;

    // Check for academic vocabulary usage
    const academicWordCount = words.filter(w => this.academicWords.has(w.replace(/[.,!?;:]/g, ''))).length;

    if (academicWordCount < words.length * 0.05) {
      issues.push({
        type: 'vocabulary',
        severity: 'info',
        message: 'Low usage of academic vocabulary',
        suggestion: 'Consider using more precise academic terms',
        location: {
          context: `Academic words found: ${academicWordCount}/${words.length}`
        }
      });
    }

    return {
      name: 'Vocabulary',
      score: Math.max(0, 100 - issues.length * 10),
      issues,
      passed: vocabularyRichness > 0.5
    };
  }

  private calculateStatistics(text: string): TextStatistics {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const wordCount = words.length;
    const sentenceCount = sentences.length;

    return {
      wordCount,
      sentenceCount,
      avgWordsPerSentence: sentenceCount > 0 ? wordCount / sentenceCount : 0,
      avgCharsPerWord: wordCount > 0 ? text.replace(/\s/g, '').length / wordCount : 0,
      readingTime: Math.ceil(wordCount / 200) // 200 words per minute
    };
  }
}
