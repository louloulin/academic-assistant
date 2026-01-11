---
name: semantic-search
description: Semantic literature search using embeddings and vector similarity to find papers beyond keyword matching
allowed-tools:
  - WebSearch
  - WebFetch
  - Read
  - Write
  - Bash
  - MCPTool
context: fork
---

# Semantic Search Skill

Advanced semantic literature search that goes beyond keyword matching to find papers based on meaning and conceptual similarity.

## When to Use

Use this skill when the user asks to:
- Find papers semantically similar to a given paper or topic
- Search for research using natural language queries
- Discover related papers that don't share exact keywords
- Explore research concepts across different terminology
- Find papers that address similar research questions
- Conduct comprehensive literature reviews

## Capabilities

### 1. Semantic Query Understanding
- Parse natural language research queries
- Extract key concepts and research intent
- Identify domain-specific terminology
- Expand queries with related concepts
- Handle multi-language queries (e.g., English query → Chinese papers)

### 2. Embedding Generation
- Convert papers/query to vector embeddings
- Use OpenAI text-embedding-3 or Claude Embeddings
- Handle multi-lingual text embedding
- Cache embeddings for efficiency
- Batch embedding for multiple papers

### 3. Vector Similarity Search
- Cosine similarity calculation
- Euclidean distance alternative
- Hybrid search (semantic + keyword)
- Re-ranking with relevance scores
- Top-K retrieval

### 4. Query Expansion
- Synonym expansion
- Concept generalization/specialization
- Related field suggestions
- Automatic query refinement
- Learning from user feedback

### 5. Cross-Domain Search
- Find papers in related fields
- Identify interdisciplinary connections
- Bridge terminology gaps
- Concept translation across domains

### 6. Result Ranking and Filtering
- Semantic relevance scoring (0-1)
- Citation count weighting
- Recency boosting
- Venue quality weighting
- Personalization based on user history

## Input Format

```typescript
{
  query: string;              // Natural language query
  database?: 'arxiv' | 'semantic-scholar' | 'pubmed' | 'all';
  maxResults?: number;        // Default: 20
  minSimilarity?: number;     // 0-1, Default: 0.7
  expandQuery?: boolean;      // Auto-expand query, Default: true
  fields?: string[];          // Restrict to fields (e.g., ['ML', 'NLP'])
  yearRange?: [number, number]; // Filter by year
  embeddingModel?: 'openai' | 'cohere' | 'voyage';
  searchMode?: 'semantic' | 'hybrid' | 'keyword';
}
```

## Output Format

```typescript
{
  query: string;
  expandedQuery?: string[];
  embeddingVector: number[];  // The query embedding

  results: Array<{
    paperId: string;
    title: string;
    authors: string[];
    year: number;
    abstract: string;
    venue?: string;
    citations?: number;

    // Semantic scores
    similarityScore: number;   // 0-1
    relevanceScore: number;    // Combined score
    matchReasons: string[];    // Why this matches

    // Metadata
    concepts: string[];        // Key concepts matched
    fields: string[];          // Research fields
    openAccess?: boolean;
  }>;

  searchMetrics: {
    totalFound: number;
    returned: number;
    searchTime: number;        // milliseconds
    avgSimilarity: number;
    queryExpansion: boolean;
  };

  suggestions?: {
    alternativeQueries: string[];
    relatedConcepts: string[];
    broaderTopics: string[];
    narrowerTopics: string[];
  };
}
```

## Technical Implementation

### 1. Real Claude Agent SDK Integration

This skill uses the **real Claude Agent SDK** with `query()` function:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

class SemanticSearchService {
  async semanticSearch(searchQuery: string): Promise<SearchResults> {
    // Use real Claude Agent SDK query to understand semantic intent
    const intent = await this.analyzeSemanticIntent(searchQuery);

    // Generate embeddings using real embedding service
    const queryEmbedding = await this.generateEmbedding(searchQuery);

    // Search vector database
    const results = await this.searchVectorDB(queryEmbedding);

    // Re-rank using Claude for semantic relevance
    const ranked = await this.rankResults(results, searchQuery);

    return ranked;
  }

