---
name: creative-expander
description: Expand and develop ideas in academic writing when stuck, providing creative extensions and inspiration
allowed-tools:
  - WebSearch
  - Read
  - Write
  - Bash
  - MCPTool
  - Skill
context: fork
---

# Creative Expander Skill

Advanced creative writing assistant that helps researchers expand their ideas when they're stuck, providing intelligent extensions, examples, and inspiration while maintaining academic rigor.

## When to Use

Use this skill when the user asks to:
- Expand a short paragraph into a detailed section
- Add more evidence or examples to support claims
- Develop an idea further
- Overcome writer's block
- Generate alternative perspectives
- Add bridging paragraphs between sections
- Elaborate on methodology
- Enhance discussion sections
- Extend conclusions with implications
- Add nuance to arguments

## Capabilities

### 1. Paragraph Expansion
- Expand brief statements into comprehensive paragraphs
- Add relevant details and explanations
- Maintain coherence and flow
- Preserve original meaning
- Adjust expansion level (conservative to extensive)

### 2. Evidence Enhancement
- Suggest supporting evidence
- Add relevant examples
- Include case studies
- Reference empirical data
- Cite relevant literature
- Provide concrete illustrations

### 3. Perspective Diversification
- Offer alternative viewpoints
- Present counter-arguments
- Explore implications
- Consider limitations
- Address potential objections
- Synthesize multiple perspectives

### 4. Methodology Elaboration
- Expand method descriptions
- Add implementation details
- Explain rationale for choices
- Discuss alternative methods
- Justify design decisions
- Provide step-by-step breakdowns

### 5. Bridging and Transitions
- Create smooth transitions between sections
- Connect ideas logically
- Build coherent arguments
- Maintain narrative flow
- Link paragraphs effectively
- Establish thematic continuity

### 6. Discussion Enhancement
- Extend interpretation of results
- Explore broader implications
- Connect to existing literature
- Suggest future directions
- Discuss practical applications
- Relate to theoretical frameworks

### 7. Conclusion Strengthening
- Expand key takeaways
- Highlight contributions
- Emphasize significance
- Discuss limitations and future work
- Connect back to research questions
- Provide lasting impact statements

## Input Format

```typescript
{
  text: string;                    // Text to expand
  expansionType?: 'paragraph' | 'evidence' | 'perspective' | 'methodology' | 'bridge' | 'discussion' | 'conclusion';
  expansionLevel?: 'conservative' | 'moderate' | 'extensive';
  targetLength?: number;           // Target word count
  preserveStyle?: boolean;         // Keep original writing style
  includeCitations?: boolean;      // Add placeholder citations
  context?: {
    previousSection?: string;      // Preceding content for context
    nextSection?: string;          // Following content for context
    researchField?: string;        // Field for domain-specific expansion
    paperType?: 'research' | 'review' | 'conference' | 'thesis';
  };
}
```

## Output Format

```typescript
{
  originalText: string;
  expandedText: string;
  expansionType: string;
  expansionLevel: string;

  additions: Array<{
    type: 'evidence' | 'example' | 'clarification' | 'transition' | 'implication';
    content: string;
    location: 'beginning' | 'middle' | 'end' | 'throughout';
  }>;

  metrics: {
    originalLength: number;
    expandedLength: number;
    expansionRatio: number;        // e.g., 2.5x
    newSentences: number;
    newIdeas: number;
  };

  suggestions: Array<{
    type: string;
    description: string;
    suggestion: string;
  }>;

  quality: {
    coherence: number;             // 0-100
    relevance: number;             // 0-100
    academicTone: number;          // 0-100
  };
}
```

## Technical Implementation

### 1. Real Claude Agent SDK Integration

