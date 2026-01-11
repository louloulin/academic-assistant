---
name: plagiarism-checker
description: Academic integrity checker that detects potential plagiarism, missing citations, and suggests proper paraphrasing
allowed-tools:
  - WebSearch
  - WebFetch
  - Read
  - Write
  - Bash
  - MCPTool
context: fork
---

# Plagiarism Checker Skill

Advanced academic integrity checker that helps researchers avoid plagiarism by detecting similarities with existing literature, identifying missing citations, and suggesting proper paraphrasing techniques.

## When to Use

Use this skill when the user asks to:
- Check a paper for potential plagiarism
- Verify proper citation practices
- Detect missing references
- Improve paraphrasing of quoted text
- Ensure originality before submission
- Compare text against online literature
- Generate proper citations for borrowed ideas

## Capabilities

### 1. Similarity Detection
- Compare text against online academic databases
- Detect exact phrase matches
- Identify near-duplicate content
- Calculate similarity scores (0-100%)
- Highlight problematic sections
- Context-aware matching (distinguish quotes, common phrases)

### 2. Citation Analysis
- Detect uncited claims and ideas
- Verify citation completeness
- Check quotation formatting
- Identify missing references
- Suggest proper citation styles
- Validate in-text citations

### 3. Paraphrasing Assistance
- Suggest proper paraphrasing techniques
- Generate alternative phrasings
- Maintain original meaning
- Preserve citation requirements
- Improve language variety

### 4. Originality Assessment
- Calculate originality score (0-100%)
- Identify original contributions
- Flag derivative content
- Assess attribution quality
- Generate improvement suggestions

### 5. Source Verification
- Match content to potential sources
- Retrieve source URLs
- Verify source credibility
- Check publication details
- Suggest proper citation format

## Input Format

```typescript
{
  text: string;                    // Text to check
  checkType?: 'full' | 'quick' | 'citations-only';
  databases?: string[];            // Databases to search
  excludeSelfCited?: boolean;      // Exclude self-citations
  citationStyle?: 'apa' | 'mla' | 'chicago' | 'ieee';
  similarityThreshold?: number;    // Flag similarities above this (0-100)
  includeQuotes?: boolean;         // Include properly quoted text
  contextLines?: number;           // Lines of context around matches
}
```

## Output Format

```typescript
{
  originalityScore: number;        // 0-100 overall originality
  similarityScore: number;         // 0-100 overall similarity

  matches: Array<{
    text: string;                  // Matching text segment
    startIndex: number;
    endIndex: number;
    similarityPercent: number;     // 0-100

    source?: {
      url: string;
      title: string;
      authors: string[];
      year: number;
      publication: string;
      credibility: 'high' | 'medium' | 'low';
    };

    matchType: 'exact' | 'near-exact' | 'structural' | 'paraphrase';
    severity: 'high' | 'medium' | 'low';
    isProperlyCited: boolean;
    isQuoted: boolean;
    suggestions: string[];
  }>;

  citationIssues: Array<{
    type: 'missing-citation' | 'incorrect-format' | 'missing-reference';
    text: string;
    location: { start: number; end: number };
    suggestion: string;
  }>;

  paraphrasingSuggestions: Array<{
    originalText: string;
    suggestedParaphrase: string;
    reason: string;
    preservesMeaning: boolean;
  }>;

  metrics: {
    totalWords: number;
    originalWords: number;
    similarSegments: number;
    properlyCitedSegments: number;
    uncitedBorrowedIdeas: number;
  };

  recommendations: string[];
  overallAssessment: string;
}
```

## Technical Implementation

### 1. Real Claude Agent SDK Integration

This skill uses the **real Claude Agent SDK** for intelligent analysis:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

class PlagiarismCheckerService {
  async checkText(text: string): Promise<PlagiarismReport> {
    // Step 1: Extract key phrases and sentences
    const phrases = await this.extractKeyPhrases(text);

    // Step 2: Search for matches online
    const matches = await this.searchForMatches(phrases);

    // Step 3: Use Claude to assess plagiarism risk
    const analysis = await this.analyzeWithClaude(text, matches);

    // Step 4: Check citations
    const citationIssues = await this.checkCitations(text);

    // Step 5: Generate paraphrasing suggestions
    const suggestions = await this.generateParaphrasingSuggestions(text);

    return {
      originalityScore: analysis.originalityScore,
      similarityScore: analysis.similarityScore,
      matches: analysis.matches,
      citationIssues,
      paraphrasingSuggestions: suggestions,
      metrics: this.calculateMetrics(text, matches),
      recommendations: this.generateRecommendations(analysis),
      overallAssessment: analysis.assessment
    };
  }

