---
name: conversational-editor
description: Conversational writing assistant that helps you edit and improve academic papers through interactive dialogue
allowed-tools:
  - Read
  - Write
  - Bash
context: fork
---

# Conversational Editor Skill

Interactive conversational assistant for academic paper writing and editing.

## When to Use

Use this skill when the user asks to:
- Have a conversation about their paper
- Get real-time writing suggestions
- Improve specific sections of text
- Explore different writing styles
- Brainstorm ideas for expansion
- Refine academic language
- Get feedback on paper structure

## Capabilities

### 1. Conversational Interface
- Maintain conversation context across multiple turns
- Remember user preferences and paper state
- Provide personalized suggestions
- Support natural language interactions

### 2. Writing Assistance
- Suggest improvements for clarity and flow
- Recommend better academic vocabulary
- Identify and fix grammar issues
- Enhance sentence structure
- Improve paragraph transitions

### 3. Style Adjustment
- Formal academic tone
- Concise/compact writing
- Detailed/elaborate explanations
- Technical vs. accessible language
- Active vs. passive voice balance

### 4. Content Expansion
- Expand brief explanations
- Add supporting evidence
- Develop examples and analogies
- Strengthen arguments
- Bridge related concepts

### 5. Interactive Editing
- Suggest specific edits with before/after comparisons
- Allow user to choose from multiple options
- Apply incremental changes
- Show diff of modifications
- Support undo/redo operations

### 6. Feedback and Analysis
- Quality scoring (0-100)
- Readability metrics
- Tone analysis
- Coherence evaluation
- Structure suggestions

## Input Format

The skill accepts conversational input with optional context:

```typescript
{
  message: string;           // User's message or question
  paperPath?: string;        // Path to paper file (optional)
  section?: string;          // Specific section to focus on
  context?: {                // Additional context
    style?: 'formal' | 'concise' | 'detailed' | 'accessible';
    goal?: string;           // Writing goal
    audience?: string;       // Target audience
    constraints?: string[];  // Any constraints
  };
}
```

## Output Format

Returns a conversational response:

```typescript
{
  response: string;          // Main response message
  suggestions?: Array<{
    type: 'improvement' | 'expansion' | 'correction' | 'alternative';
    original: string;
    suggested: string;
    reason: string;
    confidence: number;
  }>;
  edits?: Array<{
    section: string;
    original: string;
    revised: string;
    diff: string;
  }>;
  analysis?: {
    qualityScore: number;
    readability: string;
    tone: string;
    issues: string[];
    strengths: string[];
  };
  followUpQuestions?: string[];
  nextActions?: string[];
}
```

## Technical Implementation

### Conversation Management

```typescript
class ConversationManager {
  private history: Message[] = [];
  private context: PaperContext;
  private preferences: UserPreferences;

  async processMessage(message: string): Promise<Response> {
    // Add to history
    this.history.push({ role: 'user', content: message });

    // Analyze intent
    const intent = await this.analyzeIntent(message);

    // Generate response based on intent
    const response = await this.generateResponse(intent);

    // Add to history
    this.history.push({ role: 'assistant', content: response });

    return response;
  }

  private async analyzeIntent(message: string): Promise<Intent> {
    // Classify user intent:
    // - improve_text
    // - expand_section
    // - change_style
    // - get_feedback
    // - brainstorm
    // - fix_grammar
    // - ask_question
  }

  private async generateResponse(intent: Intent): Promise<Response> {
    // Use Claude Agent SDK query() for intelligent responses
    // Combine with paper context for relevance
  }
}
```

### Suggestion Generation

```typescript
class SuggestionEngine {
  async generateImprovements(text: string, options: Options): Promise<Suggestion[]> {
    const suggestions = [];

    // 1. Grammar and style
    const grammar = await this.checkGrammar(text);
    suggestions.push(...grammar);

    // 2. Clarity improvements
    const clarity = await this.improveClarity(text);
    suggestions.push(...clarity);

    // 3. Academic vocabulary
    const vocabulary = await this.enhanceVocabulary(text);
    suggestions.push(...vocabulary);

    // 4. Sentence structure
    const structure = await this.improveStructure(text);
    suggestions.push(...structure);

    return suggestions;
  }

  async generateAlternatives(text: string, style: WritingStyle): Promise<string[]> {
    // Generate 3-5 alternative versions
    // Each with different approach
  }

  async generateExpansion(text: string, targetLength: number): Promise<string> {
    // Expand text while maintaining coherence
    // Add examples, evidence, explanations
  }
}
```

### Diff Generation

```typescript
class DiffGenerator {
  generateDiff(original: string, revised: string): string {
    // Unified diff format
    const lines1 = original.split('\n');
    const lines2 = revised.split('\n');

    // Compare and generate diff
    // Show + for additions, - for deletions
  }

  applyEdit(section: string, edit: Edit): string {
    // Apply edit to section
    // Return modified section
  }
}
```

### Quality Analysis

