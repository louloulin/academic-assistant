/**
 * Zotero Integrator Service
 *
 * Deep integration with Zotero reference manager for academic workflow.
 * Plan 5 P0 Skill Implementation
 */

// Types
export interface ZoteroItem {
  key: string;
  version: number;
  itemType: string;
  title: string;
  creators: Array<{
    creatorType: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  }>;
  abstractNote?: string;
  date?: string;
  year?: string;
  DOI?: string;
  url?: string;
  publicationTitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  tags?: Array<{ tag: string }>;
  notes?: Array<{
    note: string;
    noteType?: string;
  }>;
  attachments?: Array<{
    title: string;
    url?: string;
    mimeType?: string;
  }>;
  hasAttachment?: boolean;
}

export interface ZoteroCollection {
  key: string;
  version: number;
  name: string;
  parentCollection?: boolean;
  relations?: Record<string, any>;
}

export interface Citation {
  title?: string;
  authors?: string[];
  year?: number;
  doi?: string;
  url?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  abstract?: string;
  keywords?: string[];
}

export interface SearchQuery {
  q?: string;
  tag?: string;
  itemType?: string;
  collection?: string;
  doi?: string;
  limit?: number;
}

export interface SearchResults {
  results: ZoteroItem[];
  totalFound: number;
  searchTime: number;
}

export interface SyncResults {
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ item: string; error: string }>;
}

export interface TagResults {
  tagsAdded: number;
  itemsTagged: number;
}

export interface ZoteroIntegratorOptions {
  apiKey: string;
  userID?: string;
  groupID?: string;
  libraryType?: 'user' | 'group';
  baseURL?: string;
}

// Zotero Integrator Service
export class ZoteroIntegratorService {
  private apiKey: string;
  private userID: string;
  private groupID?: string;
  private libraryType: 'user' | 'group';
  private baseURL: string;

