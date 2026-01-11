---
name: zotero-integrator
description: Integrate with Zotero reference manager to import libraries, sync citations, and manage research collections
allowed-tools:
  - Read
  - Write
  - Bash
  - WebFetch
  - WebSearch
context: fork
---

# Zotero Integrator Skill

Deep integration with Zotero reference manager for seamless academic workflow.

## When to Use

Use this skill when the user asks to:
- Import their Zotero library
- Search their Zotero collection
- Sync citations to/from Zotero
- Add tags or notes to Zotero items
- Export papers to Zotero
- Organize research in Zotero collections
- Backup or migrate Zotero data

## Capabilities

### 1. Library Import
- Import entire Zotero library or specific collections
- Fetch item metadata (title, authors, year, DOI, etc.)
- Download PDF attachments
- Preserve Zotero item types and fields
- Handle group libraries

### 2. Semantic Search
- Full-text search across Zotero library
- Filter by collection, tags, item type
- Search by author, year, publication
- Combine multiple search criteria

### 3. Citation Sync
- Export formatted citations from Zotero
- Import new citations to Zotero
- Update existing items
- Batch sync operations
- Conflict resolution

### 4. Tag Management
- Auto-generate tags from content
- Apply tags to multiple items
- Create tag hierarchies
- Clean up duplicate tags

### 5. Note Management
- Add notes to Zotero items
- Extract key quotes from PDFs
- Generate summaries as notes
- Link notes across items

### 6. Collection Organization
- Create new collections
- Move items between collections
- Build collection hierarchies
- Smart collections based on criteria

## Input Format

```typescript
{
  action: 'import' | 'search' | 'sync' | 'tag' | 'organize' | 'export';
  apiKey?: string;          // Zotero API key
  userID?: string;          // Zotero user ID
  libraryType?: 'user' | 'group';
  groupID?: string;         // For group libraries

  // Search parameters
  query?: string;
  collection?: string;
  tags?: string[];
  itemTypes?: string[];
  limit?: number;

  // Sync parameters
  citations?: Citation[];
  mode?: 'merge' | 'replace' | 'skip';

  // Tag parameters
  autoTag?: boolean;
  tagSource?: 'content' | 'keywords' | 'ai';

  // Export parameters
  format?: 'biblatex' | 'bibtex' | 'apa' | 'mla' | 'chicago';
  outputPath?: string;
}
```

## Output Format

```typescript
{
  success: boolean;
  message: string;

  // Import results
  items?: ZoteroItem[];
  collections?: ZoteroCollection[];

  // Search results
  results?: ZoteroItem[];
  totalFound?: number;
  searchTime?: number;

  // Sync results
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: Array<{ item: string; error: string }>;

  // Tag results
  tagsAdded?: number;
  itemsTagged?: number;

  // Stats
  stats?: {
    totalItems: number;
    totalCollections: number;
    totalAttachments: number;
    totalNotes: number;
  };
}
```

## Technical Implementation

### Zotero API Authentication

```typescript
class ZoteroAuth {
  private apiKey: string;
  private userID: string;
  private baseURL = 'https://api.zotero.org';

  constructor(apiKey: string, userID: string) {
    this.apiKey = apiKey;
    this.userID = userID;
  }

  getHeaders(): Headers {
    return new Headers({
      'Zotero-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  async validateCredentials(): Promise<boolean> {
    // Test API key with a simple request
    const response = await fetch(
      `${this.baseURL}/users/${this.userID}/keys/${this.apiKey}`,
      { headers: this.getHeaders() }
    );
    return response.ok;
  }
}
```

### Library Import

