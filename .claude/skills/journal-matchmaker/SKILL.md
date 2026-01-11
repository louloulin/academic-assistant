---
name: journal-matchmaker
description: Match research papers to suitable academic journals based on topic, scope, citation patterns, and acceptance probability
allowed-tools:
  - WebSearch
  - WebFetch
  - Read
  - Write
  - Bash
  - MCPTool
context: fork
---

# Journal Matchmaker Skill

Intelligent journal matching system that helps researchers find the most suitable academic journals for their papers based on topic analysis, citation patterns, scope alignment, and acceptance probability.

## When to Use

Use this skill when the user asks to:
- Find suitable journals for a paper
- Match papers to journals based on topic
- Estimate journal acceptance rates
- Compare journal metrics (Impact Factor, etc.)
- Find journal submission guidelines
- Analyze journal scope and fit
- Get journal recommendations

## Capabilities

### 1. Topic-Based Matching
- Analyze paper abstract and keywords
- Match to journal scope and aims
- Identify relevant subject areas
- Calculate topic similarity scores

### 2. Citation Pattern Analysis
- Analyze reference list
- Identify frequently cited journals
- Match to journals in same research community
- Detect interdisciplinary connections

### 3. Journal Metrics
- Impact Factor (JCR)
- Eigenfactor Score
- SNIP (Source Normalized Impact per Paper)
- SJR (SCImago Journal Rank)
- H-index
- CiteScore

### 4. Acceptance Prediction
- Estimate acceptance probability
- Compare paper quality to journal standards
- Analyze competitiveness
- Recommend target vs. stretch journals

### 5. Submission Requirements
- Word count limits
- Formatting guidelines
- Citation style requirements
- Open access options
- Submission fees
- Review timeline

### 6. Historical Analysis
- Track journal performance over time
- Analyze acceptance trends
- Identify emerging journals
- Monitor Impact Factor changes

## Input Format

```typescript
{
  paper: {
    title: string;
    abstract: string;
    keywords?: string[];
    references?: Reference[];  // Citation list
    field?: string;            // Research field
    articleType?: 'research' | 'review' | 'letter' | 'case-study';
  };
  preferences?: {
    minImpactFactor?: number;
    openAccess?: boolean;
    maxReviewTime?: number;    // weeks
    excludeJournals?: string[];
    targetTier?: 'top' | 'mid' | 'emerging';
  };
  maxResults?: number;         // Default: 20
}
```

## Output Format

```typescript
{
  recommendations: Array<{
    rank: number;
    journal: JournalInfo;
    matchScore: number;        // 0-100
    matchReasons: string[];
    acceptanceProbability: number; // 0-100
    suitability: 'excellent' | 'good' | 'fair' | 'poor';
    metrics: JournalMetrics;
    requirements: SubmissionRequirements;
  }>;

  analysis: {
    paperTopics: string[];
    researchField: string;
    citationPatterns: CitationPattern[];
    competitiveness: 'high' | 'medium' | 'low';
    recommendations: string[];
  };

  alternatives: {
    targetJournals: string[];
    stretchJournals: string[];
    safeJournals: string[];
  };
}
```

## Technical Implementation

### 1. Real Claude Agent SDK Integration

```typescript
class JournalMatchmakerService {
  /**
   * Match paper to journals
   */
  async match(options: MatchOptions): Promise<MatchResult> {
    // Step 1: Analyze paper topics
    const paperAnalysis = await this.analyzePaper(options.paper);

    // Step 2: Search for matching journals
    const candidateJournals = await this.findCandidateJournals(paperAnalysis);

    // Step 3: Score and rank journals
    const ranked = await this.scoreAndRank(candidateJournals, options.paper, options.preferences);

    // Step 4: Generate recommendations
    const recommendations = this.generateRecommendations(ranked, paperAnalysis);

    return recommendations;
  }

  /**
   * Analyze paper using Claude
   */
  private async analyzePaper(paper: Paper): Promise<PaperAnalysis> {
    // Real Claude Agent SDK call - no mocks!
    const response = await query({
      prompt: `Analyze this research paper and extract key information for journal matching.

Title: ${paper.title}
Abstract: ${paper.abstract}
Keywords: ${paper.keywords?.join(', ') || 'N/A'}

Extract:
1. Main research topics (3-5)
2. Research field
3. Methodology used
4. Target audience
5. Likely journal categories