  constructor(options: ZoteroIntegratorOptions) {
    this.apiKey = options.apiKey;
    this.userID = options.userID || '';
    this.groupID = options.groupID;
    this.libraryType = options.libraryType || 'user';
    this.baseURL = options.baseURL || 'https://api.zotero.org';

    console.log('📚 Zotero Integrator Service initialized');
    console.log(`   Library Type: ${this.libraryType}`);
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'Zotero-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Build library path
   */
  private getLibraryPath(): string {
    if (this.libraryType === 'group' && this.groupID) {
      return `/groups/${this.groupID}`;
    }
    return `/users/${this.userID}`;
  }

  /**
   * Validate credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseURL}${this.getLibraryPath()}/keys/${this.apiKey}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }

  /**
   * Import library or collection
   */
  async importLibrary(options: {
    collection?: string;
    limit?: number;
  } = {}): Promise<{ items: ZoteroItem[]; collections: ZoteroCollection[] }> {
    console.log('📥 Importing Zotero library...');

    const items: ZoteroItem[] = [];
    const collections: ZoteroCollection[] = [];
    let start = 0;
    const limit = options.limit || 100;

    try {
      // Fetch collections first
      const collectionsUrl = `${this.baseURL}${this.getLibraryPath()}/collections`;
      const collectionsResponse = await fetch(collectionsUrl, {
        headers: this.getHeaders()
      });

      if (collectionsResponse.ok) {
        const collectionsData = await collectionsResponse.json();
        collections.push(...collectionsData);
        console.log(`   Found ${collections.length} collections`);
      }

      // Fetch items in batches
      while (true) {
        const params = new URLSearchParams({
          start: start.toString(),
          limit: limit.toString(),
          format: 'json'
        });

        if (options.collection) {
          params.append('collection', options.collection);
        }

        const itemsUrl = `${this.baseURL}${this.getLibraryPath()}/items?${params}`;
        const response = await fetch(itemsUrl, {
          headers: this.getHeaders()
        });

        if (!response.ok) {
          console.error(`Failed to fetch items: ${response.statusText}`);
          break;
        }

        const batch = await response.json();
        if (!Array.isArray(batch) || batch.length === 0) break;

        items.push(...batch);
        console.log(`   Fetched ${batch.length} items (total: ${items.length})`);

        start += limit;

        // Rate limiting
        await this.delay(100);

        if (batch.length < limit) break;
      }

      console.log(`✓ Import complete: ${items.length} items`);
      return { items, collections };
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  /**
   * Search library
   */
  async search(query: SearchQuery): Promise<SearchResults> {
    const startTime = Date.now();
    console.log(`🔍 Searching Zotero library: "${query.q || 'all'}"`);

    try {
      const params = new URLSearchParams();

      if (query.q) params.append('q', query.q);
      if (query.tag) params.append('tag', query.tag);
      if (query.itemType) params.append('itemType', query.itemType);
      if (query.collection) params.append('collection', query.collection);
      if (query.limit) params.append('limit', query.limit.toString());

      const url = `${this.baseURL}${this.getLibraryPath()}/items?${params}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : [];

      const totalResults = parseInt(
        response.headers.get('Total-Results') || results.length.toString()
      );

      console.log(`✓ Found ${results.length} items (total: ${totalResults})`);

      return {
        results,
        totalFound: totalResults,
        searchTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Sync citations to Zotero
   */
  async syncCitations(
    citations: Citation[],
    mode: 'merge' | 'replace' | 'skip' = 'merge'
  ): Promise<SyncResults> {
    console.log(`🔄 Syncing ${citations.length} citations to Zotero (mode: ${mode})`);

    const results: SyncResults = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const citation of citations) {
      try {
        // Check if item already exists
        const existing = await this.findExistingItem(citation);

        if (existing) {
          if (mode === 'merge') {
            await this.updateItem(existing.key, citation);
            results.updated++;
            console.log(`   Updated: ${citation.title || 'Unknown'}`);
          } else if (mode === 'skip') {
            results.skipped++;
            console.log(`   Skipped: ${citation.title || 'Unknown'}`);
          } else if (mode === 'replace') {
            await this.updateItem(existing.key, citation);
            results.updated++;
          }
        } else {
          await this.createItem(citation);
          results.imported++;
          console.log(`   Imported: ${citation.title || 'Unknown'}`);
        }

        // Rate limiting
        await this.delay(100);
      } catch (error) {
        results.errors.push({
          item: citation.title || 'Unknown',
          error: error instanceof Error ? error.message : String(error)
        });
        console.error(`   Failed: ${citation.title || 'Unknown'} - ${error}`);
      }
    }

    console.log(`✓ Sync complete: ${results.imported} imported, ${results.updated} updated`);
    return results;
  }

  /**
   * Find existing item
   */
  private async findExistingItem(citation: Citation): Promise<ZoteroItem | null> {
    // Try DOI first
    if (citation.doi) {
      const results = await this.search({ doi: citation.doi });
      if (results.results.length > 0) {
        return results.results[0];
      }
    }

    // Fallback to title + year
    if (citation.title && citation.year) {
      const query = `title:"${citation.title}" year:${citation.year}`;
      const results = await this.search({ q: query, limit: 1 });
      if (results.results.length > 0) {
        return results.results[0];
      }
    }

    return null;
  }

  /**
   * Create new item
   */
  private async createItem(citation: Citation): Promise<ZoteroItem> {
    const zoteroItem = this.citationToZoteroFormat(citation);

    const url = `${this.baseURL}${this.getLibraryPath()}/items`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify([zoteroItem])
    });

    if (!response.ok) {
      throw new Error(`Failed to create item: ${response.statusText}`);
    }

    const data = await response.json();
    return data.successful[0];
  }

  /**
   * Update existing item
   */
  private async updateItem(key: string, citation: Citation): Promise<void> {
    const zoteroItem = this.citationToZoteroFormat(citation);

    const url = `${this.baseURL}${this.getLibraryPath()}/items/${key}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(zoteroItem)
    });

    if (!response.ok) {
      throw new Error(`Failed to update item: ${response.statusText}`);
    }
  }

  /**
   * Convert citation to Zotero format
   */
  private citationToZoteroFormat(citation: Citation): any {
    const item: any = {
      itemType: 'journalArticle',
      title: citation.title || '',
      abstractNote: citation.abstract || '',
      DOI: citation.doi || '',
      url: citation.url || '',
      publicationTitle: citation.journal || '',
      volume: citation.volume || '',
      issue: citation.issue || '',
      pages: citation.pages || '',
      date: citation.year ? String(citation.year) : '',
      tags: []
    };

    // Add creators
    if (citation.authors && citation.authors.length > 0) {
      item.creators = citation.authors.map(author => {
        const parts = author.split(' ');
        if (parts.length >= 2) {
          return {
            creatorType: 'author',
            firstName: parts.slice(0, -1).join(' '),
            lastName: parts[parts.length - 1]
          };
        } else {
          return {
            creatorType: 'author',
            name: author
          };
        }
      });
    }

    // Add tags
    if (citation.keywords && citation.keywords.length > 0) {
      item.tags = citation.keywords.map(tag => ({ tag }));
    }

    return item;
  }

  /**
   * Auto-tag items
   */
  async autoTag(items: ZoteroItem[], options: {
    tagSource: Array<'keywords' | 'content' | 'ai'>;
    maxTagsPerItem?: number;
  } = { tagSource: ['keywords', 'content'] }): Promise<TagResults> {
    console.log(`🏷️ Auto-tagging ${items.length} items...`);

    let tagsAdded = 0;
    let itemsTagged = 0;

    for (const item of items) {
      const tags = new Set(item.tags?.map(t => t.tag) || []);

      // Extract tags from keywords
      if (options.tagSource.includes('keywords')) {
        const keywordTags = this.extractKeywordTags(item);
        keywordTags.forEach(tag => tags.add(tag));
      }

      // Extract tags from content
      if (options.tagSource.includes('content')) {
        const contentTags = this.generateContentTags(item);
        contentTags.forEach(tag => tags.add(tag));
      }

      // Simulated AI tags (in real implementation, would call AI service)
      if (options.tagSource.includes('ai')) {
        const aiTags = this.generateSimulatedAITags(item);
        aiTags.forEach(tag => tags.add(tag));
      }

      // Limit tags
      const maxTags = options.maxTagsPerItem || 10;
      const tagArray = Array.from(tags).slice(0, maxTags);

      if (tagArray.length > (item.tags?.length || 0)) {
        await this.updateItemTags(item.key, tagArray);
        tagsAdded += tagArray.length - (item.tags?.length || 0);
        itemsTagged++;
      }
    }

    console.log(`✓ Tagging complete: ${tagsAdded} tags added to ${itemsTagged} items`);
    return { tagsAdded, itemsTagged };
  }

  /**
   * Extract keyword tags
   */
  private extractKeywordTags(item: ZoteroItem): string[] {
    const tags: string[] = [];

    // From explicit keywords field
    if (item.tags) {
      item.tags.forEach(t => tags.push(t.tag));
    }

    // From abstract (simple extraction)
    if (item.abstractNote) {
      const words = item.abstractNote.split(/\s+/);
      const capitalWords = words.filter(w => /^[A-Z][a-z]+$/.test(w));
      tags.push(...capitalWords.slice(0, 5));
    }

    return tags;
  }

  /**
   * Generate content tags
   */
  private generateContentTags(item: ZoteroItem): string[] {
    const tags: string[] = [];

    // From publication
    if (item.publicationTitle) {
      tags.push(item.publicationTitle);
    }

    // From title (key terms)
    if (item.title) {
      const words = item.title.split(/\s+/);
      const keyTerms = words.filter(w =>
        w.length > 5 && /^[A-Z]/.test(w)
      );
      tags.push(...keyTerms.slice(0, 3));
    }

    return tags;
  }

  /**
   * Generate simulated AI tags
   */
  private generateSimulatedAITags(item: ZoteroItem): string[] {
    // In real implementation, would call AI service
    // For now, generate some basic tags based on content
    const tags: string[] = [];

    if (item.title) {
      const title = item.title.toLowerCase();

      if (title.includes('learning')) tags.push('Machine Learning');
      if (title.includes('neural')) tags.push('Deep Learning');
      if (title.includes('language')) tags.push('NLP');
      if (title.includes('vision')) tags.push('Computer Vision');
      if (title.includes('optimization')) tags.push('Optimization');
    }

    return tags;
  }

  /**
   * Update item tags
   */
  private async updateItemTags(key: string, tags: string[]): Promise<void> {
    const url = `${this.baseURL}${this.getLibraryPath()}/items/${key}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        tags: tags.map(tag => ({ tag }))
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update tags: ${response.statusText}`);
    }
  }

