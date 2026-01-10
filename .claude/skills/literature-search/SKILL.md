---
name: literature-search
description: Search academic papers across ArXiv, Semantic Scholar, and PubMed. Use when the user asks to find papers, search literature, or mentions academic research sources.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Literature Search Agent Skill

## Overview

This skill enables comprehensive academic literature search across multiple databases including ArXiv, Semantic Scholar, and PubMed.

## Quick Start

### Basic Search

When a user asks to search for papers, follow this process:

1. **Understand the query**: Extract key terms and concepts
2. **Select appropriate sources**: Choose based on the field (CS→ArXiv, Medical→PubMed)
3. **Execute search**: Use the literature search MCP server
4. **Process results**: Deduplicate, rank by relevance
5. **Format output**: Present papers in structured format

### Example Usage

**User request**: "Search for papers on transformer architectures"

**Your response**:
1. Call the literature search MCP server
2. Query: "transformer architectures"
3. Sources: arxiv, semantic-scholar
4. Return top 10 papers sorted by relevance

## Search Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| query | string | required | Search query terms |
| sources | string[] | ["arxiv", "semantic-scholar"] | Data sources to search |
| maxResults | number | 10 | Maximum number of results (1-100) |
| yearFrom | number | optional | Filter papers from this year |
| yearTo | number | optional | Filter papers until this year |

## Output Format

Each paper should include:
```typescript
{
  title: string
  authors: string[]
  abstract: string
  year: number
  venue?: string
  url: string
  pdfUrl?: string
  citationCount?: number
}
```

## Advanced Features

### Multi-source Search
- Parallel search across multiple databases
- Automatic deduplication by title
- Relevance scoring based on:
  - Title match (10 points)
  - Abstract match (1 point)
  - Citation count (log scale)

### Smart Filtering
- Year range filtering
- Venue-specific filtering
- Citation count thresholds

## Integration

This skill uses:
- **MCP Server**: `literature-search-server` (Rust)
- **Client**: `@assistant/mcp-client`
- **Cache**: Redis/Memory cache for repeated queries

## Best Practices

1. **Start broad**, then refine with filters
2. **Use specific terminology** from the field
3. **Check multiple sources** for comprehensive coverage
4. **Verify results** by checking DOIs when provided

## Troubleshooting

### No results found
- Broaden the search terms
- Remove year restrictions
- Try different sources

### Too many results
- Add specific terms
- Reduce maxResults
- Add year filters
- Increase citation count threshold

## Related Skills

- `literature-review` - Generate literature reviews from search results
- `citation-manager` - Format and manage citations
- `paper-structure` - Structure papers using found references

## Examples

See [EXAMPLES.md](EXAMPLES.md) for detailed usage examples.
