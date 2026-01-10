---
description: Literature Search Agent Skill - Search academic papers from multiple sources
name: literature-search-agent
version: 1.0.0
author: Academic Assistant Team
---

# Literature Search Agent Skill

## Description

This agent skill enables comprehensive academic literature search across multiple databases including ArXiv, Semantic Scholar, and PubMed.

## Capabilities

- 🔍 Multi-source literature search
- 📊 Automatic metadata extraction
- 🎯 Smart relevance ranking
- 🔄 Result deduplication
- 📝 Citation tracking

## Usage

### Basic Search

```bash
/literature-search "machine learning transformers"
```

### Advanced Search

```bash
/literature-search "deep learning" --sources arxiv,semantic-scholar --max-results 20 --year-from 2020
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| query | string | required | Search query |
| sources | string[] | ["arxiv", "semantic-scholar"] | Data sources to search |
| maxResults | number | 10 | Maximum number of results |
| yearFrom | number | optional | Filter papers from year |
| yearTo | number | optional | Filter papers until year |

## Output Format

Returns an array of papers with:
- Title
- Authors
- Abstract
- Publication year
- Venue
- URL
- Citation count
- PDF link (if available)

## Examples

### Search for recent AI papers

```bash
/literature-search "artificial intelligence" --year-from 2023 --max-results 15
```

### Search specific sources

```bash
/literature-search "neural networks" --sources arxiv --max-results 5
```

## Related Skills

- `literature-review` - Generate literature reviews
- `citation-manager` - Format and manage citations
- `paper-structure` - Structure your paper

## Implementation

This skill uses:
- MCP Client for server communication
- Literature search MCP servers (Rust)
- Relevance scoring algorithm
- Deduplication logic

## Notes

- Searches are parallelized across sources for performance
- Results are ranked by relevance and citation count
- Duplicate papers (by title) are automatically removed
