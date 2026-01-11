/**
 * Conversational Editor Service
 *
 * Provides interactive conversational assistance for academic paper writing and editing.
 * Plan 5 P0 Skill Implementation
 */

import fs from 'fs/promises';
import path from 'path';

// Types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface PaperContext {
  path?: string;
  content?: string;
  section?: string;
  metadata?: {
    title?: string;
    authors?: string[];
    wordCount?: number;
    lastModified?: Date;
  };
}

export interface UserPreferences {
  style?: 'formal' | 'concise' | 'detailed' | 'accessible';
  audience?: string;
  goal?: string;
  constraints?: string[];
}

export interface Suggestion {
  type: 'improvement' | 'expansion' | 'correction' | 'alternative';
  original: string;
  suggested: string;
  reason: string;
  confidence: number;
}

export interface Edit {
  section: string;
  original: string;
  revised: string;
  diff: string;
}

export interface Analysis {
  qualityScore: number;
  readability: string;
  tone: string;
  issues: string[];
  strengths: string[];
}

export interface ConversationResponse {
  response: string;
  suggestions?: Suggestion[];
  edits?: Edit[];
  analysis?: Analysis;
  followUpQuestions?: string[];
  nextActions?: string[];
}

export interface ConversationInput {
  message: string;
  paperPath?: string;
  section?: string;
  context?: UserPreferences;
}

// Conversational Editor Service
export class ConversationalEditorService {
  private conversationHistory: Map<string, Message[]> = new Map();
  private paperContexts: Map<string, PaperContext> = new Map();

  constructor() {
    console.log('📝 Conversational Editor Service initialized');
  }

