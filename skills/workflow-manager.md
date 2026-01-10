---
description: Workflow Manager Agent Skill - Orchestrate multi-agent research tasks
name: workflow-manager
version: 1.0.0
author: Academic Assistant Team
---

# Workflow Manager Agent Skill

## Description

The Workflow Manager is the central orchestrator that coordinates multiple agents and skills to complete complex research tasks. It breaks down high-level goals into executable steps and manages the entire research workflow.

## Capabilities

- 📋 Task planning and decomposition
- 🤖 Multi-agent coordination
- 📊 Progress tracking
- 🔄 Resource allocation
- ✅ Result synthesis

## How It Works

1. **Understand Goal**: Analyze the user's research objective
2. **Plan Execution**: Break down into manageable steps
3. **Allocate Resources**: Assign tasks to appropriate agents
4. **Monitor Progress**: Track execution and handle failures
5. **Synthesize Results**: Combine outputs into coherent response

## Usage

### Simple workflow

```bash
/workflow "Write a literature review on transformer architectures"
```

### Complex workflow

```bash
/workflow "Research and write a paper on AI in healthcare" --steps 10
```

## Workflow Stages

Typical research workflow includes:

1. Literature Search
2. Literature Review
3. Paper Structuring
4. Draft Writing
5. Citation Management
6. Quality Check
7. Peer Review
8. Final Revision

## Configuration

The workflow manager can be configured with:

```typescript
{
  maxConcurrentAgents: 3,
  timeout: 300000, // 5 minutes
  retryAttempts: 3,
  skills: ["literature-search", "literature-review", ...]
}
```

## Agent Coordination

The workflow manager coordinates with:

- **Researcher Agent**: Literature search and data collection
- **Writer Agent**: Drafting and editing
- **Reviewer Agent**: Quality checks and feedback
- **Analyzer Agent**: Data analysis and visualization

## Output

Returns a structured result containing:

```typescript
{
  goal: string,
  steps: [
    { id, title, status, output }
  ],
  summary: string,
  artifacts: [...]
}
```

## Examples

### Complete research workflow

```bash
/workflow "Research and write introduction for ML paper"
```

### Literature review workflow

```bash
/workflow "Create literature review on LLMs" --focus recent
```

## Related Skills

- All agent skills are coordinated by workflow manager
- Uses `literature-search`, `literature-review`, etc.

## Implementation Notes

- Uses Claude Agent SDK for intelligent planning
- Event-driven architecture for real-time updates
- Fault-tolerant with retry mechanisms
- Parallel execution where possible

## Best Practices

1. Start with clear, specific goals
2. Review the generated plan before execution
3. Monitor progress through events
4. Adjust parameters based on task complexity