  private async analyzeSemanticIntent(query: string): Promise<SearchIntent> {
    // Real Claude Agent SDK call - no mocks!
    const response = await query({
      prompt: `Analyze this research query and extract key concepts, research intent, and suggested expansions: "${query}"

Return JSON with:
{
  "concepts": ["concept1", "concept2"],
  "intent": "survey|experimental|theoretical|comparison",
  "expansions": ["expansion1", "expansion2"],
  "fields": ["field1", "field2"]
}`,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1
      }
    });

    // Parse Claude's response
    return this.parseIntentResponse(response);
  }
}
```

### 2. Embedding Generation

```typescript
class EmbeddingService {
  private apiKey: string;
  private model = 'text-embedding-3-small'; // OpenAI

  async generateEmbedding(text: string): Promise<number[]> {
    // Real OpenAI API call - no mocks!
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: this.model,
        dimensions: 1536
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    // Batch embedding for efficiency
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }
}
```

### 3. Vector Database (Qdrant Integration)

```typescript
class VectorDatabase {
  private client: QdrantClient;
  private collection = 'academic-papers';

  async search(queryEmbedding: number[], limit: number = 20): Promise<Paper[]> {
    // Real Qdrant search - no mocks!
    const response = await this.client.search(this.collection, {
      vector: queryEmbedding,
      limit: limit,
      score_threshold: 0.7,
      with_payload: ['title', 'authors', 'year', 'abstract', 'venue', 'citations']
    });

    return response.map(result => ({
      paperId: result.id,
      similarityScore: result.score,
      ...result.payload
    }));
  }

