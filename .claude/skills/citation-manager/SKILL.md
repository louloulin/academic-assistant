---
name: citation-manager
description: Format and validate academic citations in multiple styles (APA, MLA, Chicago, IEEE, Harvard). Use when the user asks to format citations, create bibliographies, or manage references.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Citation Manager Agent Skill

## Overview

Automatically format and validate academic citations in multiple citation styles. Ensures compliance with style guide requirements.

## Supported Styles

| Style | Full Name | Fields | Used In |
|-------|-----------|--------|---------|
| APA | American Psychological Association | Author(AA), (Year). Title. *Venue*. | Psychology, Education, Social Sciences |
| MLA | Modern Language Association | Author. "Title." *Venue*, Year, pp. | Humanities, Literature |
| Chicago | Chicago Manual of Style | Author. Year. "Title." *Venue* Vol.Issue (Pages). | History, Business, Fine Arts |
| IEEE | Institute of Electrical Electronics Engineers | Author, "Title," *Venue*, vol. X, no. Y, pp. P-Y, Year. | Engineering, Computer Science |
| Harvard | Harvard Referencing | Author (Year) 'Title', *Venue*, Volume(Issue), p. pages. | Social Sciences, Economics |

## Quick Start

### Format a Citation

When user asks to format a citation:

1. **Parse input**: Extract paper metadata
2. **Validate fields**: Ensure required fields present
3. **Apply style rules**: Format according to selected style
4. **Generate output**: Return in-text and bibliography entries

### Input Format

Accept citation data in this structure:
```typescript
{
  title: string,
  authors: Array<{first: string, last: string}>,
  year: number,
  venue?: string,
  volume?: string,
  issue?: string,
  pages?: string,
  doi?: string,
  url?: string
}
```

## Output Structure

```typescript
{
  inText: string,      // (Smith, 2020) or Smith (2020)
  bibliography: string,  // Full reference entry
  isValid: boolean,
  warnings?: string[]  // Any validation warnings
}
```

## Style-Specific Rules

### APA Style (7th Edition)

**In-text**:
- Single author: (Smith, 2020)
- Two authors: (Smith & Jones, 2020)
- Three+ authors: (Smith et al., 2020)
- First citation: (Smith, Jones, & Brown, 2020)

**Bibliography**:
```
Author, A. A. (Year). Title of work. *Source*.
```

### MLA Style (9th Edition)

**In-text**:
- (Author Page)
- (Author)

**Bibliography**:
```
Author. "Title of Work." *Title of Container*, Other contributors, Version, Number, Publisher, Year, Location.
```

### Chicago Style (17th Edition)

**Notes and Bibliography**:
```
Author. "Title of Article." *Title of Journal* Volume, no. Issue (Year): Pages.
```

### IEEE Style

**In-text**:
- [1] for first reference
- [1]-[3] for multiple

**Bibliography**:
```
[1] A. Author, "Title of paper," *Abbrev. Title of Journal*, vol. x, no. y, pp. z-zz, Year.
```

## Validation Rules

### Required Fields by Style

| Style | Required Fields | Optional Fields |
|-------|----------------|-----------------|
| APA | title, authors, year | venue, volume, issue, pages, doi |
| MLA | title, authors, container (venue) | year, location, url |
| Chicago | title, authors, year, venue | volume, issue, pages |
| IEEE | title, authors, journal, year, volume, pages | issue, doi |

### DOI Validation

DOIs must follow format: `10.XXXX/XXXXX`

Example: `10.1038/nature14539`

## Special Cases

### No Author
- Use title in place of author
- Format: *Title*. (Year). *Venue*.

### No Date
- Use n.d. for no date
- Format: Author (n.d.).

### Multiple Works by Same Author
- Arrange alphabetically by title
- Use a, b, c suffixes for year: (2020a), (2020b)

### Electronic Sources
- Include URL or DOI
- Format: Retrieved from https://...

## Integration

Uses:
- **MCP Server**: `citation-manager-server` (Rust)
- **Client**: `@assistant/mcp-client`
- **Validation**: Zod schemas

## Best Practices

1. **Always verify** AI-generated citations
2. **Use DOIs** when available for permanence
3. **Be consistent** within a document
4. **Keep records** of citation data
5. **Check style guides** for edge cases

## Common Errors

### Missing Fields
```
Warning: Missing required field 'venue' for APA style
```
Solution: Add venue or use appropriate style

### Invalid DOI
```
Error: DOI format invalid: 'invalid-doi'
```
Solution: Check DOI format (10.XXXX/XXXXX)

### Year Out of Range
```
Warning: Year 2099 seems incorrect
```
Solution: Verify the publication year

## Examples

See [EXAMPLES.md](EXAMPLES.md) for detailed formatting examples.

## Related Skills

- `literature-search` - Search papers to cite
- `literature-review` - Format citations in reviews
- `paper-structure` - Insert citations into papers