```typescript
class QualityAnalyzer {
  analyze(text: string): Analysis {
    return {
      qualityScore: this.calculateQuality(text),
      readability: this.assessReadability(text),
      tone: this.detectTone(text),
      coherence: this.evaluateCoherence(text),
      issues: this.identifyIssues(text),
      strengths: this.identifyStrengths(text)
    };
  }

  private calculateQuality(text: string): number {
    // Score based on:
    // - Grammar correctness
    // - Clarity
    // - Academic tone
    // - Coherence
    // - Structure
  }
}
```

## Usage Examples

### Example 1: Improve Paragraph
```javascript
const editor = new ConversationalEditor();

const result = await editor.chat({
  message: "Please improve the clarity of the introduction paragraph",
  paperPath: './paper.md',
  section: 'Introduction'
});

// Response includes:
// - Improved version
// - Explanation of changes
// - Before/after comparison
```

### Example 2: Expand Section
```javascript
const result = await editor.chat({
  message: "The methodology section is too brief. Can you help expand it?",
  paperPath: './paper.md',
  section: 'Methodology',
  context: {
    goal: 'provide enough detail for reproducibility',
    constraints: ['stay under 500 words']
  }
});

// Response includes:
// - Expanded text
// - Added details
// - Word count check
```

### Example 3: Change Writing Style
```javascript
const result = await editor.chat({
  message: "Rewrite this in a more formal academic tone",
  paperPath: './paper.md',
  section: 'Discussion',
  context: {
    style: 'formal'
  }
});

// Response includes:
// - 3 alternative versions
// - Tone comparison
// - Recommendation
```

### Example 4: Get Feedback
```javascript
const result = await editor.chat({
  message: "What do you think about the overall structure?",
  paperPath: './paper.md'
});

// Response includes:
// - Quality score
// - Strengths
// - Issues to address
// - Specific suggestions
```

### Example 5: Brainstorm
```javascript
const result = await editor.chat({
  message: "I'm stuck on how to present the results. Any ideas?",
  paperPath: './paper.md',
  section: 'Results'
});

// Response includes:
// - 3-5 presentation approaches
// - Pros/cons of each
// - Recommended approach with reasoning
```

### Example 6: Interactive Editing Session
```javascript
const editor = new ConversationalEditor();

// Start conversation
let response = await editor.chat({
  message: "Can you help me improve my abstract?",
  paperPath: './paper.md'
});

console.log(response.response);

// Follow-up
response = await editor.chat({
  message: "Yes, please apply the first suggestion",
  paperPath: './paper.md'
});

// Edit is applied to the paper
```

## Quality Assurance

### Validation
- Verify suggestions maintain original meaning
- Check that edits don't introduce errors
- Ensure style consistency
- Validate academic tone

### Error Handling
- Graceful handling of unclear requests
- Ask for clarification when needed
- Provide fallback suggestions
- Maintain conversation flow

### Performance
- Response time: <2 seconds for suggestions
- Support long conversations (20+ turns)
- Memory efficient context management
- Incremental processing for long papers

## Limitations

- Requires paper to be in text format (Markdown, plain text)
- Cannot directly edit binary formats (PDF, DOCX)
- Suggestions are based on common patterns, not field-specific
- May not capture highly technical nuance
- Requires user judgment for final edits

## Best Practices

1. **Provide context**: Include paper path and section when possible
2. **Be specific**: More specific requests get better suggestions
3. **Iterate**: Use conversation to refine suggestions
4. **Review edits**: Always review suggested changes before applying
5. **Combine skills**: Use with writing-quality for comprehensive analysis
6. **Save versions**: Keep backups before major edits

## Conversation Patterns

### Clarification Pattern
```
User: "Improve this section"
Assistant: "I'd be happy to help! Which section would you like me to focus on,
          and what aspect would you like improved (clarity, grammar, flow, tone)?"
```

### Suggestion Pattern
```
User: "Make the introduction more engaging"
Assistant: "Here are 3 ways to make your introduction more engaging:

          Option 1: Start with a compelling question...
          Option 2: Present a surprising statistic...
          Option 3: Share a brief anecdote...

          Which approach appeals to you?"
```

### Iteration Pattern
```
User: "That's better, but can you make it more concise?"
Assistant: "I'll tighten it up. Here's a more concise version..."
```

## Related Skills

- **writing-quality**: Comprehensive quality analysis
- **paper-structure**: Structural suggestions
- **academic-polisher**: Academic language optimization
- **citation-manager**: Citation formatting during edits
- **pdf-analyzer**: Extract text from PDFs for editing

## Advanced Features

### Style Transfer
Automatically adapt writing style:
```javascript
await editor.transferStyle(text, {
  from: 'conversational',
  to: 'formal-academic'
});
```

### Content-Aware Suggestions
Suggestions based on paper content:
```javascript
await editor.suggestWithAwareness(paper, {
  section: 'Discussion',
  awareness: ['results', 'methods', 'literature']
});
```

### Collaborative Editing
Track changes and comments:
```javascript
await editor.collaborativeEdit(paper, {
  trackChanges: true,
  allowComments: true
});
```

### Template Application
Apply section templates:
```javascript
await editor.applyTemplate(paper, {
  section: 'Introduction',
  template: 'funnel-structure'  // Broad → Specific
});
```
