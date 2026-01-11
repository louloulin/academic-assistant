/**
 * Real Recommendation Engine
 *
 * Uses collaborative filtering and content-based algorithms
 * instead of mock random generation
 * Plan 5 - Real Implementation
 */

export interface UserProfile {
  userId: string;
  researchFields: string[];
  skillUsage: Map<string, number>;
  recentPapers: string[];
  preferences: any;
}

export interface Paper {
  paperId: string;
  title: string;
  authors: string[];
  abstract: string;
  field: string;
  year: number;
  citations: number;
}

export interface RecommendationScore {
  paperId: string;
  score: number;
  reasons: string[];
}

/**
 * Real Recommendation Engine using actual algorithms
 */
export class RecommendationEngine {
  private paperDatabase: Map<string, Paper> = new Map();
  private userInteractions: Map<string, Map<string, number>> = new Map(); // userId -> paperId -> rating
  private fieldSimilarity: Map<string, Map<string, number>> = new Map(); // field1 -> field2 -> similarity

  constructor() {
    console.log('✨ Real Recommendation Engine initialized');
    console.log('   Algorithms: Collaborative Filtering + Content-Based');
    this.initializePaperDatabase();
    this.initializeFieldSimilarities();
  }

  /**
   * Calculate recommendation score using hybrid approach
   * Combines collaborative filtering and content-based filtering
   */
  calculateScore(paper: Paper, profile: UserProfile): RecommendationScore {
    const reasons: string[] = [];
    let score = 0;

    // 1. Field matching (content-based)
    const fieldScore = this.calculateFieldMatch(paper, profile.researchFields);
    score += fieldScore * 0.4;
    if (fieldScore > 0.5) {
      reasons.push(`Matches your research in ${paper.field}`);
    }

    // 2. Citation impact (content-based)
    const citationScore = Math.min(paper.citations / 100, 1);
    score += citationScore * 0.2;
    if (paper.citations > 50) {
      reasons.push(`Highly cited (${paper.citations} citations)`);
    }

    // 3. Recency (content-based)
    const currentYear = new Date().getFullYear();
    const recencyScore = Math.max(0, 1 - (currentYear - paper.year) / 10);
    score += recencyScore * 0.1;
    if (paper.year >= currentYear - 2) {
      reasons.push(`Recent publication (${paper.year})`);
    }

    // 4. Collaborative filtering (similar users)
    const collaborativeScore = this.calculateCollaborativeScore(paper.paperId, profile.userId);
    score += collaborativeScore * 0.2;
    if (collaborativeScore > 0.5) {
      reasons.push('Popular with similar researchers');
    }

    // 5. User interaction history (personalization)
    const historyScore = this.calculateHistoryScore(paper, profile);
    score += historyScore * 0.1;
    if (historyScore > 0.5) {
      reasons.push('Based on your reading history');
    }

    return {
      paperId: paper.paperId,
      score: Math.min(score, 1),
      reasons
    };
  }

  /**
   * Calculate field matching score
   */
  private calculateFieldMatch(paper: Paper, userFields: string[]): number {
    if (userFields.length === 0) return 0.3;

    // Direct match
    if (userFields.includes(paper.field)) {
      return 1.0;
    }

    // Field similarity
    let maxSimilarity = 0;
    for (const userField of userFields) {
      const similarity = this.getFieldSimilarity(userField, paper.field);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }

    return maxSimilarity;
  }

  /**
   * Calculate collaborative filtering score
   */
  private calculateCollaborativeScore(paperId: string, userId: string): number {
    // Find similar users based on interaction patterns
    const userInteractions = this.userInteractions.get(userId);
    if (!userInteractions || userInteractions.size === 0) {
      return 0; // Cold start
    }

    let totalScore = 0;
    let similarUsers = 0;

    for (const [otherUserId, otherInteractions] of this.userInteractions) {
      if (otherUserId === userId) continue;

      // Calculate user similarity
      const similarity = this.calculateUserSimilarity(userInteractions, otherInteractions);

      if (similarity > 0.5 && otherInteractions.has(paperId)) {
        totalScore += otherInteractions.get(paperId)! * similarity;
        similarUsers++;
      }
    }

    return similarUsers > 0 ? totalScore / similarUsers : 0;
  }

  /**
   * Calculate similarity between two users based on their interactions
   */
  private calculateUserSimilarity(
    interactions1: Map<string, number>,
    interactions2: Map<string, number>
  ): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    // Find common papers
    for (const [paperId, rating1] of interactions1) {
      if (interactions2.has(paperId)) {
        const rating2 = interactions2.get(paperId)!;
        dotProduct += rating1 * rating2;
      }
      norm1 += rating1 * rating1;
    }

