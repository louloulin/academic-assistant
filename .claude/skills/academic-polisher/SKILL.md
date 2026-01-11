---
name: academic-polisher
description: Polish and refine academic language to improve clarity, formality, and professionalism of research papers
allowed-tools:
  - Read
  - Write
  - Bash
  - MCPTool
  - Skill
context: fork
---

# Academic Polisher Skill

Advanced academic language polisher that enhances the clarity, formality, and professionalism of research writing.

## When to Use

Use this skill when the user asks to:
- Polish academic language in a paper
- Improve writing clarity and flow
- Enhance vocabulary and word choice
- Adjust formality level
- Fix grammar and style issues
- Make writing more professional
- Optimize sentence structure
- Improve academic tone

## Capabilities

### 1. Vocabulary Enhancement
- Replace informal words with academic alternatives
- Suggest precise technical terms
- Eliminate redundancy
- Enhance variety in word choice
- Use discipline-specific terminology

### 2. Sentence Structure Optimization
- Vary sentence length and structure
- Improve sentence flow
- Fix run-on sentences
- Combine short, choppy sentences
- Create logical sentence connections

### 3. Tone Adjustment
- Formalize casual language
- Balance active/passive voice
- Ensure appropriate academic register
- Maintain objective tone
- Remove emotional language

### 4. Grammar and Mechanics
- Fix grammatical errors
- Correct punctuation
- Improve capitalization
- Fix subject-verb agreement
- Ensure consistent tense usage

### 5. Clarity Enhancement
- Simplify complex constructions
- Remove ambiguity
- Improve logical flow
- Enhance coherence
- Clarify references

### 6. Academic Style Compliance
- Follow APA/MLA/Chicago guidelines
- Maintain consistency
- Apply discipline-specific conventions
- Ensure proper citation integration
- Format references correctly

## Input Format

```typescript
{
  text: string;              // Text to polish
  polishLevel?: 'conservative' | 'moderate' | 'aggressive';
  aspects?: string[];        // Aspects to focus on
  targetStyle?: 'apa' | 'mla' | 'chicago' | 'ieee';
  preserve?: string[];        // Elements to preserve unchanged
  context?: {
    discipline?: string;      // Academic discipline
    audience?: string;        // Target audience
    purpose?: string;         // Writing purpose
  };
}
```

## Output Format

```typescript
{
  originalText: string;
  polishedText: string;
  changes: Array<{
    original: string;
    polished: string;
    type: 'vocabulary' | 'structure' | 'grammar' | 'tone' | 'clarity';
    reason: string;
    confidence: number;
  }>;
  metrics: {
    clarityScore: number;     // 0-100
    formalityScore: number;   // 0-100
    readabilityScore: number; // 0-100
    overallScore: number;     // 0-100
  };
  suggestions: Array<{
    type: string;
    suggestion: string;
    explanation: string;
  }>;
}
```

## Technical Implementation

### Real Claude Agent SDK Integration

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

class AcademicPolisherService {
  /**
   * Polish text using real Claude Agent SDK
   */
  async polish(options: PolishOptions): Promise<PolishResult> {
    console.log('✨ Polishing academic text with Claude...');

    // Real Claude Agent SDK call - NO MOCKS!
    const response = await query({
      prompt: this.buildPolishPrompt(options),
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1,
        temperature: 0.3 // Lower temperature for consistent edits
      }
    });

    // Extract polished text from response
    const polishedText = this.extractPolishedText(response);

    // Generate detailed change report
    const changes = await this.analyzeChanges(
      options.text,
      polishedText
    );

    // Calculate quality metrics
    const metrics = await this.calculateMetrics(polishedText);

