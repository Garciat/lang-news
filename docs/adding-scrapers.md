# Adding New Scrapers

This guide explains how to create a scraper for a new programming language.

## Overview

Scrapers are responsible for fetching news from various sources and converting them into standardized article files that can be rendered by the site.

## Before You Start

1. Read the [Article Format Specification](article-format.md)
2. Read the [Scraper Protocol Specification](scraper-protocol.md)
3. Review the reference implementation: `scrapers/haskell-scraper.ts`
4. Ensure you have [Deno](https://deno.land) installed

## Step-by-Step Guide

### 1. Choose Your Language and Sources

Decide which programming language you want to track and identify reliable news sources. Good sources include:

- Official language blogs/websites
- Language-specific subreddits
- Community forums (like Discourse)
- GitHub release pages for core tools
- Package registry announcements
- Conference/meetup announcements

### 2. Create Your Scraper Script

Create a new file in the `scrapers/` directory:

```bash
touch scrapers/[language]-scraper.ts
chmod +x scrapers/[language]-scraper.ts
```

Replace `[language]` with your language name in lowercase (e.g., `python`, `rust`, `go`).

All scrapers should be written in **Deno (TypeScript)** for consistency.

### 3. Implement the Scraper

Your scraper should:

1. **Accept the output directory** as the first argument (or use `src/articles` as default)
2. **Create the output directory** if it doesn't exist
3. **Fetch news** from your chosen sources
4. **Generate article files** following the naming convention: `YYYY-MM-DD-language.md`
5. **Include all required front matter** fields (title, date, language, source, tags)

#### Basic Template

```typescript
#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read
/**
 * [Language] News Scraper
 */

const OUTPUT_DIR = Deno.args[0] || "src/articles";
const LANGUAGE = "yourlanguage";

// Ensure output directory exists
await Deno.mkdir(OUTPUT_DIR, { recursive: true });

console.log(`${LANGUAGE.charAt(0).toUpperCase() + LANGUAGE.slice(1)} News Scraper`);
console.log("=".repeat(40));
console.log(`Output directory: ${OUTPUT_DIR}\n`);

// Fetch and process news
try {
  const response = await fetch("https://your-news-source.com/feed");
  const html = await response.text();
  
  // Parse and extract articles
  // ... your parsing logic here ...
  
  // Generate article file
  const date = new Date().toISOString().split('T')[0];
  const filename = `${OUTPUT_DIR}/${date}-${LANGUAGE}.md`;
  
  // Check if file already exists
  try {
    await Deno.stat(filename);
    console.log(`- Skipped (exists): ${filename}`);
  } catch {
    const content = `---
title: "Your Article Title"
date: ${date}
language: ${LANGUAGE}
source: "https://source-url.com"
tags: [tag1, tag2]
---

Article content goes here...
`;
    
    await Deno.writeTextFile(filename, content);
    console.log(`✓ Created: ${filename}`);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  Deno.exit(1);
}
```

### 4. Scraping with Deno

All scrapers should use Deno for consistency. Deno provides:

- Built-in `fetch` API for HTTP requests
- TypeScript support out of the box
- Secure by default (explicit permissions)
- No package.json needed

#### Parsing HTML

For HTML parsing, you can use simple regex for basic extraction or use a library:

```typescript
// Simple regex-based parsing
const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
const title = titleMatch ? titleMatch[1] : "Untitled";

// For complex parsing, consider using a library like deno-dom:
// import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
```

#### Working with RSS/Atom Feeds

```typescript
const response = await fetch("https://example.com/feed.xml");
const xml = await response.text();

// Parse XML (simple approach)
const items = xml.match(/<item>(.*?)<\/item>/gs) || [];
for (const item of items) {
  const title = item.match(/<title>(.*?)<\/title>/)?.[1];
  const link = item.match(/<link>(.*?)<\/link>/)?.[1];
  const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
  // ... process item
}
```

#### Working with JSON APIs

```typescript
const response = await fetch("https://api.example.com/news");
const data = await response.json();

for (const item of data.items) {
  // Process each news item
  const article = {
    title: item.title,
    date: item.published_at.split('T')[0],
    url: item.url,
    // ...
  };
}
```

### 5. Handle Common Scenarios

#### Avoiding Duplicates

Check if a file exists before creating it:

```typescript
try {
  await Deno.stat(filename);
  console.log(`- Skipped (exists): ${filename}`);
  return; // Skip this article
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    // File doesn't exist, proceed to create it
  } else {
    throw error;
  }
}
```

#### Multiple Articles Per Day

Add a slug or sequence to the filename:

```typescript
const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
const filename = `${OUTPUT_DIR}/${date}-${LANGUAGE}-${slug}.md`;
```

#### Error Handling

Always handle network and parsing errors gracefully:

```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  // ... process response
} catch (error) {
  console.error(`Error fetching ${url}: ${error.message}`);
  // Continue with next article or exit
}
```

### 6. Test Your Scraper

Run your scraper and verify the output:

```bash
# Run the scraper
./scrapers/yourlanguage-scraper.ts

# Check the generated files
ls -la src/articles/

# Verify the format
head -20 src/articles/YYYY-MM-DD-yourlanguage.md

# Build the site to ensure articles render correctly
deno task build

# View locally
deno task serve
```

### 7. Document Your Scraper

Add a documentation comment at the top of your scraper:

```typescript
#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read
/**
 * [Language] News Scraper
 *
 * Fetches news from:
 * - Source 1: https://...
 * - Source 2: https://...
 *
 * Usage: ./scrapers/yourlanguage-scraper.ts [OUTPUT_DIR]
 */
```

### 8. Add to Documentation
#
```

### 9. Add to Documentation

Update this file's "Available Scrapers" section below with:
- Language name
- Scraper filename
- Sources scraped
- Any special notes

## Available Scrapers

### Haskell

- **File**: `scrapers/haskell-scraper.ts`
- **Sources**: https://blog.haskell.org/archive/
- **Notes**: Reference implementation demonstrating the scraper protocol

## Tips and Best Practices

### Rate Limiting

Be respectful of source websites:

```typescript
// Wait between requests
await new Promise(resolve => setTimeout(resolve, 1000));
```

### Caching

Consider caching fetched data to avoid re-fetching:

```typescript
const CACHE_FILE = "/tmp/yourlanguage-feed.json";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

try {
  const stat = await Deno.stat(CACHE_FILE);
  const age = Date.now() - stat.mtime.getTime();
  
  if (age < CACHE_DURATION_MS) {
    // Use cached data
    const cached = await Deno.readTextFile(CACHE_FILE);
    return JSON.parse(cached);
  }
} catch {
  // Cache doesn't exist or is invalid
}

// Fetch fresh data and cache it
const data = await fetchFreshData();
await Deno.writeTextFile(CACHE_FILE, JSON.stringify(data));
```

### Logging

Add logging for debugging:

```typescript
const verbose = Deno.args.includes("--verbose");

function log(message: string) {
  if (verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

log("Starting scrape...");
```

### Configuration Files

For complex scrapers, consider using a config file:

```typescript
const config = JSON.parse(
  await Deno.readTextFile("scrapers/yourlanguage-config.json")
);

for (const source of config.sources) {
  await fetchFromSource(source);
}
```

## Troubleshooting

### "Permission denied" when running scraper

Make the script executable:
```bash
chmod +x scrapers/yourlanguage-scraper.ts
```

### "Requires net access" error

Deno requires explicit permissions. Use:
```bash
deno run --allow-net --allow-write --allow-read scrapers/yourlanguage-scraper.ts
```

Or use the shebang to make it directly executable:
```typescript
#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read
```

### Articles not showing up on site

1. Check that files are in `src/articles/`
2. Verify the file naming format: `YYYY-MM-DD-language.md`
3. Validate the front matter YAML syntax
4. Rebuild the site: `deno task build`

### Front matter parsing errors

- Ensure YAML is valid (use a YAML validator)
- Check that all required fields are present
- Verify date format is `YYYY-MM-DD`
- Ensure tags are in array format: `[tag1, tag2]`

## Getting Help

If you run into issues:

1. Check the [Article Format](article-format.md) and [Scraper Protocol](scraper-protocol.md) docs
2. Review the reference implementation: `scrapers/haskell-scraper.ts`
3. Open an issue on GitHub with:
   - Your scraper code
   - Error messages
   - Example output

## Next Steps

After creating your scraper:

1. Test it thoroughly
2. Consider adding it to CI/CD for automated runs
3. Document any quirks or special handling needed
4. Share it with the community!
