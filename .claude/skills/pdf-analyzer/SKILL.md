---
name: pdf-analyzer
description: Deep analysis of PDF academic papers including table extraction, formula recognition, image extraction, and key information extraction
allowed-tools:
  - Read
  - Write
  - Bash
  - MCPTool
context: fork
---

# PDF Analyzer Skill

Advanced PDF analysis capability for academic papers using multiple parsing engines.

## When to Use

Use this skill when the user asks to:
- Analyze a PDF research paper
- Extract tables, formulas, or images from a PDF
- Get metadata and key information from a PDF
- Parse structured data from academic papers
- Extract references and citations from PDFs

## Capabilities

### 1. Metadata Extraction
- Title, authors, affiliations
- Publication date, venue, DOI
- Abstract, keywords
- Section headers and structure

### 2. Table Extraction
- Detect and extract tables from PDFs
- Convert tables to structured formats (CSV, JSON, Markdown)
- Handle complex multi-page tables
- Preserve table formatting and headers

### 3. Formula Recognition
- Identify mathematical formulas and equations
- Extract LaTeX representation when available
- Convert formulas to readable text
- Categorize formulas by type (inline, display)

### 4. Image and Figure Extraction
- Extract embedded images and figures
- Identify figure captions
- Extract figure metadata
- Save images to separate files

### 5. Content Analysis
- Extract section text (Introduction, Methods, Results, etc.)
- Identify key findings and conclusions
- Extract statistics and numerical data
- Identify citations and references

### 6. Structure Analysis
- Detect document structure (sections, subsections)
- Identify page numbers and page breaks
- Extract headers and footers
- Identify text formatting (bold, italic, etc.)

## Input Format

The skill accepts:
- **filePath** (required): Path to the PDF file
- **extractTables** (optional): Extract tables (default: true)
- **extractFormulas** (optional): Extract formulas (default: true)
- **extractImages** (optional): Extract images (default: false)
- **outputFormat** (optional): Output format for extracted data (json, markdown, csv)
- **outputDirectory** (optional): Directory to save extracted content

## Output Format

Returns an object with:
```typescript
{
  metadata: {
    title: string;
    authors: string[];
    abstract: string;
    keywords: string[];
    publicationDate: string;
    venue: string;
    doi: string;
  };
  structure: {
    sections: Array<{
      title: string;
      level: number;
      pageStart: number;
      content: string;
    }>;
  };
  tables?: Array<{
    id: string;
    caption: string;
    page: number;
    data: string[][]; // 2D array of cell contents
  }>;
  formulas?: Array<{
    id: string;
    type: 'inline' | 'display';
    content: string;
    latex?: string;
    page: number;
  }>;
  images?: Array<{
    id: string;
    caption: string;
    page: number;
    filePath: string;
  }>;
  keyFindings: string[];
  statistics: Array<{
    description: string;
    value: string;
    page: number;
  }>;
  references: Array<{
    title: string;
    authors: string[];
    year: number;
    source: string;
  }>;
}
```

## Technical Implementation

### PDF Parsing Libraries
- **pdf-parse**: Fast and reliable text extraction
- **pdf.js**: Advanced rendering and analysis
- **pdf2md**: Convert PDF to Markdown
- **Camelot**: Table extraction (via Python bridge)
- **Tabula**: Alternative table extraction

### Formula Recognition
- **Mathpix API**: Industry-leading formula recognition
- **LatexOCR**: Open-source alternative
- **Regex patterns**: Basic formula detection

### Image Extraction
- **pdfjs-dist**: Extract embedded images
- **sharp**: Image processing and format conversion

### Table Extraction
- **Camelot**: Advanced table detection
- **Tabula**: Robust table extraction
- **Custom algorithms**: Handle edge cases

## Usage Examples

### Example 1: Basic PDF Analysis
```bash
# Analyze a PDF and extract all information
bun analyze-pdf.mjs paper.pdf
```

### Example 2: Extract Only Tables
```bash
# Extract tables from PDF
bun analyze-pdf.mjs paper.pdf --extract-tables --output-format csv
```

### Example 3: Extract Formulas and Images
```bash
# Extract formulas and images
bun analyze-pdf.mjs paper.pdf --extract-formulas --extract-images --output-dir ./extracted
```

### Example 4: Full Analysis with JSON Output
```bash
# Full analysis with structured JSON output
bun analyze-pdf.mjs paper.pdf --full-analysis --output-format json --output analysis.json
```

## Quality Assurance

### Validation
- Check if PDF is readable and not corrupted
- Verify extracted text quality (OCR score if scanned)
- Validate table structure and cell counts
- Check formula extraction accuracy

### Error Handling
- Handle password-protected PDFs
- Gracefully handle corrupted pages
- Fallback to alternative parsing methods
- Report confidence scores for extractions

### Performance
- Typical analysis time: 2-5 seconds per page
- Parallel processing for multi-page documents
- Caching of parsed results
- Incremental processing for large PDFs

## Limitations

- Scanned PDFs require OCR (accuracy varies)
- Complex tables may need manual verification
- Handwritten formulas not supported
- Some PDF formats may not be fully supported
- Very large PDFs (>100 pages) may take longer

## Best Practices

1. **Always validate** the extracted data before using
2. **Use appropriate output format** for your use case
3. **Check confidence scores** for critical extractions
4. **Combine with other skills** (citation-manager, paper-structure) for full analysis
5. **Save intermediate results** for large PDFs to avoid re-processing

## Related Skills

- **citation-manager**: Format extracted citations
- **paper-structure**: Analyze document structure
- **literature-search**: Find similar papers
- **data-analysis**: Analyze extracted statistics