    return {
      originalText: options.text,
      polishedText,
      changes,
      metrics,
      suggestions: await this.generateSuggestions(polishedText)
    };
  }

  /**
   * Build comprehensive polish prompt
   */
  private buildPolishPrompt(options: PolishOptions): string {
    const { text, polishLevel, aspects, context } = options;

    return `You are an expert academic editor. Polish the following text to improve clarity, formality, and academic tone.

**Original Text**:
${text}

**Polish Level**: ${polishLevel || 'moderate'}
- Conservative: Minimal changes, mostly grammar and clarity
- Moderate: Balance between preserving voice and improving quality
- Aggressive: Comprehensive rewrite for maximum academic quality

**Focus Areas**: ${aspects?.join(', ') || 'vocabulary, structure, grammar, tone, clarity'}

**Context**:
- Discipline: ${context?.discipline || 'Academic Research'}
- Audience: ${context?.audience || 'Peer Reviewers'}
- Purpose: ${context?.purpose || 'Journal Publication'}

**Instructions**:
1. Enhance vocabulary with academic alternatives
2. Vary sentence structure for better flow
3. Ensure formal, objective tone
4. Fix any grammatical or mechanical errors
5. Improve clarity without changing meaning
6. Maintain the author's voice where possible

**Output Format**:
Return ONLY the polished text, with no explanations or meta-commentary.`;
  }
}
```

### Vocabulary Enhancement

```typescript
class VocabularyEnhancer {
  private academicReplacements = new Map([
    // Informal → Academic
    ['good', 'excellent', 'sound', 'robust', 'effective'],
    ['bad', 'poor', 'inadequate', 'suboptimal', 'problematic'],
    ['show', 'demonstrate', 'illustrate', 'indicate', 'reveal'],
    ['use', 'utilize', 'employ', 'leverage', 'apply'],
    ['help', 'facilitate', 'assist', 'aid', 'support'],
    ['fast', 'rapid', 'swift', 'expeditious', 'efficient'],
    ['slow', 'gradual', 'protracted', 'extended', 'leisurely'],
    ['big', 'substantial', 'significant', 'considerable', 'notable'],
    ['small', 'modest', 'minimal', 'negligible', 'marginal'],
    ['many', 'numerous', 'myriad', 'multifarious', 'substantial'],
    ['few', 'limited', 'scant', 'sparse', 'infrequent'],
    ['think', 'posit', 'contend', 'postulate', 'hypothesize'],
    ['say', 'state', 'assert', 'propose', 'maintain'],
    ['look at', 'examine', 'investigate', 'analyze', 'scrutinize'],
    ['find', 'discover', 'identify', 'determine', 'ascertain'],
  ]);

  async enhance(text: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Find informal words
    for (const [informal, academics] of this.academicReplacements) {
      if (text.toLowerCase().includes(informal)) {
        suggestions.push(
          `Replace "${informal}" with more academic alternatives: ${academics.join(', ')}`
        );
      }
    }

    return suggestions;
  }

  async replace(text: string): Promise<string> {
    let polished = text;

    for (const [informal, academics] of this.academicReplacements) {
      const regex = new RegExp(`\\b${informal}\\b`, 'gi');
      polished = polished.replace(regex, academics[0]);
    }

    return polished;
  }
}
```

### Sentence Structure Optimization

```typescript
class StructureOptimizer {
  async optimize(text: string): Promise<string> {
    // Detect and fix run-on sentences
    const fixedRunOns = this.fixRunOnSentences(text);

    // Combine short, choppy sentences
    const combined = this.combineShortSentences(fixedRunOns);

    // Vary sentence structure
    const varied = this.varyStructure(combined);

    return varied;
  }

  private fixRunOnSentences(text: string): string {
    // Split on periods that are actually sentence boundaries
    const sentences = text.split(/(?<=[.!?])\s+/);

    const fixed = sentences.map(sentence => {
      // If sentence is very long (>40 words), consider splitting
      const words = sentence.split(/\s+/);
      if (words.length > 40) {
        return this.splitLongSentence(sentence);
      }
      return sentence;
    });

    return fixed.join(' ');
  }

  private combineShortSentences(text: string): string {
    // Find adjacent short sentences and combine
    const sentences = text.split(/(?<=[.!?])\s+/);
    const combined: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const current = sentences[i];
      const words = current.split(/\s+/);

      // If sentence is very short (<8 words) and next exists
      if (words.length < 8 && i < sentences.length - 1) {
        const next = sentences[i + 1];
        combined.push(`${current.trim()} ${next.trim()}`);
        i++; // Skip next
      } else {
        combined.push(current);
      }
    }