  private async analyzeWithClaude(text: string, matches: Match[]): Promise<Analysis> {
    // Real Claude Agent SDK call - no mocks!
    const response = await query({
      prompt: `Analyze this academic text for plagiarism risk based on the found matches.

Text to analyze:
${text.substring(0, 2000)}

Found matches:
${JSON.stringify(matches, null, 2)}

Provide:
1. Overall originality score (0-100)
2. Overall similarity score (0-100)
3. Severity assessment for each match
4. Overall assessment of academic integrity

Return JSON with:
{
  "originalityScore": 0-100,
  "similarityScore": 0-100,
  "matches": [analysis for each match],
  "assessment": "overall assessment text"
}`,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1,
        settingSources: ['user', 'project']
      }
    });

    return this.parseAnalysisResponse(response);
  }
}
```

### 2. Similarity Detection

```typescript
class SimilarityDetector {
  /**
   * Extract key phrases to search for
   */
  extractKeyPhrases(text: string): string[] {
    const sentences = text.split(/[.!?]+/);
    const phrases: string[] = [];

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      if (words.length >= 5 && words.length <= 20) {
        phrases.push(sentence.trim());
      }
    }

    return phrases;
  }

  /**
   * Search for matches using web search
   */
  async searchForMatches(phrases: string[]): Promise<Match[]> {
    const matches: Match[] = [];

    for (const phrase of phrases.slice(0, 10)) { // Limit to 10 searches
      try {
        // Use WebSearch tool to find potential matches
        const searchResults = await this.webSearch(`"${phrase}"`);

        for (const result of searchResults) {
          const similarity = this.calculateSimilarity(phrase, result.snippet);

          if (similarity > 0.7) { // 70% threshold
            matches.push({
              text: phrase,
              similarityPercent: similarity * 100,
              source: {
                url: result.url,
                title: result.title,
                credibility: this.assessCredibility(result)
              },
              matchType: similarity > 0.95 ? 'exact' : 'near-exact',
              severity: this.assessSeverity(similarity, phrase),
              isProperlyCited: false, // Will check later
              isQuoted: this.isQuoted(phrase),
              suggestions: []
            });
          }
        }
      } catch (error) {
        console.error(`Search failed for phrase: ${phrase}`, error);
      }
    }

    return matches;
  }

  /**
   * Calculate text similarity using Jaccard similarity
   */
  calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}
```

### 3. Citation Checking

```typescript
class CitationChecker {
  /**
   * Detect citation issues
   */
  async checkCitations(text: string): Promise<CitationIssue[]> {
    const issues: CitationIssue[] = [];

    // Detect uncited claims
    const uncitedClaims = await this.detectUncitedClaims(text);
    issues.push(...uncitedClaims);

    // Detect incorrect formatting
    const formatIssues = this.detectFormatIssues(text);
    issues.push(...formatIssues);

    // Detect missing references
    const missingRefs = this.detectMissingReferences(text);
    issues.push(...missingRefs);

    return issues;
  }

  /**
   * Detect claims that should be cited but aren't
   */
  private async detectUncitedClaims(text: string): Promise<CitationIssue[]> {
    // Use Claude to identify uncited claims
    const response = await query({
      prompt: `Identify sentences in this academic text that make factual claims, reference prior work, or use borrowed ideas but lack proper citations.

Text:
${text}

Return JSON array of:
{
  "text": "sentence text",
  "reason": "why this needs a citation",
  "suggestion": "suggested citation format"
}`,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1
      }
    });

    return this.parseCitationIssues(response);
  }
}
```

### 4. Paraphrasing Suggestions

```typescript
class ParaphrasingAssistant {
  /**
   * Generate paraphrasing suggestions for problematic segments
   */
  async generateSuggestions(matches: Match[]): Promise<ParaphraseSuggestion[]> {
    const suggestions: ParaphraseSuggestion[] = [];

    for (const match of matches.filter(m => m.severity === 'high' || m.severity === 'medium')) {
      try {
        const response = await query({
          prompt: `Suggest a proper academic paraphrase for this text that:

Original text: ${match.text}

Requirements:
1. Convey the same meaning
2. Use different sentence structure
3. Use different vocabulary where possible
4. Maintain academic tone
5. Add proper citation if needed

Return JSON:
{
  "suggestedParaphrase": "paraphrased text",
  "reason": "explanation of changes",
  "preservesMeaning": true
}`,
          options: {
            model: 'claude-sonnet-4-5',
            maxTurns: 1
          }
        });

        suggestions.push({
          originalText: match.text,
          ...this.parseSuggestion(response)
        });
      } catch (error) {
        console.error('Failed to generate suggestion', error);
      }
    }

    return suggestions;
  }
}
```

## Usage Examples

### Example 1: Basic Plagiarism Check
```typescript
const checker = new PlagiarismCheckerService();

