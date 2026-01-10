# Workflow Manager Examples

## Example 1: Complete Literature Review

**User Request**: "Write a literature review on large language models, focusing on architectures and training methods from 2020-2023"

**Workflow Execution**:

```
[Step 1/5] Searching literature...
  Query: "large language models architecture training"
  Sources: arxiv, semantic-scholar
  Year: 2020-2023
  Max results: 20
  
✓ Found 20 papers

[Step 2/5] Analyzing papers...
  Grouping by themes:
    - Transformer architectures (8 papers)
    - Training methods (7 papers)
    - Efficiency improvements (5 papers)
  
✓ Analysis complete

[Step 3/5] Generating outline...
  I. Introduction
  II. Transformer Architectures
  III. Training Methods
  IV. Efficiency Techniques
  V. Future Directions
  
✓ Outline created

[Step 4/5] Writing review...
  Drafting each section with citations...
  
✓ Draft complete (2500 words)

[Step 5/5] Formatting citations...
  Style: APA 7th edition
  Citations: 20
  
✓ Bibliography generated

═══════════════════════════════════════
Literature Review Complete

Title: "Large Language Models: Architectures and Training Methods (2020-2023)"

Length: 2,500 words
Papers reviewed: 20
Citations formatted: 20

[Download] [Copy to clipboard]
```

## Example 2: Research Paper Structure

**User Request**: "Create a structure for a paper on AI in healthcare"

**Workflow Execution**:

```
[Step 1/4] Analyzing topic...
  Domain: Healthcare AI
  Target audience: Medical informatics researchers
  
✓ Topic analyzed

[Step 2/4] Searching related work...
  Query: "artificial intelligence healthcare medical"
  Papers: 15 relevant papers found
  
✓ Literature collected

[Step 3/4] Creating IMRaD structure...
  Abstract (250 words)
  
  I. Introduction
     - Background
     - Problem statement
     - Research questions
  
  II. Methods
     - Study design
     - Data collection
     - Analysis approach
  
  III. Results
     - Findings
     - Statistical analysis
     - Visualizations
  
  IV. Discussion
     - Interpretation
     - Limitations
     - Future work
  
  References (15 papers)
  
✓ Structure created

[Step 4/4] Adding section guidance...
  Each section includes:
    - Writing guidelines
    - Word count suggestions
    - Key points to cover
    - Citation placeholders
  
✓ Complete paper structure generated

═══════════════════════════════════════
Paper Structure Ready

Title: "Artificial Intelligence in Healthcare: A Comprehensive Review"

Total sections: 4 + References
Estimated length: 5,000 words
Guidance provided for each section

[Export] [Save as template]
```

## Example 3: Citation Management

**User Request**: "Format these 5 papers in MLA style"

**Input Data**:
```json
[
  {
    "title": "Attention Is All You Need",
    "authors": [{"first": "Ashish", "last": "Vaswani"}],
    "year": 2017,
    "venue": "NeurIPS"
  },
  {
    "title": "BERT: Pre-training of Deep Bidirectional Transformers",
    "authors": [
      {"first": "Jacob", "last": "Devlin"},
      {"first": "Ming-Wei", "last": "Chang"}
    ],
    "year": 2019,
    "venue": "NAACL"
  }
]
```

**Workflow Execution**:

```
[Step 1/2] Validating citations...
  Checking required fields...
  ✓ All papers valid
  
[Step 2/2] Formatting in MLA style...
  Paper 1: Vaswani ✓
  Paper 2: Devlin, Chang ✓
  
✓ All citations formatted

═══════════════════════════════════════
Citations Formatted (MLA 9th Edition)

1. Vaswani, Ashish. "Attention Is All You Need." NeurIPS, 2017.

2. Devlin, Jacob, and Ming-Wei Chang. "BERT: Pre-training of Deep Bidirectional Transformers." NAACL, 2019.

[Copy all] [Export BibTeX]
```

## Example 4: Quality Check

**User Request**: "Review this draft for quality"

**Workflow Execution**:

```
[Step 1/3] Checking structure...
  ✓ IMRaD format followed
  ✓ Section headings correct
  ✓ Logical flow maintained
  
[Step 2/3] Analyzing writing quality...
  ✓ Grammar: No issues
  ⚠ Clarity: 3 sentences need revision
  ✓ Academic tone: Appropriate
  
[Step 3/3] Checking citations...
  ✓ All citations formatted correctly
  ⚠ 2 citations missing DOIs
  ✓ Reference list complete

═══════════════════════════════════════
Quality Review Complete

Overall Score: 8.5/10

Strengths:
  ✓ Clear structure
  ✓ Good flow
  ✓ Proper citations

Issues Found:
  ⚠ 3 sentences need clarity improvement
  ⚠ 2 citations need DOIs

Recommendations:
  1. Revise long sentences (>30 words)
  2. Add DOIs where missing
  3. Consider adding more recent references

[Apply fixes] [View details]
```
