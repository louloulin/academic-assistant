---
name: citation-graph
description: Generate interactive citation graphs to visualize research relationships and identify key papers using PageRank algorithm
allowed-tools:
  - Read
  - Write
  - Bash
  - WebSearch
  - WebFetch
context: fork
---

# Citation Graph Skill

Advanced citation graph visualization for understanding research relationships and identifying influential papers.

## When to Use

Use this skill when the user asks to:
- Visualize citation relationships between papers
- Identify key or influential papers in a field
- Analyze research trends and evolution over time
- Find co-citation patterns and research communities
- Explore the impact of specific papers or authors
- Generate interactive network visualizations

## Capabilities

### 1. Citation Network Construction
- Build directed graphs of paper citations
- Extract citation relationships from multiple sources
- Handle large-scale networks (1000+ papers)
- Weight edges by citation strength

### 2. Key Paper Identification
- PageRank algorithm to find influential papers
- Citation count analysis
- H-index calculation for authors
- Impact factor estimation

### 3. Community Detection
- Identify research clusters and communities
- Co-citation network analysis
- Bibliographic coupling detection
- Topic-based grouping

### 4. Temporal Analysis
- Track citation patterns over time
- Identify research trends and emerging topics
- Visualize evolution of research fields
- Timeline-based exploration

### 5. Interactive Visualization
- D3.js-based force-directed graphs
- Zoom and filter capabilities
- Node and edge highlighting
- Export to interactive HTML

### 6. Graph Metrics
- Network density and clustering coefficient
- Average path length
- Degree centrality
- Betweenness centrality
- Eigenvector centrality

## Input Format

The skill accepts:
- **papers** (required): Array of papers with DOIs or citation lists
- **maxDepth** (optional): Maximum depth for citation traversal (default: 2)
- **minCitations** (optional): Minimum citations to include (default: 1)
- **includeYear** (optional): Include year in analysis (default: true)
- **algorithm** (optional): Centrality algorithm to use (pagerank, degree, betweenness)

## Output Format

Returns an object with:
```typescript
{
  graph: {
    nodes: Array<{
      id: string;           // DOI or paper ID
      title: string;
      authors: string[];
      year: number;
      citations: number;    // Total citation count
      pageRank: number;     // PageRank score
      community: number;    // Community ID
      centrality: number;   // Centrality score
    }>;
    edges: Array<{
      source: string;      // Citing paper ID
      target: string;      // Cited paper ID
      weight: number;      // Citation strength
      year: number;        // Citation year
    }>;
  };
  metrics: {
    totalNodes: number;
    totalEdges: number;
    density: number;
    avgClustering: number;
    avgPathLength: number;
  };
  communities: Array<{
    id: number;
    size: number;
    topPapers: string[];   // Most influential papers
    keywords: string[];
  }>;
  keyPapers: Array<{
    id: string;
    title: string;
    pageRank: number;
    citations: number;
    reason: string;        // Why this paper is key
  }>;
  timeline: Array<{
    year: number;
    papers: number;
    citations: number;
    emergingTopics: string[];
  }>;
}
```

## Technical Implementation

### Data Sources
- **Semantic Scholar API**: Free, comprehensive citation data
  - Paper details: https://api.semanticscholar.org/graph/v1/paper/{DOI}
  - Citation data: https://api.semanticscholar.org/graph/v1/paper/{DOI}/citations
  - Backward citations: https://api.semanticscholar.org/graph/v1/paper/{DOI}/references

- **Crossref API**: Alternative source for citation data
- **OpenCitations**: Open citation data provider

### Graph Algorithms

**PageRank Algorithm**:
```javascript
function calculatePageRank(nodes, edges, dampingFactor = 0.85, iterations = 100) {
  // Initialize PageRank equally
  let pageRank = new Map(nodes.map(n => [n.id, 1/nodes.length]));

  for (let i = 0; i < iterations; i++) {
    const newPageRank = new Map();

    for (const node of nodes) {
      let rank = (1 - dampingFactor) / nodes.length;

      // Add rank from incoming edges
      const incoming = edges.filter(e => e.target === node.id);
      for (const edge of incoming) {
        const sourceOutDegree = edges.filter(e => e.source === edge.source).length;
        rank += dampingFactor * (pageRank.get(edge.source) / sourceOutDegree);
      }

      newPageRank.set(node.id, rank);
    }

    pageRank = newPageRank;
  }

  return pageRank;
}
```

