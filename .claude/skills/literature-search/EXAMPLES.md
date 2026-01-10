# Literature Search Examples

## Example 1: Basic Search

**Request**: "Find recent papers on large language models"

**Process**:
1. Extract query: "large language models"
2. Set sources: ["arxiv", "semantic-scholar"]
3. Set yearFrom: 2023 (recent papers)
4. Execute search
5. Return top 10 papers

**Sample Output**:
```
Found 10 papers on "large language models" (2023-2024)

1. "Attention Is All You Need" by Vaswani et al. (2017)
   Citation: 120,000+
   Summary: Introduced the transformer architecture...
   
2. "Language Models are Few-Shot Learners" by Brown et al. (2020)
   Citation: 25,000+
   Summary: Demonstrated GPT-3's few-shot capabilities...
```

## Example 2: Filtered Search

**Request**: "Search for medical AI papers from 2020-2023"

**Process**:
1. Query: "medical artificial intelligence"
2. Sources: ["pubmed", "semantic-scholar"]
3. Year range: 2020-2023
4. Max results: 20

## Example 3: Venue-Specific Search

**Request**: "Find NeurIPS papers from 2023"

**Process**:
1. Query: "machine learning"
2. Sources: ["semantic-scholar"]
3. Filter: venue="NeurIPS", year=2023

## Example 4: Author Search

**Request**: "Find papers by Geoffrey Hinton"

**Process**:
1. Query: "Geoffrey Hinton"
2. Search across all sources
3. Sort by citation count