  async indexPaper(paper: Paper, embedding: number[]): Promise<void> {
    // Real Qdrant upsert - no mocks!
    await this.client.upsert(this.collection, {
      points: [
        {
          id: paper.paperId,
          vector: embedding,
          payload: paper
        }
      ]
    });
  }
}
```

### 4. Semantic Re-ranking with Claude

```typescript
class ReRankingService {
  async reRank(results: Paper[], query: string): Promise<Paper[]> {
    // Use Claude to understand true semantic relevance
    const scores = await Promise.all(
      results.map(async paper => {
        const score = await this.assessRelevance(paper, query);
        return { ...paper, relevanceScore: score };
      })
    );

    // Sort by relevance score
    return scores.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async assessRelevance(paper: Paper, query: string): Promise<number> {
    // Real Claude call for semantic assessment - no mocks!
    const response = await query({
      prompt: `Assess the semantic relevance of this paper to the research query on a scale of 0-1.

Query: ${query}

Paper Title: ${paper.title}
Abstract: ${paper.abstract}

Consider:
- Conceptual overlap
- Methodological similarity
- Problem domain alignment
- Potential for citation

Return only a number between 0 and 1.`,
      options: {
        model: 'claude-sonnet-4-5',
        maxTurns: 1
      }
    });

    // Extract score from response
    const scoreMatch = response.match(/0?\.\d+/);
    return scoreMatch ? parseFloat(scoreMatch[0]) : 0.5;
  }
}
```

## Usage Examples

### Example 1: Basic Semantic Search
```typescript
const semanticSearch = new SemanticSearchService();

const results = await semanticSearch.search({
  query: 'How do transformers work for natural language understanding?',
  maxResults: 10
});

console.log(`Found ${results.results.length} semantically similar papers`);
results.results.forEach((paper, i) => {
  console.log(`${i + 1}. ${paper.title}`);
  console.log(`   Similarity: ${paper.similarityScore.toFixed(3)}`);
  console.log(`   Concepts: ${paper.concepts.join(', ')}`);
});
```

### Example 2: Cross-Domain Search
```typescript
const results = await semanticSearch.search({
  query: 'attention mechanisms in computer vision',
  expandQuery: true,
  fields: ['Computer Vision', 'Machine Learning']
});

// Finds papers even if they don't mention "attention" directly
// but use similar concepts like "feature weighting", "saliency maps", etc.
```

### Example 3: Hybrid Search (Semantic + Keyword)
```typescript
const results = await semanticSearch.search({
  query: 'graph neural networks for molecular property prediction',
  searchMode: 'hybrid',
  maxResults: 20
});

// Combines semantic similarity with keyword matching
// for best of both worlds
```

### Example 4: Find Related Papers
```typescript
// Given a paper, find semantically similar papers
const seedPaper = {
  title: 'Attention Is All You Need',
  abstract: 'The dominant sequence transduction models...'
};

const related = await semanticSearch.findSimilar(seedPaper, {
  maxResults: 15,
  minSimilarity: 0.75
});
```

### Example 5: Concept Exploration
```typescript
const results = await semanticSearch.exploreConcept({
  concept: 'federated learning',
  aspects: ['privacy', 'efficiency', 'communication'],
  maxResults: 10
});

// Explores different aspects of a concept
```

## Setup and Configuration

### 1. Environment Variables

```bash
# OpenAI API for embeddings
export OPENAI_API_KEY="sk-..."

# Qdrant for vector database
export QDRANT_URL="http://localhost:6333"
export QDRANT_API_KEY="..."

# Anthropic API for Claude
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 2. Initialize Vector Database

```bash
# Install Qdrant
curl -L https://github.com/qdrant/qdrant/releases/latest/download/qdrant-linux-x86_64.tar.gz | tar xz
./qdrant

# Or use Docker
docker run -p 6333:6333 qdrant/qdrant
```

```typescript
// Create collection
await qdrant.createCollection('academic-papers', {
  vectors: {
    size: 1536, // OpenAI embedding dimension
    distance: 'Cosine'
  }
});
```

### 3. Index Papers

```typescript
// Batch index papers from existing database
const papers = await loadPapersFromDB();

for (const paper of papers) {
  const embedding = await embeddingService.generateEmbedding(
    `${paper.title} ${paper.abstract}`
  );

  await vectorDB.indexPaper(paper, embedding);
}
```

## Performance Optimization

### 1. Embedding Caching

```typescript
class EmbeddingCache {
  private cache = new Map<string, number[]>();

  async get(text: string): Promise<number[] | null> {
    return this.cache.get(text) || null;
  }

  async set(text: string, embedding: number[]): Promise<void> {
    this.cache.set(text, embedding);
  }
}
```

### 2. Batch Processing

```typescript
// Process multiple queries in parallel
const results = await Promise.all(
  queries.map(q => semanticSearch.search(q))
);
```

### 3. Incremental Indexing

```typescript
// Index new papers as they're added
async function onNewPaper(paper: Paper) {
  const embedding = await generateEmbedding(paper);
  await vectorDB.indexPaper(paper, embedding);
}
```

## Limitations

- **Embedding Quality**: Dependent on embedding model (OpenAI, Cohere, etc.)
- **Computational Cost**: Embedding generation requires API calls
- **Index Size**: Large databases need significant storage
- **Freshness**: New papers not in index won't be found
- **Language Bias**: Better performance for English papers

## Best Practices

1. **Combine with Keyword Search**: Hybrid mode often works best
2. **Regular Re-indexing**: Keep index updated with new papers
3. **Query Expansion**: Let the system suggest related concepts
4. **Relevance Feedback**: Learn from user clicks and citations
5. **Caching**: Cache embeddings for frequent queries
6. **Batch Operations**: Use batch embedding for efficiency

## Related Skills

- **literature-search**: Traditional keyword-based search
- **citation-graph**: Find related papers via citations
- **pdf-analyzer**: Extract content for embedding
- **conversational-editor**: Natural language query interface
- **workflow-manager**: Orchestrate multi-step literature reviews

## Advanced Features

### 1. Multi-Modal Search

```typescript
// Search using text + images
const results = await semanticSearch.multiModalSearch({
  text: 'transformer architecture',
  image: './attention-mechanism.png'
});
```

### 2. Temporal Semantic Search

```typescript
// Track concept evolution over time
const evolution = await semanticSearch.trackConceptEvolution({
  concept: 'neural network',
  startYear: 2010,
  endYear: 2024,
  granularity: 'year'
});
```

### 3. Semantic Clustering

```typescript
// Cluster papers by semantic similarity
const clusters = await semanticSearch.clusterResults({
  results: searchResults,
  numClusters: 5,
  algorithm: 'kmeans'
});
```

### 4. Question Answering

```typescript
// Directly answer research questions
const answer = await semanticSearch.answerQuestion({
  question: 'What are the main challenges in federated learning?',
  numPapers: 10
});
```

### 5. Semantic Paper Recommendations

```typescript
// Personalized recommendations based on user library
const recommendations = await semanticSearch.recommend({
  userLibrary: userPapers,
  readingHistory: userHistory,
  numRecommendations: 5
});
```
