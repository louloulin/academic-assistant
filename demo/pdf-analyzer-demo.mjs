#!/usr/bin/env bun
/**
 * PDF Analyzer Demo
 *
 * Demonstrates PDF analysis capabilities including:
 * - Metadata extraction
 * - Structure analysis
 * - Table extraction
 * - Formula recognition
 * - Key findings extraction
 */

import { PDFAnalyzerService } from '../packages/services/src/pdf-analyzer/pdf-analyzer.service.ts';
import { promises as fs } from 'fs';
import * as path from 'path';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           PDF Analyzer - Plan 5 P0 Skill Demo                      ║');
  console.log('║           Advanced PDF Analysis for Academic Papers              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  // Check if PDF file is provided
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('❌ Error: Please provide a PDF file path');
    console.log('\nUsage: bun demo/pdf-analyzer-demo.mjs <path-to-pdf> [options]');
    console.log('\nOptions:');
    console.log('  --extract-tables    Extract tables from PDF');
    console.log('  --extract-formulas  Extract formulas from PDF');
    console.log('  --extract-images    Extract images from PDF');
    console.log('  --output-format     Output format (json, markdown)');
    console.log('  --output-dir        Directory to save extracted content');
    console.log('\nExamples:');
    console.log('  bun demo/pdf-analyzer-demo.mjs paper.pdf');
    console.log('  bun demo/pdf-analyzer-demo.mjs paper.pdf --extract-formulas --output-format json');
    process.exit(1);
  }

  try {
    // Parse options
    const options = {
      extractTables: process.argv.includes('--extract-tables'),
      extractFormulas: process.argv.includes('--extract-formulas'),
      extractImages: process.argv.includes('--extract-images'),
      outputDirectory: process.argv[process.argv.indexOf('--output-dir') + 1] || './demo/pdf-output'
    };

    const outputFormat = process.argv[process.argv.indexOf('--output-format') + 1] || 'markdown';

    console.log(`📄 Analyzing PDF: ${pdfPath}`);
    console.log(`⚙️  Options:`);
    console.log(`   - Extract Tables: ${options.extractTables ? 'Yes' : 'No'}`);
    console.log(`   - Extract Formulas: ${options.extractFormulas ? 'Yes' : 'No'}`);
    console.log(`   - Extract Images: ${options.extractImages ? 'Yes' : 'No'}`);
    console.log(`   - Output Format: ${outputFormat}`);
    console.log(`   - Output Directory: ${options.outputDirectory}\n`);

    // Create output directory
    await fs.mkdir(options.outputDirectory, { recursive: true });

    // Initialize analyzer
    const analyzer = new PDFAnalyzerService();

    // Analyze PDF
    console.log('⏳ Starting PDF analysis...\n');
    const result = await analyzer.analyzePDF(pdfPath, options);

    // Display results
    console.log('✅ PDF Analysis Complete!\n');

    // Metadata
    console.log('📋 Metadata:');
    console.log(`   Title: ${result.metadata.title}`);
    console.log(`   Authors: ${result.metadata.authors.join(', ')}`);
    if (result.metadata.abstract) {
      console.log(`   Abstract: ${result.metadata.abstract.substring(0, 200)}...`);
    }
    if (result.metadata.keywords) {
      console.log(`   Keywords: ${result.metadata.keywords.join(', ')}`);
    }
    if (result.metadata.doi) {
      console.log(`   DOI: ${result.metadata.doi}`);
    }
    console.log();

    // Structure
    console.log('📑 Document Structure:');
    for (const section of result.structure.sections) {
      const indent = '  '.repeat(section.level);
      console.log(`   ${indent}- ${section.title} (Page ${section.pageStart})`);
    }
    console.log();

    // Tables
    if (result.tables && result.tables.length > 0) {
      console.log(`📊 Tables Found: ${result.tables.length}`);
      for (const table of result.tables) {
        console.log(`   - ${table.id}: ${table.caption} (Page ${table.page})`);
      }
      console.log();
    }

    // Formulas
    if (result.formulas && result.formulas.length > 0) {
      console.log(`🔢 Formulas Found: ${result.formulas.length}`);
      for (const formula of result.formulas.slice(0, 5)) {
        console.log(`   - ${formula.id}: ${formula.content.substring(0, 50)}... (Page ${formula.page}, Confidence: ${(formula.confidence! * 100).toFixed(0)}%)`);
      }
      console.log();
    }

    // Images
    if (result.images && result.images.length > 0) {
      console.log(`🖼️  Images Found: ${result.images.length}`);
      for (const image of result.images) {
        console.log(`   - ${image.id}: ${image.caption} (Page ${image.page})`);
      }
      console.log();
    }

    // Key Findings
    if (result.keyFindings.length > 0) {
      console.log(`🔑 Key Findings: ${result.keyFindings.length}`);
      for (const finding of result.keyFindings.slice(0, 5)) {
        console.log(`   - ${finding}`);
      }
      console.log();
    }

    // Statistics
    if (result.statistics.length > 0) {
      console.log(`📈 Statistics Found: ${result.statistics.length}`);
      for (const stat of result.statistics.slice(0, 5)) {
        console.log(`   - ${stat.description}: ${stat.value} (Page ${stat.page})`);
      }
      console.log();
    }

    // References
    if (result.references.length > 0) {
      console.log(`📚 References Found: ${result.references.length}`);
      for (const ref of result.references.slice(0, 5)) {
        const authors = ref.authors?.join(', ') || '';
        const year = ref.year || '';
        const title = ref.title || '';
        console.log(`   - ${authors} (${year}): ${title}`);
      }
      console.log();
    }

    // Extraction Info
    console.log('📊 Extraction Information:');
    console.log(`   Processing Time: ${result.extractionInfo.processingTime}ms`);
    console.log(`   Confidence: ${(result.extractionInfo.confidence * 100).toFixed(1)}%`);
    console.log();

    // Export results
    const baseName = path.basename(pdfPath, '.pdf');
    const outputFileName = `${baseName}-analysis.${outputFormat === 'json' ? 'json' : 'md'}`;
    const outputPath = path.join(options.outputDirectory, outputFileName);

    console.log(`💾 Saving results to: ${outputPath}`);

    if (outputFormat === 'json') {
      await analyzer.exportToJSON(result, outputPath);
    } else {
      await analyzer.exportToMarkdown(result, outputPath);
    }

    console.log('✅ Results saved successfully!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 PDF Analysis Demo Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error during PDF analysis:', error.message);
    process.exit(1);
  }
}

// Run the demo
main();
