# Scraper Protocol Specification

## Overview

The scraper protocol defines how scrapers should interact with the lang-news system. Each scraper is responsible for fetching news for a specific programming language and generating properly formatted article files.

## Protocol Requirements

### Input

Scrapers must accept the following parameter:

- **Target Directory** (required): The directory where article files should be created
  - Typically `src/articles/`
  - Scraper should create this directory if it doesn't exist

### Output

Scrapers must produce one or more article files following these requirements:

1. **File Naming**: Files must be named `YYYY-MM-DD-language.md`
   - Date represents when the news was published
   - Language is the name in lowercase
   
2. **File Format**: Files must be valid Markdown with YAML front matter
   - See [Article Format Specification](article-format.md) for details

3. **Idempotency**: Running the scraper multiple times should be safe
   - Don't duplicate articles
   - Update existing articles if content has changed
   - Consider using date-based deduplication

### Error Handling

Scrapers should:
- Return non-zero exit code on failure
- Log errors to stderr
- Continue processing other items if one fails
- Gracefully handle network issues

## Implementation Guidelines

### Technology

Scrapers should be implemented using **Deno** (TypeScript/JavaScript) for consistency and access to modern web APIs.

### Command-Line Interface

Recommended CLI pattern:

```bash
./scrapers/language-scraper.ts [output-dir]
```

Example:
```bash
./scrapers/haskell-scraper.ts src/articles/
```

The scraper should use the shebang `#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read` to be directly executable.

### Configuration

Scrapers may accept additional optional parameters:
- `--max-items`: Limit number of articles to fetch
- `--since`: Only fetch news since a specific date

### Dependencies

- Scrapers are written in **Deno (TypeScript)**
- Use Deno's built-in `fetch` API for HTTP requests
- Use standard library modules when needed
- Minimize external dependencies

## Example Implementation (Deno/TypeScript)

Here's the basic structure for a Deno scraper:

```typescript
#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read

const OUTPUT_DIR = Deno.args[0] || "src/articles";
const LANGUAGE = "yourlanguage";

// Ensure output directory exists
await Deno.mkdir(OUTPUT_DIR, { recursive: true });

// Fetch and process news items
const response = await fetch("https://source-url.com/feed");
const data = await response.json(); // or .text() for HTML

// Generate article file
const date = new Date().toISOString().split('T')[0];
const filename = `${OUTPUT_DIR}/${date}-${LANGUAGE}.md`;

const content = `---
title: "Article Title"
date: ${date}
language: ${LANGUAGE}
source: "https://source-url.com"
tags: [tag1, tag2]
---

Article content here...
`;

await Deno.writeTextFile(filename, content);
console.log(`✓ Created: ${filename}`);
```

## Testing Your Scraper

1. **Dry Run**: Test without creating files
2. **Validate Output**: Ensure generated files match the article format
3. **Check Idempotency**: Run multiple times and verify no duplicates
4. **Error Cases**: Test network failures and invalid data

## Integration

Once your scraper is implemented:

1. Place it in the `scrapers/` directory
2. Make it executable: `chmod +x scrapers/your-scraper`
3. Document it in `docs/scrapers.md`
4. Add it to any automation workflows

## Reference Implementation

The Haskell scraper (`scrapers/haskell-scraper.ts`) serves as the reference implementation of this protocol. It demonstrates:
- Fetching from https://blog.haskell.org/archive/
- Parsing HTML content
- Converting to markdown
- Generating properly formatted articles

Refer to it when building new scrapers.
