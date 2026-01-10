# Academic Assistant - Project Context

## Project Overview

This is an AI-powered academic paper writing assistant built with Claude Code, Claude Agent SDK, and MCP (Model Context Protocol). It helps researchers and students with literature search, citation management, paper writing, and peer review.

## Technology Stack

- **Runtime**: Bun 1.0+
- **Language**: TypeScript 5.3+
- **MCP Servers**: Rust 1.70+ (Tokio async runtime)
- **AI SDK**: Claude Agent SDK
- **Architecture**: Monorepo with Bun Workspaces

## Project Structure

```
academic-assistant/
├── .claude/
│   └── skills/           # Agent Skills (SKILL.md files)
│       ├── literature-search/
│       ├── citation-manager/
│       └── workflow-manager/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Bun API service
├── packages/
│   ├── core/             # Core types and interfaces
│   ├── skills/           # Skill implementations
│   ├── agents/           # Agent implementations
│   ├── mcp-client/       # MCP client
│   ├── utils/            # Utilities
│   └── mcp-servers/      # Rust MCP servers
└── tools/                # Build and utility tools
```

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Format with Prettier
- Write descriptive commit messages

### Key Conventions

1. **File Naming**: Use kebab-case for files and directories
2. **Exports**: Use `export * from` for barrel files
3. **Types**: Define types in `core` package
4. **Interfaces**: Implement interfaces from `core` package
5. **Skills**: Create SKILL.md files in `.claude/skills/`

### Adding New Features

1. **New Skill**: Create SKILL.md in `.claude/skills/skill-name/`
2. **New Agent**: Extend BaseAgent class in `packages/agents/`
3. **New MCP Server**: Create in `packages/mcp-servers/`
4. **New API Route**: Add to `apps/api/src/routes/`

## Available Skills

When working on this project, Claude has access to these **8 fully implemented Skills**:

### Core AI Skills (100% Complete)

1. **literature-search**: Search academic papers across multiple databases
   - Supports: ArXiv, Semantic Scholar, PubMed
   - Features: Deduplication, relevance scoring, keyword extraction

2. **citation-manager**: Format and validate citations in multiple styles
   - Supports: APA, MLA, Chicago, IEEE, Harvard
   - Features: In-text citations, bibliography generation

3. **paper-structure**: Generate paper structure following IMRaD format
   - Supports: Research paper, review, conference, thesis, short communication
   - Features: Word count estimation, writing tips

4. **writing-quality**: Check and improve academic writing quality
   - Checks: Grammar, clarity, tone, readability, consistency, vocabulary
   - Features: Quality scoring (0-100), improvement suggestions

5. **literature-review**: Analyze and synthesize academic papers
   - Features: Theme identification, methodology analysis, gap detection

6. **peer-review**: Simulate academic peer review process
   - Features: Section-wise review, decision generation (accept/revisions/reject)

7. **data-analysis**: Provide statistical analysis recommendations
   - Features: Analysis planning, visualization suggestions, reporting guidelines

8. **journal-submission**: Assist with journal selection and submission
   - Features: Journal recommendations, cover letter generation, submission checklist

### Agent Skills

- **workflow-manager**: Orchestrate complex multi-step research tasks
  - Uses fork context for isolated execution
  - Coordinates multiple agents and skills

These Skills are automatically invoked when relevant to the task.

## MCP Integration

The project integrates with these MCP servers:

- **literature-search-server**: ArXiv, Semantic Scholar, PubMed search
- **citation-manager-server**: Citation formatting and validation

MCP servers are written in Rust and run as separate processes.

## Development Workflow

### Start Development

```bash
# Install dependencies
bun install

# Start API server
cd apps/api && bun run dev

# Start web app
cd apps/web && bun run dev
```

### Testing

```bash
# Run tests
bun test

# Test specific package
bun test --filter @assistant/core
```

### Building

```bash
# Build all packages
bun run build

# Build specific package
bun run --filter @assistant/api build
```

## Important Notes

1. **Academic Integrity**: This tool assists but does not replace academic work. Always verify AI-generated content.
2. **Citation Accuracy**: Use DOI verification to prevent citation errors.
3. **Data Privacy**: User research data is processed locally and not shared.

## Related Documentation

- [Project Plan](./plan1.md)
- [Technical Analysis](./tech-stack-analysis.md)
- [Architecture](./ARCHITECTURE.md)
- [Quick Start](./QUICKSTART.md)

## Questions?

When working on this project, ask Claude:
- "What Skills are available?" - See all available Skills
- "Search for papers on [topic]" - Use literature-search skill
- "Format these citations in [style]" - Use citation-manager skill
- "Help me write a literature review" - Use workflow-manager skill