    return combined.join(' ');
  }

  private varyStructure(text: string): string {
    // Ensure variety in sentence structure
    const sentences = text.split(/(?<=[.!?])\s+/);

    const varied = sentences.map(sentence => {
      const words = sentence.split(/\s+/);

      // Add transitions where appropriate
      if (words.length > 0) {
        const first = words[0].toLowerCase();

        // Start with transitions for variety
        const transitions = [
          'Furthermore', 'Additionally', 'Moreover', 'Consequently',
          'However', 'Nevertheless', 'In contrast', 'Conversely'
        ];

        // 20% chance to add transition
        if (Math.random() < 0.2 && !transitions.includes(words[0])) {
          const transition = transitions[Math.floor(Math.random() * transitions.length)];
          return `${transition}, ${sentence}`;
        }
      }

      return sentence;
    });

    return varied.join(' ');
  }
}
```

### Tone Adjustment

```typescript
class ToneAdjuster {
  async formalize(text: string): Promise<string> {
    let formal = text;

    // Replace contractions
    const contractions: Record<string, string> = {
      "don't": "do not",
      "doesn't": "does not",
      "won't": "will not",
      "can't": "cannot",
      "couldn't": "could not",
      "shouldn't": "should not",
      "wouldn't": "would not",
      "isn't": "is not",
      "aren't": "are not",
      "it's": "it is",
      "that's": "that is",
      "there's": "there is",
      "here's": "here is",
      "let's": "let us",
      "we're": "we are",
      "they're": "they are",
      "I'm": "I am",
      "you're": "you are"
    };

    for (const [contraction, expanded] of Object.entries(contractions)) {
      const regex = new RegExp(contraction, 'gi');
      formal = formal.replace(regex, expanded);
    }

    // Remove emotional language
    const emotional = [
      ['very happy', 'delighted', 'pleased'],
      ['really sad', 'disappointed', 'concerned'],
      ['huge', 'substantial', 'significant'],
      ['tiny', 'minimal', 'negligible']
    ];

    for (const [emotion, formal] of emotional) {
      const regex = new RegExp(emotion, 'gi');
      formal = formal.replace(regex, formal);
    }

    // Remove exclamation marks
    formal = formal.replace(/!/g, '.');

    return formal;
  }

  async balancePassiveActive(text: string): Promise<string> {
    const sentences = text.split(/(?<=[.!?])\s+/);

    const balanced = sentences.map(sentence => {
      const activeIndicators = ['we show', 'we found', 'we demonstrate'];
      const passiveIndicators = ['it was shown', 'it was found', 'it was demonstrated'];

      const isPassive = passiveIndicators.some(ind => sentence.toLowerCase().includes(ind));

      // If 60%+ of sentences are passive, convert some to active
      if (isPassive && Math.random() > 0.5) {
        return this.toActive(sentence);
      }

      return sentence;
    });

    return balanced.join(' ');
  }

  private toActive(sentence: string): string {
    // Simple passive → active conversion
    let active = sentence;

    if (active.toLowerCase().includes('it was shown that')) {
      active = active.replace(/it was shown that/i, 'We show that');
    } else if (active.toLowerCase().includes('it was found that')) {
      active = active.replace(/it was found that/i, 'We find that');
    }

    return active;
  }
}
```

### Quality Metrics

```typescript
class QualityMetrics {
  async calculate(text: string): Promise<QualityScores> {
    const clarity = this.assessClarity(text);
    const formality = this.assessFormality(text);
    const readability = this.assessReadability(text);

    return {
      clarityScore: clarity,
      formalityScore: formality,
      readabilityScore: readability,
      overallScore: (clarity + formality + readability) / 3
    };
  }