```typescript
class CreativeExpanderService {
  /**
   * Expand text using Claude Agent SDK
   */
  async expand(options: ExpansionOptions): Promise<ExpansionResult> {
    console.log('✨ Expanding text...');

    // Use Claude for intelligent expansion
    const expansionPrompt = this.buildExpansionPrompt(options);

    // Real Claude Agent SDK call - no mocks!
    const response = await query({
      prompt: expansionPrompt,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1,
        settingSources: ['user', 'project'],
        allowedTools: ['Skill', 'Read', 'Write', 'WebSearch']
      }
    });

    const expandedText = this.extractResponse(response);

    // Analyze the expansion
    const additions = this.analyzeAdditions(options.text, expandedText);
    const metrics = this.calculateMetrics(options.text, expandedText);
    const quality = this.assessQuality(expandedText);
    const suggestions = this.generateSuggestions(expandedText);

    return {
      originalText: options.text,
      expandedText,
      expansionType: options.expansionType || 'paragraph',
      expansionLevel: options.expansionLevel || 'moderate',
      additions,
      metrics,
      suggestions,
      quality
    };
  }

  /**
   * Build expansion prompt
   */
  private buildExpansionPrompt(options: ExpansionOptions): string {
    const { text, expansionType, expansionLevel, targetLength, context } = options;

    let prompt = `Expand the following academic text.

Original text:
"${text}"

Expansion type: ${expansionType || 'paragraph'}
Expansion level: ${expansionLevel || 'moderate'}
`;

    if (targetLength) {
      prompt += `Target length: ~${targetLength} words\n`;
    }

    if (context?.researchField) {
      prompt += `Research field: ${context.researchField}\n`;
    }

    if (context?.previousSection) {
      prompt += `Preceding context: ${context.previousSection.substring(0, 200)}...\n`;
    }

    prompt += `
Requirements:
1. Maintain academic tone and rigor
2. Add substantive content (not just fluff)
3. Preserve original meaning
4. Ensure logical coherence
5. Use domain-appropriate terminology
6. Include relevant examples or evidence where appropriate

Provide the expanded text only, no explanations.`;

    return prompt;
  }
}
```

### 2. Specialized Expansion Strategies

```typescript
class ExpansionStrategies {
  /**
   * Evidence-based expansion
   */
  async expandWithEvidence(text: string, field: string): Promise<string> {
    const response = await query({
      prompt: `Expand this academic text by adding supporting evidence and examples.

Text: "${text}"
Field: ${field}

Add:
- Concrete examples
- Empirical evidence
- Case studies
- Statistical support
- Literature references (use [Author, Year] format)

Maintain academic rigor and coherence.`,
      options: { model: 'claude-sonnet-4-5', maxTurns: 1 }
    });

    return this.extractResponse(response);
  }

  /**
   * Perspective diversification
   */
  async expandWithPerspectives(text: string): Promise<string> {
    const response = await query({
      prompt: `Expand this text by incorporating multiple perspectives.

Text: "${text}"

Add:
- Alternative viewpoints
- Counter-arguments and rebuttals
- Different theoretical approaches
- Limitations and constraints
- Balanced consideration of pros/cons

Maintain academic objectivity.`,
      options: { model: 'claude-sonnet-4-5', maxTurns: 1 }
    });

    return this.extractResponse(response);
  }

  /**
   * Methodology elaboration
   */
  async expandMethodology(text: string): Promise<string> {
    const response = await query({
      prompt: `Expand this methodology description with technical details.

Text: "${text}"

Add:
- Step-by-step procedures
- Justification for methodological choices
- Alternative methods considered
- Implementation details
- Validation approaches

Be specific and technically accurate.`,
      options: { model: 'claude-sonnet-4-5', maxTurns: 1 }
    });

    return this.extractResponse(response);
  }
}
```

### 3. Quality Assessment

```typescript
class QualityAssessor {
  /**
   * Assess expansion quality
   */
  assessQuality(text: string): QualityScores {
    return {
      coherence: this.assessCoherence(text),
      relevance: this.assessRelevance(text),
      academicTone: this.assessAcademicTone(text)
    };
  }

  private assessCoherence(text: string): number {
    // Check for logical flow indicators
    const transitions = ['however', 'therefore', 'furthermore', 'consequently', 'moreover'];
    let score = 50;

    for (const transition of transitions) {
      if (text.toLowerCase().includes(transition)) {
        score += 5;
      }
    }

    // Check sentence variety
    const sentences = text.split(/[.!?]+/);
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;

    if (variance > 10) score += 20; // Good variety
    if (variance > 5) score += 10;

    return Math.min(100, score);
  }

  private assessRelevance(text: string): number {
    // Check for content markers
    const contentWords = text.split(/\s+/).filter(w => w.length > 5);
    const totalWords = text.split(/\s+/).length;
    return Math.min(100, (contentWords.length / totalWords) * 100);
  }

  private assessAcademicTone(text: string): number {
    const academicMarkers = [
      'suggests', 'indicates', 'demonstrates', 'establishes',
      'significant', 'substantial', 'notable', 'considerable',
      'furthermore', 'moreover', 'additionally', 'consequently'
    ];

    let count = 0;
    for (const marker of academicMarkers) {
      if (text.toLowerCase().includes(marker)) {
        count++;
      }
    }

    return Math.min(100, count * 5 + 50);
  }
}
```

