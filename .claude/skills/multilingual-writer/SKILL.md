---
name: multilingual-writer
description: Write and translate academic content in multiple languages with cultural adaptation and academic conventions
allowed-tools:
  - WebSearch
  - Read
  - Write
  - Bash
  - MCPTool
  - Skill
context: fork
---

# Multilingual Writer Skill

## Overview

The Multilingual Writer skill enables academic writing and translation across multiple languages with proper cultural adaptation and adherence to academic conventions in each language.

## Capabilities

### 1. Academic Translation
- Research paper translation
- Preserve technical accuracy
- Maintain academic tone
- Handle discipline-specific terminology

### 2. Cultural Adaptation
- Adjust writing style for target culture
- Adapt examples and references
- Localize metaphors and idioms
- Respect cultural sensitivities

### 3. Writing Assistance
- Grammar and style checking
- Academic conventions by language
- Citation format adaptation
- Discipline-specific terminology

### 4. Language Detection
- Automatic language detection
- Mixed language handling
- Code-switching support
- Dialect recognition

## Supported Languages

### Major Academic Languages
- **English** (EN) - International standard
- **Chinese** (ZH) - Simplified & Traditional
- **Spanish** (ES) - Spain & Latin America
- **French** (FR) - France & Canada
- **German** (DE) - Standard German
- **Japanese** (JA) - Academic Japanese
- **Portuguese** (PT) - Brazil & Portugal
- **Russian** (RU) - Academic Russian
- **Arabic** (AR) - Modern Standard
- **Korean** (KO) - Academic Korean

## Usage Examples

### Translate Academic Text

```typescript
// Translate abstract to multiple languages
const translation = await multilingual.translate({
  text: 'This paper presents a novel approach to...',
  sourceLanguage: 'en',
  targetLanguages: ['zh', 'es', 'fr'],
  context: 'academic',
  preserveFormat: true
});

// Returns:
// {
//   zh: '本文提出了一种新颖的方法...',
//   es: 'Este trabajo presenta un enfoque novedoso...',
//   fr: 'Cet article présente une approche novatrice...'
// }
```

### Write in Target Language

```typescript
// Generate academic content in target language
const content = await multilingual.write({
  language: 'zh',
  topic: 'machine learning in healthcare',
  section: 'abstract',
  style: 'formal',
  length: 'medium'
});

// Returns well-formed abstract in Chinese
```

### Adapt Cultural References

```typescript
// Adapt content for target culture
const adapted = await multilingual.adapt({
  text: 'As American as apple pie',
  targetLanguage: 'zh',
  targetAudience: 'academic'
});

// Returns: '像中国茶文化一样传统'
// (Equivalent cultural reference in Chinese)
```

### Check Writing Quality

```typescript
// Check grammar and style in target language
const issues = await multilingual.check({
  text: 'El resultado de la investigación...',
  language: 'es',
  checks: ['grammar', 'academic-style', 'terminology']
});

// Returns array of suggestions and corrections
```

## Output Format

### Translation Response

```typescript
{
  sourceLanguage: string,
  targetLanguages: string[],
  translations: Map<string, TranslationResult>,
  confidence: number,
  warnings: string[]
}
```

### Translation Result

```typescript
{
  text: string,
  wordCount: number,
  academicTone: boolean,
  culturalAdaptations: string[],
  terminologyNotes: TermNote[]
}
```

### Writing Response

```typescript
{
  language: string,
  content: string,
  wordCount: number,
  academicLevel: 'undergraduate' | 'graduate' | 'professional',
  style: string,
  suggestions: string[]
}
```

### Quality Check Response

```typescript
{
  language: string,
  issues: Issue[],
  score: number,
  suggestions: Suggestion[],
  academicConventions: boolean
}
```

## Academic Conventions by Language

### English
- Active voice increasingly preferred
- Clear, direct sentences
- Minimal use of passive voice
- Avoid colloquialisms

### Chinese
- Formal written style (书面语)
- Four-character idioms (成语) for emphasis
- Polite forms (您, 请)
- Proper use of measure words

### Spanish
- Formal address (usted)
- Subjunctive mood for hypotheses
- Rich connector vocabulary
- Gender agreement

### French
- Complex sentence structures
- Nuance and precision valued
- Proper use of subjonctif
- Elegant transitions

### German
- Compound words common
- Passive voice acceptable
- Precise technical terms
- Formal academic register

### Japanese
- Polite forms (desu/masu)
- Honorifics for names
- Logical structure (ki-sho-ten-ketsu)
- Careful with pronouns

## Translation Strategies

### 1. Literal Translation
```typescript
{
  strategy: 'literal',
  preserveStructure: true,
  terminologyMode: 'exact'
}
```

### 2. Academic Adaptation
```typescript
{
  strategy: 'academic',
  tone: 'formal',
  terminologyMode: 'discipline-specific'
}
```

### 3. Cultural Localization
```typescript
{
  strategy: 'localized',
  adaptExamples: true,
  localizeReferences: true,
  culturalSensitivity: true
}
```

### 4. Hybrid Approach
```typescript
{
  strategy: 'hybrid',
  preserveTechnical: true,
  adaptNonTechnical: true,
  balanceAccuracy: 0.8
}
```

## Best Practices

1. **Know Your Audience**: Adjust formality level for target audience
2. **Preserve Meaning**: Prioritize accuracy over literal translation
3. **Adapt Examples**: Use culturally relevant examples
4. **Check Terminology**: Verify discipline-specific terms
5. **Maintain Style**: Keep consistent academic tone
6. **Proofread**: Always have native speakers review
7. **Cite Sources**: Adapt citations to target language conventions

## Configuration

### Translation Settings

```typescript
{
  preserveFormat: boolean,
  includeNotes: boolean,
  terminologyMode: 'general' | 'discipline-specific',
  adaptationLevel: 'minimal' | 'moderate' | 'extensive'
}
```

### Quality Settings

```typescript
{
  grammarCheck: boolean,
  styleCheck: boolean,
  terminologyCheck: boolean,
  culturalCheck: boolean
}
```

## Integration Plan

- Connect with translation APIs (DeepL, Google Translate)
- Use language detection (langdetect, fastText)
- Implement discipline-specific terminology databases
- Build cultural knowledge base
- Create quality assessment models

## Limitations

- Machine translation may miss nuances
- Cultural context requires human review
- Discipline-specific terms need verification
- Idioms often don't translate directly
- Academic writing styles vary by region

## Future Enhancements

- [ ] Real-time collaborative translation
- [ ] Domain-specific fine-tuning
- [ ] Integration with academic databases
- [ ] Automated glossary management
- [ ] Version control for translations
- [ ] Translation memory system
- [ ] Quality metrics dashboard