```typescript
class ZoteroImporter {
  async importLibrary(options: ImportOptions): Promise<ZoteroItem[]> {
    const items: ZoteroItem[] = [];
    let start = 0;
    const limit = 100;

    while (true) {
      // Fetch items in batches
      const batch = await this.fetchItems({
        start,
        limit,
        collection: options.collection,
        format: 'json'
      });

      if (batch.length === 0) break;

      items.push(...batch);
      start += limit;

      // Rate limiting: Zotero allows ~10 requests/second for personal keys
      await this.delay(100);
    }

    return items;
  }

  async importItem(itemKey: string): Promise<ZoteroItem | null> {
    const response = await fetch(
      `${this.baseURL}/users/${this.userID}/items/${itemKey}`,
      { headers: this.auth.getHeaders() }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return this.parseZoteroItem(data);
  }
}
```

### Semantic Search

```typescript
class ZoteroSearcher {
  async search(query: SearchQuery): Promise<SearchResults> {
    // Build search URL with parameters
    const params = new URLSearchParams();

    if (query.q) params.append('q', query.q);
    if (query.tag) params.append('tag', query.tag);
    if (query.itemType) params.append('itemType', query.itemType);
    if (query.collection) params.append('collection', query.collection);

    const url = `${this.baseURL}/users/${this.userID}/items/${params.toString()}`;

    const response = await fetch(url, {
      headers: this.auth.getHeaders()
    });

    const data = await response.json();

    return {
      results: data.map(item => this.parseZoteroItem(item)),
      totalFound: parseInt(response.headers.get('Total-Results') || '0'),
      searchTime: Date.now() - startTime
    };
  }

  async fullTextSearch(query: string): Promise<ZoteroItem[]> {
    // Search full-text content (requires Zotero full-text sync)
    const results = await this.search({
      q: query
    });

    // Filter for items with attachments
    return results.filter(item => item.hasAttachment);
  }
}
```

### Citation Sync

```typescript
class ZoteroSync {
  async syncCitations(citations: Citation[], mode: SyncMode): Promise<SyncResults> {
    const results: SyncResults = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const citation of citations) {
      try {
        // Check if item already exists (by DOI or title+year)
        const existing = await this.findExistingItem(citation);

        if (existing) {
          if (mode === 'merge') {
            // Merge with existing item
            await this.updateItem(existing.key, citation);
            results.updated++;
          } else if (mode === 'skip') {
            results.skipped++;
          }
        } else {
          // Create new item
          await this.createItem(citation);
          results.imported++;
        }
      } catch (error) {
        results.errors.push({
          item: citation.title || 'Unknown',
          error: error.message
        });
      }
    }

    return results;
  }

  async createItem(citation: Citation): Promise<ZoteroItem> {
    const zoteroItem = this.citationToZoteroFormat(citation);

    const response = await fetch(
      `${this.baseURL}/users/${this.userID}/items`,
      {
        method: 'POST',
        headers: this.auth.getHeaders(),
        body: JSON.stringify(zoteroItem)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create item: ${response.statusText}`);
    }

    const created = await response.json();
    return this.parseZoteroItem(created.successful[0]);
  }

  async findExistingItem(citation: Citation): Promise<ZoteroItem | null> {
    // Try DOI first
    if (citation.doi) {
      const results = await this.search({ doi: citation.doi });
      if (results.length > 0) return results[0];
    }

    // Fallback to title + year
    if (citation.title && citation.year) {
      const results = await this.search({
        q: `title:"${citation.title}" year:${citation.year}`
      });
      if (results.length > 0) return results[0];
    }

    return null;
  }
}
```

### Tag Management

```typescript
class ZoteroTagger {
  async autoTagItems(items: ZoteroItem[], options: TagOptions): Promise<TagResults> {
    let tagsAdded = 0;
    let itemsTagged = 0;

    for (const item of items) {
      const tags = new Set(item.tags || []);

      // Extract tags from different sources
      if (options.tagSource.includes('keywords')) {
        const keywordTags = this.extractKeywordTags(item);
        keywordTags.forEach(tag => tags.add(tag));
      }

      if (options.tagSource.includes('content')) {
        const contentTags = await this.generateContentTags(item);
        contentTags.forEach(tag => tags.add(tag));
      }

      if (options.tagSource.includes('ai')) {
        const aiTags = await this.generateAITags(item);
        aiTags.forEach(tag => tags.add(tag));
      }

      // Update item with new tags
      if (tags.size > (item.tags?.length || 0)) {
        await this.updateItemTags(item.key, Array.from(tags));
        tagsAdded += tags.size - (item.tags?.length || 0);
        itemsTagged++;
      }
    }

    return { tagsAdded, itemsTagged };
  }

