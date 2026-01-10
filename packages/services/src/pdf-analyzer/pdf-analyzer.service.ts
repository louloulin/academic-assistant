/**
 * PDF Analyzer Service
 *
 * Advanced PDF analysis for academic papers with table extraction,
 * formula recognition, and metadata extraction.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface PDFAnalysisOptions {
  extractTables?: boolean;
  extractFormulas?: boolean;
  extractImages?: boolean;
  outputDirectory?: string;
}

export interface PDFMetadata {
  title: string;
  authors: string[];
  affiliations?: string[];
  abstract?: string;
  keywords?: string[];
  publicationDate?: string;
  venue?: string;
  doi?: string;
  pages?: number;
}

export interface PDFSection {
  title: string;
  level: number;
  pageStart: number;
  content: string;
}

export interface PDFTable {
  id: string;
  caption: string;
  page: number;
  data: string[][];
  headers?: string[];
}

export interface PDFFormula {
  id: string;
  type: 'inline' | 'display';
  content: string;
  latex?: string;
  page: number;
  confidence?: number;
}

export interface PDFImage {
  id: string;
  caption: string;
  page: number;
  filePath: string;
  width?: number;
  height?: number;
}

export interface PDFStatistics {
  description: string;
  value: string;
  page: number;
}

export interface PDFReference {
  title?: string;
  authors?: string[];
  year?: number;
  source?: string;
  pages?: string;
}

export interface PDFAnalysisResult {
  metadata: PDFMetadata;
  structure: {
    sections: PDFSection[];
  };
  tables?: PDFTable[];
  formulas?: PDFFormula[];
  images?: PDFImage[];
  keyFindings: string[];
  statistics: PDFStatistics[];
  references: PDFReference[];
  extractionInfo: {
    filePath: string;
    analyzedAt: string;
    processingTime: number;
    confidence: number;
  };
}

/**
 * PDF Analyzer Service
 */
export class PDFAnalyzerService {
  /**
   * Analyze a PDF file and extract structured information
   */
  async analyzePDF(
    filePath: string,
    options: PDFAnalysisOptions = {}
  ): Promise<PDFAnalysisResult> {
    const startTime = Date.now();

    // Validate file exists
    await this.validatePDF(filePath);

    // Extract text from PDF
    const text = await this.extractText(filePath);

    // Extract metadata
    const metadata = await this.extractMetadata(text, filePath);

    // Extract structure
    const structure = await this.extractStructure(text);

    // Extract tables if requested
    let tables: PDFTable[] | undefined;
    if (options.extractTables !== false) {
      tables = await this.extractTables(filePath, text);
    }

    // Extract formulas if requested
    let formulas: PDFFormula[] | undefined;
    if (options.extractFormulas !== false) {
      formulas = await this.extractFormulas(filePath, text);
    }

    // Extract images if requested
    let images: PDFImage[] | undefined;
    if (options.extractImages) {
      images = await this.extractImages(filePath, options.outputDirectory);
    }

    // Extract key findings
    const keyFindings = await this.extractKeyFindings(text);

    // Extract statistics
    const statistics = await this.extractStatistics(text);

    // Extract references
    const references = await this.extractReferences(text);

    const processingTime = Date.now() - startTime;

    return {
      metadata,
      structure,
      tables,
      formulas,
      images,
      keyFindings,
      statistics,
      references,
      extractionInfo: {
        filePath,
        analyzedAt: new Date().toISOString(),
        processingTime,
        confidence: this.calculateConfidence(text)
      }
    };
  }