const result = await checker.check({
  text: 'Machine learning has revolutionized the field of natural language processing...'
});

console.log(`Originality Score: ${result.originalityScore}%`);
console.log(`Similarity Score: ${result.similarityScore}%`);
console.log(`Found ${result.matches.length} potential matches`);

result.matches.forEach(match => {
  console.log(`⚠ ${match.severity.toUpperCase()}: "${match.text.substring(0, 50)}..."`);
  console.log(`   Similarity: ${match.similarityPercent.toFixed(1)}%`);
  if (match.source) {
    console.log(`   Source: ${match.source.url}`);
  }
});
```

### Example 2: Citation-Only Check
```typescript
const result = await checker.check({
  text: paperText,
  checkType: 'citations-only',
  citationStyle: 'apa'
});

console.log(`Found ${result.citationIssues.length} citation issues`);

result.citationIssues.forEach(issue => {
  console.log(`${issue.type}: ${issue.text}`);
  console.log(`Suggestion: ${issue.suggestion}`);
});
```

### Example 3: Generate Paraphrasing Suggestions
```typescript
const result = await checker.check({
  text: problematicText
});

result.paraphrasingSuggestions.forEach(suggestion => {
  console.log(`Original: ${suggestion.originalText}`);
  console.log(`Suggested: ${suggestion.suggestedParaphrase}`);
  console.log(`Reason: ${suggestion.reason}\n`);
});
```

## Best Practices

1. **Run Before Submission**: Always check before submitting to journals or conferences
2. **Check Iteratively**: Check after major revisions or additions
3. **Review High Severity Matches**: Carefully review all high/medium severity matches
4. **Cite Properly**: When in doubt, add a citation
5. **Paraphrase Effectively**: Use suggested paraphrases to improve originality
6. **Keep Quotes Minimal**: Use direct quotes sparingly and always cite
7. **Use Multiple Sources**: Synthesize information from multiple sources

## Limitations

- **Database Coverage**: Limited to publicly available web content
- **Access Paywalls**: Cannot check behind journal paywalls
- **Translation**: Better performance for English text
- **Common Phrases**: May flag standard academic phrases
- **False Positives**: Properly cited content may be flagged
- **API Rate Limits**: Web searches may be rate-limited

## Related Skills

- **literature-search**: Find sources for proper citation
- **citation-manager**: Format citations correctly
- **writing-quality**: Improve overall writing quality
- **conversational-editor**: Integrate checking into writing workflow
- **academic-polisher**: Enhance language quality after fixing issues

## Advanced Features

### 1. Batch Checking
```typescript
const results = await checker.checkBatch({
  texts: [paper1, paper2, paper3],
  referencePapers: [previousWork]
});
```

### 2. Self-Plagiarism Detection
```typescript
const result = await checker.checkForSelfPlagiarism({
  currentText: newPaper,
  previousWorks: authorPastPapers
});
```

### 3. Citation Graph Integration
```typescript
const result = await checker.checkWithCitationGraph({
  text: paper,
  citationGraph: paperCitationGraph
});
```

### 4. Real-time Checking
```typescript
// Check as user types
const realtimeChecker = new RealtimePlagiarismChecker();
realtimeChecker.on('issue-detected', (issue) => {
  console.log('Potential issue:', issue);
});
```

### 5. Plagiarism Report Generation
```typescript
const report = await checker.generateReport({
  checkResult: result,
  format: 'pdf',
  includeSuggestions: true
});
```

## Setup and Configuration

### Environment Variables

```bash
# Optional: Custom search API
export SEARCH_API_KEY="..."

# Optional: Academic database access
export ACADEMIC_API_KEY="..."
```

### Configuration

```typescript
const checker = new PlagiarismCheckerService({
  similarityThreshold: 70,  // Flag content above 70% similarity
  maxSearches: 10,         // Maximum web searches per check
  includeQuotes: false,    // Exclude properly quoted text
  databases: ['arxiv', 'scholar', 'pubmed']
});
```