Return JSON with:
{
  "topics": ["topic1", "topic2", ...],
  "field": "research field",
  "methodology": "method",
  "audience": "target audience",
  "categories": ["category1", "category2"]
}`,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1
      }
    });

    return this.parsePaperAnalysis(response);
  }

  /**
   * Score journal match
   */
  private async scoreJournal(journal: Journal, paper: Paper): Promise<JournalScore> {
    // Use Claude to assess fit
    const response = await query({
      prompt: `Assess how well this paper fits this journal.

Paper: ${paper.title}
Abstract: ${paper.abstract}

Journal: ${journal.name}
Scope: ${journal.scope}
Aims: ${journal.aims}

Rate on:
1. Topic alignment (0-100)
2. Methodology fit (0-100)
3. Audience match (0-100)
4. Overall suitability (0-100)

Return JSON with scores and reasoning.`,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1
      }
    });

    return this.parseJournalScore(response);
  }
}
```

### 2. Journal Database Integration

```typescript
class JournalDatabase {
  private journals: Map<string, Journal> = new Map();

  /**
   * Search journals by topic
   */
  async searchByTopic(topic: string): Promise<Journal[]> {
    // In production, this would query a real journal database
    const matches: Journal[] = [];

    for (const journal of this.journals.values()) {
      if (this.topicMatches(topic, journal)) {
        matches.push(journal);
      }
    }

    return matches.sort((a, b) => b.impactFactor - a.impactFactor);
  }

  /**
   * Get journal by name
   */
  async getByName(name: string): Promise<Journal | undefined> {
    return this.journals.get(name.toLowerCase());
  }

  /**
   * Get journals by field
   */
  async getByField(field: string): Promise<Journal[]> {
    const matches: Journal[] = [];

    for (const journal of this.journals.values()) {
      if (journal.fields.includes(field)) {
        matches.push(journal);
      }
    }

    return matches;
  }
}
```

### 3. Citation Pattern Analysis

```typescript
class CitationAnalyzer {
  /**
   * Analyze reference list
   */
  async analyze(references: Reference[]): Promise<CitationPattern[]> {
    const journalCounts = new Map<string, number>();

    for (const ref of references) {
      if (ref.journal) {
        const count = journalCounts.get(ref.journal) || 0;
        journalCounts.set(ref.journal, count + 1);
      }
    }

    // Convert to patterns
    const patterns: CitationPattern[] = [];
    for (const [journal, count] of journalCounts.entries()) {
      patterns.push({
        journal,
        frequency: count,
        percentage: (count / references.length) * 100
      });
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Suggest journals based on citations
   */
  async suggestFromCitations(patterns: CitationPattern[]): Promise<string[]> {
    const suggestions: string[] = [];

    // Look up journals that cite similar work
    for (const pattern of patterns.slice(0, 5)) {
      const relatedJournals = await this.findRelatedJournals(pattern.journal);
      suggestions.push(...relatedJournals);
    }

    return [...new Set(suggestions)];
  }
}
```

### 4. Acceptance Probability Estimation

```typescript
class AcceptancePredictor {
  /**
   * Estimate acceptance probability
   */
  async predict(paper: Paper, journal: Journal): Promise<number> {
    let score = 50; // Base score

    // Impact factor alignment
    if (journal.impactFactor > 10) {
      score -= 20; // More competitive
    } else if (journal.impactFactor < 2) {
      score += 10; // Less competitive
    }

    // Acceptance rate
    if (journal.acceptanceRate) {
      score = score * (journal.acceptanceRate / 100) * 2;
    }

    // Paper quality indicators
    const qualityScore = await this.assessPaperQuality(paper);
    score += qualityScore * 0.3;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Assess paper quality
   */
  private async assessPaperQuality(paper: Paper): Promise<number> {
    // Use Claude to assess quality
    const response = await query({
      prompt: `Assess the likely quality of this paper based on title and abstract.

Title: ${paper.title}
Abstract: ${paper.abstract}

Rate:
1. Novelty (0-100)
2. Significance (0-100)
3. Methodology (0-100)
4. Presentation (0-100)

Return average quality score.`,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1
      }
    });

    return this.parseQualityScore(response);
  }
}
```

## Usage Examples