  /**
   * Validate PDF file
   */
  private async validatePDF(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
      const ext = path.extname(filePath).toLowerCase();
      // Allow both .pdf and .txt for testing purposes
      if (ext !== '.pdf' && ext !== '.txt') {
        throw new Error(`File is not a PDF: ${filePath}`);
      }
    } catch (error) {
      throw new Error(`PDF file not found or inaccessible: ${filePath}`);
    }
  }

  /**
   * Extract text from PDF using pdf-parse
   */
  private async extractText(filePath: string): Promise<string> {
    try {
      // Check if it's a text file (for testing)
      if (path.extname(filePath).toLowerCase() === '.txt') {
        return await fs.readFile(filePath, 'utf-8');
      }

      // Dynamic import of pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(await fs.readFile(filePath));
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extract metadata from PDF text and file
   */
  private async extractMetadata(text: string, filePath: string): Promise<PDFMetadata> {
    const metadata: PDFMetadata = {
      title: this.extractTitle(text),
      authors: this.extractAuthors(text),
      pages: this.extractPageCount(text)
    };

    // Extract abstract
    const abstract = this.extractAbstract(text);
    if (abstract) metadata.abstract = abstract;

    // Extract keywords
    const keywords = this.extractKeywords(text);
    if (keywords.length > 0) metadata.keywords = keywords;

    // Extract DOI
    const doi = this.extractDOI(text);
    if (doi) metadata.doi = doi;

    return metadata;
  }

  /**
   * Extract title from text
   */
  private extractTitle(text: string): string {
    // Title is usually the first significant text
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      return lines[0].trim();
    }
    return path.basename(text);
  }

  /**
   * Extract authors from text
   */
  private extractAuthors(text: string): string[] {
    const authors: string[] = [];

    // Look for author patterns
    const authorPatterns = [
      /(?:author[s]?:?\s*)([^\n]+)/i,
      /(?:by\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i
    ];

    for (const pattern of authorPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const names = match[1].split(/[,&]/).map(n => n.trim());
        authors.push(...names);
        break;
      }
    }

    // If no authors found, try to extract names from first few lines
    if (authors.length === 0) {
      const lines = text.split('\n').slice(1, 5);
      for (const line of lines) {
        if (this.looksLikeAuthorName(line)) {
          authors.push(line.trim());
        }
      }
    }

    return authors;
  }

  /**
   * Check if text looks like an author name
   */
  private looksLikeAuthorName(text: string): boolean {
    // Pattern: Capitalized words with optional initials
    const pattern = /^[A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+$/;
    return pattern.test(text.trim());
  }

  /**
   * Extract page count
   */
  private extractPageCount(text: string): number {
    // Look for page break markers or count form feeds
    const pageCount = (text.match(/\f/g) || []).length;
    return pageCount > 0 ? pageCount : 1;
  }

  /**
   * Extract abstract from text
   */
  private extractAbstract(text: string): string | undefined {
    // Look for abstract section
    const abstractMatch = text.match(/(?:abstract|summary)\s*\n\s*(.+?)(?:\n\s*\n|\n\s*(?:keywords|introduction|1\.))/is);
    return abstractMatch ? abstractMatch[1].trim() : undefined;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];

    // Look for keywords section
    const keywordsMatch = text.match(/(?:keywords?|key\s+words?)\s*[:：]\s*(.+?)(?:\n|\r)/i);
    if (keywordsMatch && keywordsMatch[1]) {
      // Split by common separators
      const keywordList = keywordsMatch[1].split(/[;，、]/);
      keywords.push(...keywordList.map(k => k.trim()).filter(k => k.length > 0));
    }

    return keywords;
  }

  /**
   * Extract DOI from text
   */
  private extractDOI(text: string): string | undefined {
    const doiMatch = text.match(/DOI\s*[:：]?\s*(10\.\d+\/[^\s]+)/i);
    return doiMatch ? doiMatch[1] : undefined;
  }

  /**
   * Extract document structure
   */
  private async extractStructure(text: string): Promise<{ sections: PDFSection[] }> {
    const sections: PDFSection[] = [];
    const lines = text.split('\n');
    let currentPage = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect section headers (e.g., "1. Introduction", "Abstract", "References")
      const sectionMatch = line.match(/^(\d+\.?\d*\.?)\s+(.+)|^(abstract|introduction|related\s+work|methodology|methods|results|discussion|conclusion|references|acknowledgments?)$/i);

      if (sectionMatch) {
        const title = sectionMatch[2] || sectionMatch[1] || 'Unknown';
        const level = sectionMatch[1] && sectionMatch[1].includes('.') ? 2 : 1;

        sections.push({
          title: title.charAt(0).toUpperCase() + title.slice(1),
          level,
          pageStart: currentPage,
          content: this.extractSectionContent(lines, i)
        });
      }

      // Track page numbers
      if (line.includes('\f')) {
        currentPage++;
      }
    }

    return { sections };
  }

  /**
   * Extract content for a section
   */
  private extractSectionContent(lines: string[], startIndex: number): string {
    const content: string[] = [];
    let depth = 0;

    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Stop at next section
      if (/^\d+\.?\d*\.?\s+[A-Z]/.test(line)) {
        break;
      }

      // Stop at major sections
      if (/^(abstract|introduction|references|conclusion)$/i.test(line)) {
        break;
      }

      content.push(lines[i]);

      // Limit content length
      if (content.length > 100) {
        break;
      }
    }

    return content.join('\n').trim();
  }

  /**
   * Extract tables from PDF
   */
  private async extractTables(filePath: string, text: string): Promise<PDFTable[]> {
    const tables: PDFTable[] = [];

    // Look for table patterns in text
    const tablePattern = /table\s*\d+[:：]?\s*(.+?)(?=\n|$)/gi;
    let match;
    let tableId = 1;

    while ((match = tablePattern.exec(text)) !== null) {
      tables.push({
        id: `table-${tableId++}`,
        caption: match[1].trim(),
        page: this.estimatePageFromPosition(text, match.index),
        data: [] // Table data extraction would require more sophisticated parsing
      });
    }

    return tables;
  }

  /**
   * Extract formulas from PDF
   */
  private async extractFormulas(filePath: string, text: string): Promise<PDFFormula[]> {
    const formulas: PDFFormula[] = [];

    // Look for formula patterns
    const formulaPatterns = [
      /equation\s*\d+[:：]?\s*(.+?)(?=\n\n|\n\s*\n)/gi,
      /\$+([^$]+)\$+/g,
      /\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g
    ];

    let formulaId = 1;

    for (const pattern of formulaPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        formulas.push({
          id: `formula-${formulaId++}`,
          type: match[1].includes('\n') ? 'display' : 'inline',
          content: match[1].trim(),
          latex: match[1].trim(),
          page: this.estimatePageFromPosition(text, match.index),
          confidence: 0.8
        });
      }
    }

    return formulas;
  }

  /**
   * Extract images from PDF
   */
  private async extractImages(filePath: string, outputDir?: string): Promise<PDFImage[]> {
    // Image extraction requires pdf.js or similar library
    // For now, return empty array
    return [];
  }

  /**
   * Extract key findings from text
   */
  private async extractKeyFindings(text: string): Promise<string[]> {
    const findings: string[] = [];

    // Look for sentences with "find", "show", "demonstrate", "reveal"
    const findingPatterns = [
      /(?:our\s+)?(?:results?\s+)?(?:show|reveal|demonstrate|indicate|find|suggest)[^,.]*[,.]/gi,
      /we\s+(?:found|observed|demonstrated)[^,.]*[,.]/gi
    ];

    for (const pattern of findingPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        findings.push(match[0].trim());
      }
    }

    return findings.slice(0, 10); // Limit to 10 findings
  }

  /**
   * Extract statistics from text
   */
  private async extractStatistics(text: string): Promise<PDFStatistics[]> {
    const statistics: PDFStatistics[] = [];

    // Look for statistical patterns
    const statPatterns = [
      /(?:p\s*[<≤]\s*0\.\d+)|(?:F\s*\(\s*\d+\s*,\s*\d+\s*\)\s*=\s*[\d.]+)/gi,
      /(?:t\s*\(\s*\d+\s*\)\s*=\s*[\d.]+)/gi,
      /(?:r\s*=\s*[\d.]+)|(?:R²?\s*=\s*[\d.]+)/gi
    ];

    for (const pattern of statPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        statistics.push({
          description: 'Statistical result',
          value: match[0],
          page: this.estimatePageFromPosition(text, match.index)
        });
      }
    }

    return statistics.slice(0, 20); // Limit to 20 statistics
  }

  /**
   * Extract references from text
   */
  private async extractReferences(text: string): Promise<PDFReference[]> {
    const references: PDFReference[] = [];

    // Find references section
    const refsSection = text.match(/references?\s*\n([\s\S]+)/i);
    if (!refsSection) return references;

    const refsText = refsSection[1];

    // Extract individual references
    const refPatterns = [
      // Pattern: Author, A. A., & Author, B. B. (Year). Title. Source.
      /([A-Z][a-z]+,\s+[A-Z]\.\s*(?:&\s*)?)+\(\d{4}\)\.\s+[^.]+\.\s+[^.\n]+/g
    ];

    for (const pattern of refPatterns) {
      let match;
      while ((match = pattern.exec(refsText)) !== null) {
        const refText = match[0];
        references.push(this.parseReference(refText));
      }
    }

    return references;
  }

  /**
   * Parse a reference text
   */
  private parseReference(refText: string): PDFReference {
    const ref: PDFReference = {};

    // Extract year
    const yearMatch = refText.match(/\((\d{4})\)/);
    if (yearMatch) {
      ref.year = parseInt(yearMatch[1]);
    }

    // Extract title (text after year until first period)
    const titleMatch = refText.match(/\)\.\s+([^.(]+\.)/);
    if (titleMatch) {
      ref.title = titleMatch[1].trim();
    }

    // Extract source (after title)
    const sourceMatch = refText.match(/[^.(]+\.\s+([^\d]+)/);
    if (sourceMatch) {
      ref.source = sourceMatch[1].trim();
    }

    return ref;
  }

  /**
   * Estimate page number from text position
   */
  private estimatePageFromPosition(text: string, position: number): number {
    const beforePosition = text.substring(0, position);
    const pageBreaks = (beforePosition.match(/\f/g) || []).length;
    return pageBreaks + 1;
  }

  /**
   * Calculate confidence score for extraction
   */
  private calculateConfidence(text: string): number {
    let confidence = 0.5;

    // Check for common elements
    if (this.extractAbstract(text)) confidence += 0.1;
    if (this.extractAuthors(text).length > 0) confidence += 0.1;
    if (this.extractKeywords(text).length > 0) confidence += 0.1;
    if (this.extractDOI(text)) confidence += 0.1;
    if (this.extractKeyFindings(text).length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Export analysis result to JSON
   */
  async exportToJSON(result: PDFAnalysisResult, outputPath: string): Promise<void> {
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
  }

  /**
   * Export analysis result to Markdown
   */
  async exportToMarkdown(result: PDFAnalysisResult, outputPath: string): Promise<void> {
    const lines: string[] = [];

    // Metadata
    lines.push(`# ${result.metadata.title}\n`);
    lines.push(`**Authors**: ${result.metadata.authors.join(', ')}\n`);
    if (result.metadata.abstract) {
      lines.push(`**Abstract**: ${result.metadata.abstract}\n`);
    }

    // Structure
    lines.push('## Document Structure\n');
    for (const section of result.structure.sections) {
      lines.push(`- ${'  '.repeat(section.level)}${section.title} (Page ${section.pageStart})`);
    }

    // Tables
    if (result.tables && result.tables.length > 0) {
      lines.push('\n## Tables\n');
      for (const table of result.tables) {
        lines.push(`### ${table.id}`);
        lines.push(`${table.caption} (Page ${table.page})`);
      }
    }

    // Formulas
    if (result.formulas && result.formulas.length > 0) {
      lines.push('\n## Formulas\n');
      for (const formula of result.formulas) {
        lines.push(`### ${formula.id}`);
        lines.push(`Type: ${formula.type}`);
        lines.push(`Content: ${formula.content}`);
        if (formula.latex) {
          lines.push(`LaTeX: ${formula.latex}`);
        }
      }
    }

    // Key Findings
    if (result.keyFindings.length > 0) {
      lines.push('\n## Key Findings\n');
      for (const finding of result.keyFindings) {
        lines.push(`- ${finding}`);
      }
    }

    // Statistics
    if (result.statistics.length > 0) {
      lines.push('\n## Statistics\n');
      for (const stat of result.statistics) {
        lines.push(`- ${stat.description}: ${stat.value} (Page ${stat.page})`);
      }
    }

    // References
    if (result.references.length > 0) {
      lines.push('\n## References\n');
      for (const ref of result.references) {
        const authors = ref.authors?.join(', ') || '';
        const year = ref.year || '';
        const title = ref.title || '';
        const source = ref.source || '';
        lines.push(`- ${authors} (${year}). ${title}. ${source}`);
      }
    }

    // Extraction Info
    lines.push('\n## Extraction Information\n');
    lines.push(`- **File**: ${result.extractionInfo.filePath}`);
    lines.push(`- **Analyzed**: ${result.extractionInfo.analyzedAt}`);
    lines.push(`- **Processing Time**: ${result.extractionInfo.processingTime}ms`);
    lines.push(`- **Confidence**: ${(result.extractionInfo.confidence * 100).toFixed(1)}%`);

    await fs.writeFile(outputPath, lines.join('\n'));
  }
}
