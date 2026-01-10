---
name: literature-search
description: Search academic papers across multiple databases (ArXiv, Semantic Scholar, PubMed, ACL Anthology). Use when users ask to search for academic papers, find literature, or locate research articles.
allowed-tools:
  - WebSearch
  - WebFetch
---

# Literature Search Skill

Expert in academic literature search across multiple databases.

## When to Use

Use this skill when the user asks to:
- Search for academic papers on a specific topic
- Find literature for research
- Locate research articles by author, venue, or keywords
- Search for publications in a specific field

## Capabilities

### Multi-Database Search
- **ArXiv**: Preprints in CS, math, physics, AI/ML
- **Semantic Scholar**: AI-powered academic search with citation data
- **PubMed**: Biomedical and life sciences literature
- **ACL Anthology**: Computational linguistics and NLP

### Information Extraction
Extract from each paper:
- Title, authors, year, venue/journal
- Abstract and DOI
- Citation count and impact metrics
- PDF URL when available
- Relevance score (0-10)

## Search Strategy

1. **Use specific, technical terms**
   - Prefer technical terminology over general terms
   - Example: "transformer architecture attention mechanism" instead of "AI models"

2. **Combine keywords with operators**
   - AND: `transformer AND attention`
   - OR: `cnn OR "convolutional neural network"`
   - NOT: `robot NOT "humanoid robot"`

3. **Filter by publication year**
   - Recent papers (last 3-5 years) for current state
   - Seminal papers (high citation count) for foundations

4. **Prioritize quality**
   - High citation count indicates impact
   - Survey papers provide comprehensive overviews
   - Top-tier venues (NeurIPS, ICML, ACL, EMNLP)

## Output Format

Return papers as JSON array:

```json
[
  {
    "id": "arxiv:1234.5678",
    "title": "Attention Is All You Need",
    "authors": ["Vaswani, A.", "Shazeer, N.", "Parmar, N."],
    "abstract": "The dominant sequence transduction models...",
    "year": 2017,
    "venue": "NeurIPS",
    "url": "https://arxiv.org/abs/1706.03762",
    "pdfUrl": "https://arxiv.org/pdf/1706.03762.pdf",
    "citationCount": 50000,
    "doi": "10.5555/3295222.3295349",
    "relevanceScore": 9.8,
    "source": "arxiv"
  }
]
```

## Quick Search Examples

### By Topic
```
Search for recent papers on "large language model reasoning"
```

### By Author
```
Find papers by "Geoffrey Hinton" on deep learning
```

### By Venue
```
Search NeurIPS 2023 papers on "diffusion models"
```

### By Citation Count
```
Find highly cited papers on "reinforcement learning" (>1000 citations)
```

## Tips

- **Quality over quantity**: 10-20 highly relevant papers is better than 100 marginally relevant ones
- **Start with surveys**: Survey papers provide excellent overviews and extensive bibliographies
- **Check recent papers**: Look for papers from the last 2-3 years for current state-of-the-art
- **Verify citations**: Always verify citation counts across multiple sources when possible