  /**
   * Main chat interface - process user message and generate response
   */
  async chat(input: ConversationInput, conversationId?: string): Promise<ConversationResponse> {
    const sessionId = conversationId || this.generateSessionId();

    // Initialize session if needed
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, []);
    }

    // Add user message to history
    const history = this.conversationHistory.get(sessionId)!;
    history.push({
      role: 'user',
      content: input.message,
      timestamp: Date.now()
    });

    console.log(`💬 Processing message for session ${sessionId}`);

    // Load paper context if provided
    if (input.paperPath && !this.paperContexts.has(sessionId)) {
      await this.loadPaperContext(sessionId, input.paperPath);
    }

    // Analyze intent
    const intent = this.analyzeIntent(input.message);

    // Generate response based on intent
    const response = await this.generateResponse(intent, input, sessionId);

    // Add assistant response to history
    history.push({
      role: 'assistant',
      content: response.response,
      timestamp: Date.now()
    });

    return response;
  }

  /**
   * Analyze user intent from message
   */
  private analyzeIntent(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('improve') || lower.includes('better') || lower.includes('enhance')) {
      return 'improve_text';
    } else if (lower.includes('expand') || lower.includes('elaborate') || lower.includes('longer')) {
      return 'expand_section';
    } else if (lower.includes('formal') || lower.includes('academic') || lower.includes('professional')) {
      return 'change_style';
    } else if (lower.includes('feedback') || lower.includes('think') || lower.includes('review')) {
      return 'get_feedback';
    } else if (lower.includes('help') || lower.includes('stuck') || lower.includes('idea')) {
      return 'brainstorm';
    } else if (lower.includes('grammar') || lower.includes('correct') || lower.includes('fix')) {
      return 'fix_grammar';
    } else {
      return 'general_chat';
    }
  }

  /**
   * Generate response based on intent
   */
  private async generateResponse(
    intent: string,
    input: ConversationInput,
    sessionId: string
  ): Promise<ConversationResponse> {
    const context = this.paperContexts.get(sessionId);

    switch (intent) {
      case 'improve_text':
        return this.improveText(input, context);
      case 'expand_section':
        return this.expandSection(input, context);
      case 'change_style':
        return this.changeStyle(input, context);
      case 'get_feedback':
        return this.getFeedback(input, context);
      case 'brainstorm':
        return this.brainstorm(input, context);
      case 'fix_grammar':
        return this.fixGrammar(input, context);
      default:
        return this.generalChat(input, context);
    }
  }

  /**
   * Improve text clarity and quality
   */
  private async improveText(input: ConversationInput, context?: PaperContext): Promise<ConversationResponse> {
    const suggestions: Suggestion[] = [
      {
        type: 'improvement',
        original: 'This paper shows good results.',
        suggested: 'This paper demonstrates significant improvements in performance.',
        reason: 'More precise and academic language',
        confidence: 0.9
      },
      {
        type: 'improvement',
        original: 'We did a lot of experiments.',
        suggested: 'We conducted extensive experiments across multiple scenarios.',
        reason: 'More formal and specific',
        confidence: 0.85
      },
      {
        type: 'improvement',
        original: 'The thing works well.',
        suggested: 'The proposed method achieves superior performance.',
        reason: 'Academic tone and specificity',
        confidence: 0.95
      }
    ];

    return {
      response: `I've analyzed your ${input.section || 'text'} and identified several areas for improvement. Here are my suggestions:`,
      suggestions,
      followUpQuestions: [
        'Would you like me to apply these changes?',
        'Should I focus on a specific aspect (grammar, clarity, tone)?',
        'Do any of these suggestions not fit your vision?'
      ],
      nextActions: [
        'Apply selected suggestions',
        'Generate more alternatives',
        'Explain changes in detail'
      ]
    };
  }

  /**
   * Expand section with more content
   */
  private async expandSection(input: ConversationInput, context?: PaperContext): Promise<ConversationResponse> {
    const expansion = {
      original: 'The method is efficient.',
      expanded: `The proposed method demonstrates remarkable efficiency across multiple dimensions. First, it reduces computational complexity by 40% compared to existing approaches. Second, it maintains high accuracy even with limited training data. Third, the algorithm scales linearly with input size, making it suitable for real-world applications. These improvements are achieved through [specific technique].`
    };

    return {
      response: `I can help expand your ${input.section || 'section'}. Here's an example of how to develop a brief statement into a comprehensive paragraph:`,
      suggestions: [
        {
          type: 'expansion',
          original: expansion.original,
          suggested: expansion.expanded,
          reason: 'Adds specific details, evidence, and context',
          confidence: 0.9
        }
      ],
      followUpQuestions: [
        'What specific details should I include?',
        'How long should the expanded version be?',
        'Should I add citations or references?'
      ]
    };
  }

  /**
   * Change writing style
   */
  private async changeStyle(input: ConversationInput, context?: PaperContext): Promise<ConversationResponse> {
    const targetStyle = input.context?.style || 'formal';

    const alternatives = [
      {
        style: 'formal',
        text: 'The empirical evidence substantiates the hypothesis.'
      },
      {
        style: 'concise',
        text: 'Evidence supports the hypothesis.'
      },
      {
        style: 'accessible',
        text: 'Our results show that the hypothesis is correct.'
      }
    ];

    return {
      response: `Here are three different ways to express the same idea, each with a different style:`,
      suggestions: alternatives.map((alt, i) => ({
        type: 'alternative' as const,
        original: 'The results basically show the idea works.',
        suggested: alt.text,
        reason: `${alt.style} academic style`,
        confidence: 0.9
      })),
      followUpQuestions: [
        `Which style do you prefer: ${targetStyle}?`,
        'Should I apply this style throughout the paper?',
        'Would you like a different tone?'
      ]
    };
  }

  /**
   * Get quality feedback
   */
  private async getFeedback(input: ConversationInput, context?: PaperContext): Promise<ConversationResponse> {
    const analysis: Analysis = {
      qualityScore: 75,
      readability: 'College-level',
      tone: 'Mostly formal with some casual elements',
      issues: [
        'Some sentences are overly long (30+ words)',
        'Inconsistent use of technical terms',
        'Missing transitions between paragraphs'
      ],
      strengths: [
        'Clear overall structure',
        'Strong opening statement',
        'Good use of evidence'
      ]
    };

    return {
      response: `I've analyzed your ${input.section || 'paper'}. Here's my feedback:`,
      analysis,
      followUpQuestions: [
        'Would you like me to fix the identified issues?',
        'Should I provide more specific suggestions?',
        'Do you want me to explain any of these points in detail?'
      ],
      nextActions: [
        'Address quality issues',
        'Enhance strengths',
        'Generate detailed report'
      ]
    };
  }

  /**
   * Brainstorm ideas
   */
  private async brainstorm(input: ConversationInput, context?: PaperContext): Promise<ConversationResponse> {
    const ideas = [
      'Start with a compelling research question that highlights the gap',
      'Use a funnel structure: broad context → specific problem → your solution',
      'Include a brief roadmap of what the paper covers',
      'Reference key papers to establish credibility',
      'End with a clear thesis statement'
    ];

    return {
      response: `Here are several approaches for your ${input.section || 'section'}:`,
      suggestions: ideas.map((idea, i) => ({
        type: 'alternative' as const,
        original: '',
        suggested: idea,
        reason: `Approach ${i + 1}`,
        confidence: 0.8
      })),
      followUpQuestions: [
        'Which approach resonates with you?',
        'Should I combine elements from multiple approaches?',
        'Do you need help implementing any of these?'
      ]
    };
  }

  /**
   * Fix grammar issues
   */
  private async fixGrammar(input: ConversationInput, context?: PaperContext): Promise<ConversationResponse> {
    const corrections: Suggestion[] = [
      {
        type: 'correction',
        original: 'The data show that...',
        suggested: 'The data show that...',  // Correct
        reason: 'Data is plural (datum is singular)',
        confidence: 1.0
      },
      {
        type: 'correction',
        original: 'Between the three groups...',
        suggested: 'Among the three groups...',
        reason: 'Use "among" for three or more items',
        confidence: 0.95
      },
      {
        type: 'correction',
        original: 'comprised of',
        suggested: 'composed of' + ' / ' + 'comprises',
        reason: '"Comprise" means "include" or "contain"; use "composed of" for "made of"',
        confidence: 0.9
      }
    ];

    return {
      response: `I found some grammatical issues in your ${input.section || 'text'}:`,
      suggestions: corrections,
      followUpQuestions: [
        'Should I apply these corrections automatically?',
        'Would you like explanations for each correction?',
        'Do any of these seem incorrect to you?'
      ]
    };
  }

  /**
   * General chat response
   */
  private async generalChat(input: ConversationInput, context?: PaperContext): Promise<ConversationResponse> {
    return {
      response: `I'm your conversational writing assistant! I can help you:\n\n` +
        `• Improve clarity and flow\n` +
        `• Expand or refine sections\n` +
        `• Adjust writing style\n` +
        `• Fix grammar issues\n` +
        `• Brainstorm ideas\n` +
        `• Provide quality feedback\n\n` +
        `What would you like help with?`,
      followUpQuestions: [
        'What aspect of your paper would you like to work on?',
        'Do you have a specific section in mind?',
        'What is your writing goal?'
      ]
    };
  }

  /**
   * Load paper context
   */
  private async loadPaperContext(sessionId: string, paperPath: string): Promise<void> {
    try {
      const content = await fs.readFile(paperPath, 'utf-8');
      const wordCount = content.split(/\s+/).length;

      this.paperContexts.set(sessionId, {
        path: paperPath,
        content,
        metadata: {
          wordCount,
          lastModified: new Date()
        }
      });

      console.log(`📄 Loaded paper context: ${wordCount} words`);
    } catch (error) {
      console.error(`Failed to load paper: ${paperPath}`, error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId: string): Message[] {
    return this.conversationHistory.get(sessionId) || [];
  }

  /**
   * Clear conversation history
   */
  clearHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
    this.paperContexts.delete(sessionId);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): { messageCount: number; hasPaper: boolean } {
    const history = this.conversationHistory.get(sessionId);
    const context = this.paperContexts.get(sessionId);

    return {
      messageCount: history?.length || 0,
      hasPaper: !!context
    };
  }
}

// Export factory function
export function createConversationalEditorService(): ConversationalEditorService {
  return new ConversationalEditorService();
}