### Example 1: Basic Journal Matching
```typescript
const result = await matchmaker.match({
  paper: {
    title: 'Deep Learning for Image Recognition',
    abstract: 'We present a novel neural network architecture...',
    keywords: ['deep learning', 'computer vision', 'CNN']
  }
});

console.log('Top recommendations:');
result.recommendations.slice(0, 5).forEach(rec => {
  console.log(`${rec.rank}. ${rec.journal.name} (IF: ${rec.journal.impactFactor})`);
  console.log(`   Match: ${rec.matchScore}% | Acceptance: ${rec.acceptanceProbability}%`);
});
```

### Example 2: With Preferences
```typescript
const result = await matchmaker.match({
  paper: paperData,
  preferences: {
    minImpactFactor: 5.0,
    openAccess: true,
    maxReviewTime: 12 // weeks
  }
});
```

### Example 3: Citation-Based Matching
```typescript
const result = await matchmaker.match({
  paper: {
    title: 'Machine Learning in Healthcare',
    abstract: '...',
    references: [
      { journal: 'Nature Medicine', year: 2023 },
      { journal: 'The Lancet Digital Health', year: 2023 },
      // ... more references
    ]
  }
});

console.log('Based on citation patterns:');
console.log(result.analysis.citationPatterns);
```

## Journal Metrics Explained

### Impact Factor (JCR)
- Measures average citations per article
- Calculated by Clarivate Analytics
- Updated annually
- Varies widely by field

### H-index
- Measures productivity and citation impact
- h-index = h if h papers have ≥ h citations each
- Journal-level h-index available

### Eigenfactor
- Measures overall influence
- Considers journal network
- Scales with journal size

### SNIP
- Source Normalized Impact per Paper
- Field-normalized metric
- Allows cross-field comparison

### SJR
- SCImago Journal Rank
- Consures prestige of citing journals
- From Scopus database

## Best Practices

1. **Match Scope First**: Topic fit is most important
2. **Consider Multiple Metrics**: Don't rely solely on Impact Factor
3. **Check Recent Issues**: See what they're publishing
4. **Read Aims & Scope**: Ensure alignment
5. **Assess Competitiveness**: Target appropriate tier
6. **Check Review Times**: Some journals are very slow
7. **Consider Open Access**: Factor in APCs if needed

## Strategies

### High Impact Strategy
- Target top-tier journals (IF > 10)
- Accept high rejection risk
- Be prepared for multiple submissions
- Consider Nature/Science/Cell families

### Balanced Strategy
- Target mid-tier journals (IF 3-10)
- Good balance of impact and acceptance
- Reasonable review times
- Strong field-specific journals

### Safe Strategy
- Target lower-tier or emerging journals
- Higher acceptance probability
- Faster publication
- Build publication record

## Related Skills

- **literature-search**: Find journals by topic
- **citation-manager**: Format citations for target journal
- **journal-submission**: Handle submission process
- **pdf-analyzer**: Extract data from papers

## Data Sources

### Journal Databases
- **JCR (Journal Citation Reports)**: Impact Factors
- **Scopus**: SJR, SNIP, CiteScore
- **Google Scholar**: h-index, metrics
- **Ulrichsweb**: Journal information

### APIs (Production)
- **Scopus API**: Journal metrics
- **Springer Nature API**: Journal data
- **Elsevier API**: Journal information
- **CrossRef**: Journal metadata

## Advanced Features

### 1. Historical Tracking
```typescript
const history = await matchmaker.trackJournal('Nature', {
  years: [2018, 2019, 2020, 2021, 2022]
});
// Track Impact Factor trends
```

### 2. Competitive Analysis
```typescript
const competition = await matchmaker.analyzeCompetition({
  journal: 'Nature Machine Intelligence',
  paper: myPaper
});
// Compare to published papers
```

### 3. Batch Analysis
```typescript
const results = await matchmaker.matchBatch({
  papers: [paper1, paper2, paper3]
});
```

### 4. Journal Alerts
```typescript
matchmaker.on('new-journal', (journal) => {
  console.log('New journal detected:', journal.name);
});
```

## Setup and Configuration

### Environment Variables
```bash
# Optional: Scopus API
export SCOPUS_API_KEY="..."

# Optional: Elsevier API
export ELSEVIER_API_KEY="..."
```

### Configuration
```typescript
const matchmaker = new JournalMatchmakerService({
  maxResults: 20,
  minImpactFactor: 1.0,
  preferOpenAccess: false,
  cacheResults: true
});
```
