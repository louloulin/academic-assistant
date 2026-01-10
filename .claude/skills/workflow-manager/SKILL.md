---
name: workflow-manager
description: Orchestrate multi-agent research workflows by planning tasks, allocating resources, and synthesizing results. Use when the user asks to complete complex research tasks, write papers, or conduct literature reviews.
allowed-tools:
  - Bash
  - Read
  - Write
  - Skill
context: fork
agent: general-purpose
---

# Workflow Manager Agent Skill

## Overview

The Workflow Manager is the central orchestrator that coordinates multiple agents and skills to complete complex research tasks. It runs in a forked context with its own conversation history.

## How It Works

1. **Understand Goal**: Analyze the user's research objective
2. **Plan Execution**: Break down into executable steps
3. **Allocate Resources**: Assign tasks to appropriate agents/skills
4. **Monitor Progress**: Track execution and handle failures
5. **Synthesize Results**: Combine outputs into coherent response

## Quick Start

### Basic Workflow

When a user asks to complete a complex task:

1. **Analyze the request**: Identify required capabilities
2. **Create execution plan**: Break into steps
3. **Invoke relevant skills**: Call literature-search, citation-manager, etc.
4. **Track progress**: Monitor each step
5. **Combine results**: Present final output

### Example

**User**: "Write a literature review on transformer architectures"

**Workflow**:
1. Search papers: Call `literature-search` skill
2. Analyze results: Extract key themes
3. Generate review: Structure and write review
4. Format citations: Call `citation-manager` skill
5. Present output: Complete literature review

## Standard Workflows

### Literature Review Workflow

```
1. Literature Search
   → Search ArXiv, Semantic Scholar for papers

2. Paper Selection
   → Filter by relevance, citation count, year

3. Thematic Analysis
   → Group papers by themes/approaches

4. Synthesis
   → Identify gaps, trends, contributions

5. Writing
   → Generate structured review

6. Citation Formatting
   → Apply selected citation style
```

### Paper Writing Workflow

```
1. Topic Analysis
   → Understand research question

2. Literature Review
   → Review related work

3. Structure Planning
   → Create IMRaD outline

4. Section Writing
   → Draft each section

5. Citation Integration
   → Add and format citations

6. Review and Revise
   → Quality check and improvements
```

### Research Proposal Workflow

```
1. Problem Identification
   → Define research gap

2. Literature Review
   → Review existing solutions

3. Methodology Design
   → Plan research approach

4. Timeline Creation
   → Estimate milestones

5. Budget Planning
   → Calculate required resources

6. Proposal Writing
   → Generate complete proposal
```

## Task Types

### Search Tasks
- Literature search
- Data source identification
- Reference gathering

### Analysis Tasks
- Paper analysis
- Data analysis
- Statistical analysis

### Writing Tasks
- Drafting sections
- Editing and revision
- Citation formatting

### Review Tasks
- Quality checks
- Peer review simulation
- Plagiarism detection

## Execution Model

### Parallel Execution
Some tasks can run in parallel:
- Multiple literature searches
- Independent section writing
- Simultaneous quality checks

### Sequential Execution
Some tasks require sequential execution:
- Literature search → Analysis → Writing
- Drafting → Review → Revision

### Conditional Execution
Some tasks depend on conditions:
- IF enough papers found → proceed to review
- IF quality check fails → request revision

## Error Handling

### Retry Logic
- Failed tasks are retried up to 3 times
- Exponential backoff between retries
- After 3 failures, task is marked as failed

### Fallback Strategies
- If one search fails, try another source
- If analysis fails, provide partial results
- If writing fails, save draft for manual completion

## Progress Tracking

### Status Updates
Report progress to user:
```
[1/5] Searching literature...
[2/5] Analyzing 15 papers found...
[3/5] Generating outline...
[4/5] Drafting sections...
[5/5] Formatting citations...
```

### Milestones
Key milestones in workflow:
- Search completed
- Analysis finished
- Draft generated
- Review passed
- Final output ready

## Configuration

Default configuration:
```typescript
{
  maxConcurrentTasks: 3,
  timeout: 300000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000
}
```

## Available Skills

This workflow manager can invoke:
- `literature-search` - Find papers
- `citation-manager` - Format citations
- `literature-review` - Generate reviews
- `paper-structure` - Structure papers
- `writing-quality` - Check quality
- `peer-review` - Simulate peer review

## Best Practices

1. **Break down large tasks** into smaller steps
2. **Set clear goals** for each step
3. **Monitor progress** and report to user
4. **Handle errors gracefully** with fallbacks
5. **Synthesize results** from multiple sources

## Troubleshooting

### Workflow Stuck
- Check timeout settings
- Verify skill availability
- Review task dependencies

### Partial Results
- Continue with available data
- Warn user about missing information
- Suggest manual completion steps

### Skill Failures
- Retry with different parameters
- Try alternative skills
- Fall back to manual methods

## Examples

See [EXAMPLES.md](EXAMPLES.md) for detailed workflow examples.

## Related Skills

All other skills are orchestrated by this workflow manager.
