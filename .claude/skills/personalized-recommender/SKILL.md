---
name: personalized-recommender
description: Provide personalized academic writing assistance based on user preferences, history, and research patterns
allowed-tools:
  - WebSearch
  - Read
  - Write
  - Bash
  - MCPTool
  - Skill
context: fork
---

# Personalized Recommender Skill

## Overview

The Personalized Recommender skill learns from user behavior, research patterns, and preferences to provide tailored academic writing assistance and recommendations.

## Capabilities

### 1. User Profiling
- Research field identification
- Writing style analysis
- Citation pattern recognition
- Collaboration pattern detection

### 2. Content Recommendations
- Personalized paper suggestions
- Relevant literature recommendations
- Writing style suggestions
- Journal recommendations based on history

### 3. Workflow Optimization
- Suggested workflows based on patterns
- Automation recommendations
- Tool suggestions
- Time management tips

### 4. Learning & Adaptation
- Feedback incorporation
- Preference updates
- Pattern evolution
- Custom model tuning

## Usage Examples

### Get Personalized Recommendations

```typescript
// Get recommendations based on user profile
const recommendations = await recommender.getRecommendations({
  userId: 'researcher-123',
  context: {
    currentTask: 'writing-introduction',
    field: 'Computer Science',
    recentPapers: ['paper-1', 'paper-2']
  }
});

// Returns:
// {
//   papers: [...],
//   workflows: [...],
//   tools: [...],
//   tips: [...]
// }
```

### Update User Profile

```typescript
// Update user preferences
await recommender.updateProfile({
  userId: 'researcher-123',
  preferences: {
    writingStyle: 'formal',
    citationStyle: 'APA',
    researchFields: ['Machine Learning', 'NLP'],
    collaborationMode: 'team'
  }
});
```

### Provide Feedback

```typescript
// Provide feedback on recommendations
await recommender.provideFeedback({
  userId: 'researcher-123',
  recommendationId: 'rec-456',
  rating: 5,
  helpful: true,
  comments: 'Very relevant to my research'
});
```

## Output Format

### Recommendation Response

```typescript
{
  userId: string,
  timestamp: Date,
  recommendations: {
    papers: PaperRecommendation[],
    workflows: WorkflowRecommendation[],
    tools: ToolRecommendation[],
    tips: PersonalizedTip[],
    journals: JournalRecommendation[]
  },
  confidence: number,
  reasoning: string
}
```

### User Profile

```typescript
{
  userId: string,
  profile: {
    researchFields: string[],
    writingStyle: string,
    citationStyles: string[],
    collaborationPattern: string,
    productivityMetrics: {
      peakHours: number[],
      averageSessionTime: number,
      taskCompletionRate: number
    },
    preferences: {
      language: string,
      tone: string,
      complexity: 'simple' | 'moderate' | 'advanced'
    }
  },
  history: {
    recentPapers: string[],
    recentTasks: string[],
    skillUsage: Map<string, number>
  },
  updatedAt: Date
}
```

## Learning Mechanisms

### 1. Implicit Learning
- Track frequently used features
- Analyze writing patterns
- Monitor citation preferences
- Detect collaboration habits

### 2. Explicit Feedback
- Star ratings on recommendations
- Helpful/not helpful feedback
- Manual preference settings
- Direct profile updates

### 3. Collaborative Filtering
- Find similar researchers
- Recommend what similar users liked
- Cluster by research patterns
- Social recommendation graph

### 4. Content-Based Filtering
- Analyze paper abstracts
- Match research topics
- Style similarity matching
- Field-specific recommendations

## Configuration

### Recommendation Settings

```typescript
{
  diversityThreshold: number,
  personalizationWeight: number,
  noveltyWeight: number,
  maxRecommendations: number,
  refreshInterval: number
}
```

### Privacy Settings

```typescript
{
  shareProfile: boolean,
  anonymousUsage: boolean,
  dataRetention: number,
  exportControl: boolean
}
```

## Best Practices

1. **Start Generic**: Provide general recommendations initially
2. **Learn Fast**: Quickly adapt to user patterns
3. **Explain Reasoning**: Show why recommendations are made
4. **Request Feedback**: Ask for ratings and comments
5. **Respect Privacy**: Allow users to control data usage

## Advanced Features

### Smart Workflows

```typescript
// Suggest workflow based on patterns
const workflow = await recommender.suggestWorkflow({
  userId: 'researcher-123',
  task: 'write-paper',
  constraints: {
    deadline: '2024-03-01',
    teamSize: 3,
    budget: 'low'
  }
});

// Returns optimized workflow with:
// - Recommended steps
// - Tool suggestions
// - Time estimates
// - Team assignments
```

### Proactive Assistance

```typescript
// Detect patterns and offer help
const insights = await recommender.generateInsights({
  userId: 'researcher-123'
});

// Returns:
// {
//   patterns: [...],
//   suggestions: [...],
//   potentialIssues: [...],
//   optimisationTips: [...]
// }
```

### Integration Plan

- Connect with all Skills
- Track usage patterns
- Build user profiles
- Generate personalized reports
- Provide actionable insights

## Limitations

- Requires sufficient user history
- Cold start problem for new users
- Privacy concerns with data collection
- May reinforce existing biases
- Needs regular updates

## Future Enhancements

- [ ] Multi-arm bandit for exploration/exploitation
- [ ] Deep learning for pattern recognition
- [ ] Cross-user knowledge transfer
- [ ] Real-time adaptation
- [ ] Explainable AI recommendations
- [ ] A/B testing framework