  private extractKeywordTags(item: ZoteroItem): string[] {
    // Extract from keywords field
    if (item.keywords) {
      return item.keywords.split(',').map(k => k.trim());
    }
    return [];
  }

  private async generateContentTags(item: ZoteroItem): Promise<string[]> {
    // Extract from title, abstract, and notes
    const text = [
      item.title,
      item.abstract,
      item.notes?.map(n => n.note).join(' ')
    ].join(' ');

    // Use NLP to extract key terms
    return this.extractKeyTerms(text);
  }

  private async generateAITags(item: ZoteroItem): Promise<string[]> {
    // Use Claude to generate intelligent tags
    const prompt = `Generate 5-10 relevant tags for this academic paper:\n\n` +
      `Title: ${item.title}\n` +
      `Abstract: ${item.abstract || 'N/A'}\n\n` +
      `Tags (comma-separated):`;

    // Call AI service
    const response = await this.queryAI(prompt);
    return response.split(',').map(t => t.trim());
  }
}
```

### Collection Organization

```typescript
class ZoteroOrganizer {
  async organizeIntoCollections(items: ZoteroItem[], strategy: OrganizeStrategy): Promise<void> {
    for (const item of items) {
      const targetCollections = await this.determineCollections(item, strategy);

      for (const collection of targetCollections) {
        // Ensure collection exists
        await this.ensureCollection(collection);

        // Add item to collection
        await this.addItemToCollection(item.key, collection);
      }
    }
  }

  private async determineCollections(item: ZoteroItem, strategy: OrganizeStrategy): Promise<string[]> {
    if (strategy === 'byYear') {
      return [`Papers - ${item.year}`];
    } else if (strategy === 'byItemType') {
      return [item.itemType];
    } else if (strategy === 'byPublication') {
      return [item.publicationTitle || 'Unpublished'];
    } else if (strategy === 'byTopic') {
      // Use AI to categorize
      return this.categorizeByTopic(item);
    }

    return [];
  }

  async createSmartCollection(name: string, criteria: CollectionCriteria): Promise<void> {
    // Zotero doesn't support saved searches via API
    // Recommend creating manually and provide instructions
    console.log(`To create smart collection "${name}":`);
    console.log(`1. Open Zotero`);
    console.log(`2. File → New Saved Search`);
    console.log(`3. Set criteria: ${JSON.stringify(criteria)}`);
  }
}
```

## Usage Examples

### Example 1: Import Library
```javascript
const zotero = new ZoteroIntegrator({
  apiKey: 'your-api-key',
  userID: 'your-user-id'
});

const result = await zotero.importLibrary({
  collection: 'My Research',
  includeAttachments: true
});

console.log(`Imported ${result.items.length} items`);
```

### Example 2: Search Library
```javascript
const results = await zotero.search({
  query: 'machine learning',
  tags: ['ai', 'deep-learning'],
  itemTypes: ['journalArticle'],
  limit: 20
});

console.log(`Found ${results.totalFound} items`);
results.results.forEach(item => {
  console.log(`- ${item.title} (${item.year})`);
});
```

### Example 3: Sync Citations
```javascript
const citations = [
  {
    title: 'Attention Is All You Need',
    authors: ['Vaswani et al.'],
    year: 2017,
    doi: '10.1145/3366424.3383153'
  }
];

const result = await zotero.syncCitations(citations, {
  mode: 'merge',
  collection: 'ML Papers'
});