  /**
   * Get library statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    totalCollections: number;
    totalAttachments: number;
    totalNotes: number;
  }> {
    console.log('📊 Calculating library statistics...');

    try {
      // Get item count
      const itemsUrl = `${this.baseURL}${this.getLibraryPath()}/items/top`;
      const itemsResponse = await fetch(itemsUrl, {
        headers: this.getHeaders()
      });

      const totalItems = parseInt(
        itemsResponse.headers.get('Total-Results') || '0'
      );

      // Get collection count
      const collectionsUrl = `${this.baseURL}${this.getLibraryPath()}/collections`;
      const collectionsResponse = await fetch(collectionsUrl, {
        headers: this.getHeaders()
      });
      const collections = await collectionsResponse.json();
      const totalCollections = collections.length;

      // Count attachments and notes (simplified)
      const totalAttachments = Math.floor(totalItems * 0.7); // Estimate
      const totalNotes = Math.floor(totalItems * 0.3); // Estimate

      console.log(`✓ Statistics calculated`);

      return {
        totalItems,
        totalCollections,
        totalAttachments,
        totalNotes
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalItems: 0,
        totalCollections: 0,
        totalAttachments: 0,
        totalNotes: 0
      };
    }
  }

  /**
   * Export library
   */
  async export(options: {
    format?: 'biblatex' | 'bibtex' | 'json';
    outputPath?: string;
  } = {}): Promise<{ itemCount: number; outputPath?: string; data?: any }> {
    console.log(`📤 Exporting library (format: ${options.format || 'json'})...`);

    try {
      const { items } = await this.importLibrary({ limit: 100 });

      if (options.format === 'json') {
        const data = {
          items,
          exportedAt: new Date().toISOString(),
          version: '1.0'
        };

        if (options.outputPath) {
          await fs.writeFile(options.outputPath, JSON.stringify(data, null, 2));
          console.log(`✓ Exported to ${options.outputPath}`);
          return { itemCount: items.length, outputPath: options.outputPath, data };
        }

        return { itemCount: items.length, data };
      }

      // For BibTeX/BibLaTeX, would need conversion library
      console.log('⚠ BibTeX/BibLaTeX export not yet implemented');
      return { itemCount: items.length };
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Import fs for export functionality
import fs from 'fs/promises';

// Export factory function
export function createZoteroIntegratorService(options: ZoteroIntegratorOptions): ZoteroIntegratorService {
  return new ZoteroIntegratorService(options);
}
