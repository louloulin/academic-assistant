---
description: Citation Manager Agent Skill - Format and manage academic citations
name: citation-manager
version: 1.0.0
author: Academic Assistant Team
---

# Citation Manager Agent Skill

## Description

Automatically format and validate academic citations in multiple styles (APA, MLA, Chicago, IEEE, Harvard).

## Capabilities

- 📖 Multiple citation styles
- ✅ Automatic validation
- 🔍 DOI verification
- 📚 Bibliography generation
- 🔄 In-text citation formatting

## Supported Styles

| Style | Format | Used In |
|-------|--------|---------|
| APA | American Psychological Association | Psychology, Education |
| MLA | Modern Language Association | Humanities |
| Chicago | Chicago Manual of Style | History, Business |
| IEEE | Institute of Electrical Electronics Engineers | Engineering, CS |
| Harvard | Harvard referencing | Social Sciences |

## Usage

### Format a citation

```bash
/cite "Attention Is All You Need" --style apa
```

### From metadata

```bash
/cite --title "Deep Learning" --author "Ian Goodfellow" --year 2016 --style apa
```

### Validate existing citation

```bash
/cite-validate "Vaswani et al. (2017). Attention is all you need."
```

## Input Format

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

## Output Format

```typescript
{
  inText: string,      // (Author, Year) or Author (Year)
  bibliography: string,  // Full reference
  isValid: boolean,
  warnings?: string[]
}
```

## Examples

### APA Style

Input:
```json
{
  "title": "Attention Is All You Need",
  "authors": [{"first": "Ashish", "last": "Vaswani"}],
  "year": 2017,
  "venue": "NeurIPS"
}
```

Output:
```
In-text: (Vaswani, 2017)
Bibliography: Vaswani, A. (2017). Attention is all you need. NeurIPS.
```

### MLA Style

Input: Same as above

Output:
```
In-text: (Vaswani)
Bibliography: Vaswani, Ashish. "Attention Is All You Need." NeurIPS, 2017.
```

## Features

### Automatic DOI Resolution
```bash
/cite --doi "10.1038/nature14539" --style apa
```

### Batch Formatting
```bash
/cite-batch citations.json --style chicago
```

### Export Formats
- BibTeX
- EndNote XML
- RIS
- CSV

## Integration

Works seamlessly with:
- **Zotero**: Import/export libraries
- **Literature Search**: Auto-cite search results
- **Paper Structure**: Insert citations into draft

## Validation

The citation manager validates:

- Required fields present
- Author names properly formatted
- Year is valid
- DOI format correct
- URL accessible

## Best Practices

1. **Always verify**: AI-generated citations should be verified
2. **Use DOIs**: When available, DOIs provide permanent links
3. **Be consistent**: Use the same style throughout
4. **Keep records**: Save citation data for future use

## Notes

- Citation styles have specific rules for edge cases
- When in doubt, consult the official style guide
- Some fields may require manual review