    for (const rating2 of interactions2.values()) {
      norm2 += rating2 * rating2;
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  /**
   * Calculate history-based score
   */
  private calculateHistoryScore(paper: Paper, profile: UserProfile): number {
    if (profile.recentPapers.length === 0) return 0;

    // Check if user has read papers in similar fields
    let similarCount = 0;
    for (const recentPaperId of profile.recentPapers) {
      const recentPaper = this.paperDatabase.get(recentPaperId);
      if (recentPaper) {
        const similarity = this.getFieldSimilarity(recentPaper.field, paper.field);
        if (similarity > 0.7) {
          similarCount++;
        }
      }
    }

    return Math.min(similarCount / profile.recentPapers.length, 1);
  }

  /**
   * Get field similarity
   */
  private getFieldSimilarity(field1: string, field2: string): number {
    if (field1 === field2) return 1.0;

    const similarities = this.fieldSimilarity.get(field1);
    if (similarities) {
      return similarities.get(field2) || 0;
    }

    return 0;
  }

  /**
   * Record user interaction
   */
  recordInteraction(userId: string, paperId: string, rating: number): void {
    if (!this.userInteractions.has(userId)) {
      this.userInteractions.set(userId, new Map());
    }

    this.userInteractions.get(userId)!.set(paperId, rating);
  }

  /**
   * Get top N recommendations for user
   */
  getTopRecommendations(profile: UserProfile, n: number): RecommendationScore[] {
    const scores: RecommendationScore[] = [];

    for (const paper of this.paperDatabase.values()) {
      const score = this.calculateScore(paper, profile);
      scores.push(score);
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Return top N
    return scores.slice(0, n);
  }

  /**
   * Initialize paper database with real academic papers structure
   */
  private initializePaperDatabase(): void {
    const papers: Paper[] = [
      {
        paperId: 'ml-2024-001',
        title: 'Attention Mechanisms in Deep Learning',
        authors: ['Vaswani, A.', 'Shazeer, N.'],
        abstract: 'This paper presents novel attention mechanisms...',
        field: 'Machine Learning',
        year: 2024,
        citations: 156
      },
      {
        paperId: 'nlp-2023-045',
        title: 'Transformers for Natural Language Understanding',
        authors: ['Devlin, J.', 'Chang, M.'],
        abstract: 'We introduce BERT, a pre-trained transformer...',
        field: 'Natural Language Processing',
        year: 2023,
        citations: 2340
      },
      {
        paperId: 'cv-2024-012',
        title: 'Vision Transformers for Image Recognition',
        authors: ['Dosovitskiy, A.', 'Beyer, L.'],
        abstract: 'We propose Vision Transformer (ViT)...',
        field: 'Computer Vision',
        year: 2024,
        citations: 89
      },
      {
        paperId: 'ai-2023-089',
        title: 'Reinforcement Learning for Complex Control',
        authors: ['Silver, D.', 'Hassabis, D.'],
        abstract: 'This paper explores deep RL...',
        field: 'Artificial Intelligence',
        year: 2023,
        citations: 567
      },
      {
        paperId: 'dl-2024-023',
        title: 'Neural Architecture Search with RL',
        authors: ['Zoph, B.', 'Le, Q.'],
        abstract: 'We present neural architecture search...',
        field: 'Deep Learning',
        year: 2024,
        citations: 124
      }
    ];

    for (const paper of papers) {
      this.paperDatabase.set(paper.paperId, paper);
    }
  }

  /**
   * Initialize field similarities (domain knowledge)
   */
  private initializeFieldSimilarities(): void {
    const similarities: [string, string, number][] = [
      ['Machine Learning', 'Deep Learning', 0.9],
      ['Machine Learning', 'Natural Language Processing', 0.8],
      ['Machine Learning', 'Computer Vision', 0.8],
      ['Machine Learning', 'Artificial Intelligence', 0.9],
      ['Deep Learning', 'Natural Language Processing', 0.85],
      ['Deep Learning', 'Computer Vision', 0.85],
      ['Deep Learning', 'Artificial Intelligence', 0.85],
      ['Natural Language Processing', 'Artificial Intelligence', 0.7],
      ['Computer Vision', 'Artificial Intelligence', 0.7],
      ['Data Science', 'Machine Learning', 0.85],
      ['Data Science', 'Statistics', 0.8]
    ];

    for (const [field1, field2, similarity] of similarities) {
      if (!this.fieldSimilarity.has(field1)) {
        this.fieldSimilarity.set(field1, new Map());
      }
      this.fieldSimilarity.get(field1)!.set(field2, similarity);

      // Symmetric
      if (!this.fieldSimilarity.has(field2)) {
        this.fieldSimilarity.set(field2, new Map());
      }
      this.fieldSimilarity.get(field2)!.set(field1, similarity);
    }
  }

  /**
   * Get paper by ID
   */
  getPaper(paperId: string): Paper | undefined {
    return this.paperDatabase.get(paperId);
  }

  /**
   * Get all papers in field
   */
  getPapersInField(field: string): Paper[] {
    return Array.from(this.paperDatabase.values()).filter(p => p.field === field);
  }
}

/**
 * Factory function
 */
export function createRecommendationEngine(): RecommendationEngine {
  return new RecommendationEngine();
}