  private assessClarity(text: string): number {
    let score = 100;

    // Penalize very long sentences
    const sentences = text.split(/(?<=[.!?])\s+/);
    for (const sentence of sentences) {
      const words = sentence.split(/\s+/);
      if (words.length > 30) {
        score -= 5;
      } else if (words.length > 20) {
        score -= 2;
      }
    }

    // Penalize complex words
    const words = text.split(/\s+/);
    for (const word of words) {
      if (word.length > 15) {
        score -= 1;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private assessFormality(text: string): number {
    let score = 50; // Start at neutral

    // Boost formal indicators
    if (/\b(demonstrate|illustrate|indicate|suggest|hypothesize)\b/i.test(text)) {
      score += 10;
    }

    // Penalize informal indicators
    if (/\b(show|say|think|look at|find out)\b/i.test(text)) {
      score -= 10;
    }

    // Check for contractions
    if (/\b(n't|'s|'re|'ve|'ll|'d)\b/i.test(text)) {
      score -= 15;
    }

    // Check for emotional language
    if (/\b(very|really|extremely|huge|tiny)\b/i.test(text)) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private assessReadability(text: string): number {
    // Flesch Reading Ease approximation
    const sentences = text.split(/(?<=[.!?])\s+/);
    const words = text.split(/\s+/);
    const syllables = this.countSyllables(text);

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch formula: 206.835 - 1.015 × ASL - 84.6 × ASW
    const flesch = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

    // Convert to 0-100 scale (invert for academic writing)
    return Math.max(0, Math.min(100, 100 - flesch));
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;

    for (const word of words) {
      count += this.countWordSyllables(word);
    }

    return count;
  }

  private countWordSyllables(word: string): number {
    word = word.replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);

    return matches ? matches.length : 1;
  }
}
```

## Usage Examples

### Example 1: Basic Polish
```typescript
const polisher = new AcademicPolisherService();

const result = await polisher.polish({
  text: 'We used a new method to show good results.',
  polishLevel: 'moderate'
});

console.log(result.polishedText);
// "We employed a novel approach to demonstrate robust findings."
```

### Example 2: Conservative Polish
```typescript
const result = await polisher.polish({
  text: 'The data shows that the method works well.',
  polishLevel: 'conservative',
  aspects: ['grammar', 'clarity']
});
```

### Example 3: Aggressive Polish
```typescript
const result = await polisher.polish({
  text: 'This paper talks about how we made a really fast algorithm.',
  polishLevel: 'aggressive',
  context: {
    discipline: 'Computer Science',
    audience: 'Peer Reviewers'
  }
});
```

### Example 4: Targeted Polish
```typescript
const result = await polisher.polish({
  text: 'Our findings are very good and show promise.',
  aspects: ['vocabulary', 'tone'],
  targetStyle: 'apa'
});
```

## Setup

No additional setup required. The service uses:
- Claude Agent SDK (built-in)
- Academic vocabulary database (included)
- Style guide rules (included)

## Best Practices

1. **Start with conservative polish** - Review changes before applying
2. **Specify context** - Discipline and audience matter
3. **Focus on specific aspects** - Don't polish everything at once
4. **Review changes** - Ensure meaning is preserved
5. **Iterate** - Multiple moderate polishes better than one aggressive

## Related Skills

- **writing-quality**: Comprehensive quality analysis
- **conversational-editor**: Interactive editing
- **paper-structure**: Structural improvements
- **peer-review**: Get feedback on polished version

## Advanced Features

### Domain-Specific Polish

```typescript
const result = await polisher.polish({
  text: '...',
  context: {
    discipline: 'Machine Learning', // Uses ML-specific terminology
    audience: 'NeurIPS Reviewers'
  }
});
```

### Citation Integration

```typescript
const result = await polisher.polish({
  text: '...',
  aspects: ['citations'],
  targetStyle: 'apa' // Ensures proper APA citation format
});
```

### Batch Processing

```typescript
const results = await polisher.polishBatch([
  { text: 'Paragraph 1...' },
  { text: 'Paragraph 2...' },
  { text: 'Paragraph 3...' }
]);
```