## Usage Examples

### Example 1: Paragraph Expansion
```typescript
const result = await expander.expand({
  text: 'Machine learning has transformed healthcare.',
  expansionType: 'paragraph',
  expansionLevel: 'moderate',
  targetLength: 150
});

// Output: Detailed paragraph discussing applications, challenges, and future directions
```

### Example 2: Evidence Enhancement
```typescript
const result = await expander.expand({
  text: 'Exercise has positive effects on mental health.',
  expansionType: 'evidence',
  context: { researchField: 'Psychology' }
});

// Output: Expanded with studies, statistics, and mechanisms
```

### Example 3: Methodology Elaboration
```typescript
const result = await expander.expand({
  text: 'We used a survey to collect data.',
  expansionType: 'methodology',
  expansionLevel: 'extensive'
});

// Output: Detailed methodology including design, sampling, validation
```

### Example 4: Discussion Enhancement
```typescript
const result = await expander.expand({
  text: 'Our findings suggest potential applications.',
  expansionType: 'discussion',
  context: {
    previousSection: 'Results section summary...',
    researchField: 'Computer Science'
  }
});

// Output: Extended discussion with implications and future work
```

## Best Practices

1. **Set Appropriate Goals**: Choose realistic expansion targets (2-3x typical)
2. **Maintain Quality**: Focus on substantive additions, not just length
3. **Preserve Voice**: Keep original author's style and perspective
4. **Add Value**: Include meaningful content, examples, and insights
5. **Stay Relevant**: Ensure additions directly support the main point
6. **Verify Accuracy**: Check that expanded claims are accurate and supportable
7. **Review Flow**: Ensure smooth transitions between original and new content

## Expansion Levels

### Conservative (1.5-2x expansion)
- Add clarifying details
- Include brief examples
- Strengthen key points
- Minimal structural changes

### Moderate (2-3x expansion)
- Add substantial examples
- Include supporting evidence
- Explore implications
- Some restructuring

### Extensive (3-5x expansion)
- Comprehensive development
- Multiple examples and evidence
- Diverse perspectives
- Significant elaboration

## Integration with Other Skills

- **literature-search**: Find relevant papers to support expansion
- **citation-manager**: Add proper citations to expanded content
- **academic-polisher**: Polish expanded text for consistency
- **writing-quality**: Ensure expanded text meets quality standards
- **conversational-editor**: Interactive expansion process

## Advanced Features

### 1. Contextual Expansion
```typescript
const result = await expander.expand({
  text: 'These results are significant.',
  context: {
    previousSection: 'Our experiments showed...',
    nextSection: 'Based on these findings...',
    researchField: 'Biology'
  }
});
```

### 2. Iterative Expansion
```typescript
// Expand gradually with feedback
let expanded = text;
for (let i = 0; i < 3; i++) {
  const result = await expander.expand({
    text: expanded,
    expansionLevel: 'conservative'
  });
  expanded = result.expandedText;
}
```

### 3. Focused Expansion
```typescript
const result = await expander.expand({
  text: complexParagraph,
  expansionType: 'evidence',
  targetLength: 300,
  includeCitations: true
});
```

### 4. Comparative Expansion
```typescript
const results = await Promise.all([
  expander.expand({ text, expansionType: 'evidence' }),
  expander.expand({ text, expansionType: 'perspective' }),
  expander.expand({ text, expansionType: 'methodology' })
]);
```

## Setup and Configuration

```typescript
const expander = new CreativeExpanderService({
  defaultExpansionLevel: 'moderate',
  maxExpansionRatio: 5,
  includeSuggestions: true,
  preserveStyle: true
});
```