**Community Detection (Louvain Method)**:
```javascript
function detectCommunities(nodes, edges) {
  // Modularity optimization
  // Returns community assignment for each node
}
```

### Visualization

**D3.js Force-Directed Graph**:
- Nodes sized by PageRank score
- Colors by community
- Edge thickness by citation weight
- Interactive zoom and pan
- Tooltip with paper details

**Export Formats**:
- HTML (interactive, with D3.js)
- JSON (graph data)
- GraphML (Gephi-compatible)
- CSV (adjacency matrix)

## Usage Examples

### Example 1: Basic Citation Graph
```javascript
import { CitationGraphService } from './citation-graph.service.mjs';

const graphService = new CitationGraphService();

const papers = [
  { doi: '10.1145/3366424.3383153' },  // Attention Is All You Need
  { doi: '10.1145/3442188.3445922' }   // BERT paper
];

const result = await graphService.buildGraph(papers, {
  maxDepth: 2,
  minCitations: 5
});

console.log(`Found ${result.graph.nodes.length} papers`);
console.log(`Top paper: ${result.keyPapers[0].title}`);
```

### Example 2: Key Paper Identification
```javascript
const result = await graphService.identifyKeyPapers(papers, {
  algorithm: 'pagerank',
  topK: 10
});

for (const paper of result.keyPapers) {
  console.log(`${paper.title}`);
  console.log(`  PageRank: ${paper.pageRank.toFixed(4)}`);
  console.log(`  Citations: ${paper.citations}`);
  console.log(`  Reason: ${paper.reason}\n`);
}
```

### Example 3: Temporal Analysis
```javascript
const result = await graphService.analyzeTimeline(papers, {
  startYear: 2018,
  endYear: 2024
});

for (const year of result.timeline) {
  console.log(`${year.year}: ${year.papers} papers, ${year.citations} citations`);
  console.log(`  Emerging: ${year.emergingTopics.join(', ')}`);
}
```

### Example 4: Interactive HTML Export
```javascript
const html = await graphService.exportToHTML(result, {
  outputPath: './demo/citation-graph.html',
  interactive: true,
  width: 1200,
  height: 800
});

console.log(`Graph exported to: ${html.outputPath}`);
```

## Quality Assurance

### Validation
- Verify DOI format and accessibility
- Check for duplicate papers
- Validate graph connectivity
- Ensure no orphaned nodes (unless intentional)

### Error Handling
- Handle API rate limits gracefully
- Fallback to alternative data sources
- Timeout handling for large graphs
- Memory management for big networks

### Performance
- Typical graph size: 100-1000 nodes
- Build time: 5-30 seconds depending on depth
- PageRank calculation: <1 second for 1000 nodes
- HTML export: 2-5 seconds

## Limitations

- **API Rate Limits**: Semantic Scholar API has rate limits (100 requests/5 minutes)
- **Incomplete Data**: Some papers may have missing citation information
- **Language Bias**: Better coverage for English papers
- **Time Lag**: Recent papers may not have complete citation data
- **Memory**: Very large graphs (>10,000 nodes) require significant memory

## Best Practices

1. **Start with small depth**: Use maxDepth=1 for initial exploration
2. **Filter by citations**: Use minCitations to reduce noise
3. **Cache results**: Store graph data to avoid re-fetching
4. **Combine with pdf-analyzer**: Get full paper details from PDFs
5. **Visualize strategically**: Large graphs (>500 nodes) may be hard to interpret
6. **Iterate**: Refine graph based on initial results

## Related Skills

- **pdf-analyzer**: Extract paper metadata from PDFs
- **literature-search**: Find papers to build graph from
- **semantic-search**: Find related papers for graph expansion
- **citation-manager**: Format citations extracted from graph

## Advanced Features

### Co-Citation Analysis
Papers that are frequently cited together are likely related:
```javascript
const coCitations = await graphService.findCoCitations(papers, {
  minCoCitations: 3,
  threshold: 0.7
});
```

### Bibliographic Coupling
Papers that cite similar papers are likely related:
```javascript
const coupling = await graphService.findBibliographicCoupling(papers, {
  minShared: 5
});
```

### Author Networks
Build collaboration networks:
```javascript
const authorGraph = await graphService.buildAuthorNetwork(papers);
```

### Research Trajectories
Identify research paths and influences:
```javascript
const trajectories = await graphService.findTrajectories({
  startPaper: doi,
  endPaper: doi,
  maxLength: 5
});
```