console.log(`Imported: ${result.imported}`);
console.log(`Updated: ${result.updated}`);
```

### Example 4: Auto-Tag Items
```javascript
const result = await zotero.autoTag({
  items: recentItems,
  tagSource: ['keywords', 'content', 'ai'],
  maxTagsPerItem: 10
});

console.log(`Added ${result.tagsAdded} tags to ${result.itemsTagged} items`);
```

### Example 5: Organize Collections
```javascript
await zotero.organize({
  strategy: 'byTopic',
  createCollections: true,
  moveItems: true
});

// Creates collections like:
// - Machine Learning
// - Natural Language Processing
// - Computer Vision
```

### Example 6: Export from Zotero
```javascript
const bib = await zotero.export({
  collection: 'My Research',
  format: 'biblatex',
  outputPath: './references.bib'
});

console.log(`Exported ${bib.itemCount} references`);
```

## Quality Assurance

### Validation
- Validate API key before operations
- Check item data integrity
- Verify DOI format
- Ensure collection exists before adding

### Error Handling
- Graceful handling of API rate limits
- Retry failed requests
- Detailed error messages
- Rollback on batch failures

### Performance
- Batch operations where possible
- Respect rate limits
- Cache frequently accessed data
- Parallel independent requests

## Limitations

- **API Rate Limits**: Personal keys: ~10 requests/second, group keys vary
- **File Uploads**: Not supported via API (use Zotero client)
- **Full-Text**: Requires Zotero full-text sync
- **Saved Searches**: Cannot create via API
- **PDF Annotation**: Limited access via API

## Best Practices

1. **Secure API Keys**: Store keys in environment variables
2. **Rate Limiting**: Implement delays between requests
3. **Batch Operations**: Group items when possible
4. **Error Handling**: Always check response status
5. **Caching**: Cache library data to reduce API calls
6. **Backups**: Export data before bulk operations

## Authentication Setup

### Getting Zotero API Key

1. Go to https://www.zotero.org/settings/keys
2. Click "Create New Key"
3. Enter a description (e.g., "Academic Assistant")
4. Select permissions:
   - ✅ Read access
   - ✅ Write access
   - ✅ Library access
5. Copy the generated key

### Finding Your User ID

Your User ID is part of your Zotero profile URL:
- Profile URL: https://www.zotero.org/username
- User ID: https://www.zotero.org/userID/keys

Or use this tool: https://www.zotero.org/user_report

## Related Skills

- **citation-manager**: Format citations from Zotero
- **literature-search**: Add found papers to Zotero
- **pdf-analyzer**: Extract metadata for Zotero
- **conversational-editor**: Generate Zotero notes
- **workflow-manager**: Orchestrate Zotero workflows

## Advanced Features

### Webhook Integration
Listen for Zotero changes:
```javascript
// Zotero doesn't have webhooks, but you can poll
await zotero.watchLibrary({
  interval: 60000,  // Check every minute
  onChange: (items) => {
    console.log('Library changed:', items);
  }
});
```

### Group Library Support
```javascript
const groupZotero = new ZoteroIntegrator({
  apiKey: 'key',
  groupID: '12345',
  libraryType: 'group'
});
```

### Citation Style Language
```javascript
// Generate citations in any CSL style
const citation = await zotero.formatItem(item, {
  style: 'apa',
  locale: 'en-US'
});
```

### Backup & Restore
```javascript
// Backup entire library
const backup = await zotero.backup({
  includeAttachments: false,  // Too large
  outputPath: './zotero-backup.json'
});

// Restore from backup
await zotero.restore('./zotero-backup.json', {
  mode: 'merge'
});
```

### PDF Annotation Sync
```javascript
// Sync PDF highlights to Zotero notes
await zotero.syncAnnotations({
  itemID: 'ABCD1234',
  pdfPath: './paper.pdf',
  createNotes: true
});
```
