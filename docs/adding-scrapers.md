# Adding New Scrapers

This guide explains how to create a scraper for a new programming language.

## Overview

Scrapers are responsible for fetching news from various sources and converting them into standardized article files that can be rendered by the site.

## Before You Start

1. Read the [Article Format Specification](article-format.md)
2. Read the [Scraper Protocol Specification](scraper-protocol.md)
3. Review the reference implementation: `scrapers/haskell-scraper.sh`

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
touch scrapers/[language]-scraper.sh
chmod +x scrapers/[language]-scraper.sh
```

Replace `[language]` with your language name in lowercase (e.g., `python`, `rust`, `go`).

### 3. Implement the Scraper

Your scraper should:

1. **Accept the output directory** as the first argument (or use `src/articles` as default)
2. **Create the output directory** if it doesn't exist
3. **Fetch news** from your chosen sources
4. **Generate article files** following the naming convention: `YYYY-MM-DD-language.md`
5. **Include all required front matter** fields (title, date, language, source, tags)

#### Basic Template

```bash
#!/bin/bash
set -e

# Configuration
OUTPUT_DIR="${1:-src/articles}"
LANGUAGE="yourlanguage"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Fetch and process news
# TODO: Add your scraping logic here

# Generate article file
DATE=$(date +%Y-%m-%d)
FILENAME="$OUTPUT_DIR/$DATE-$LANGUAGE.md"

if [ ! -f "$FILENAME" ]; then
    cat > "$FILENAME" << EOF
---
title: "Your Article Title"
date: $DATE
language: $LANGUAGE
source: "https://source-url.com"
tags: [tag1, tag2]
---

Article content goes here...
EOF
    echo "✓ Created: $FILENAME"
else
    echo "- Skipped (exists): $FILENAME"
fi
```

### 4. Choose Your Scraping Method

Depending on your language and comfort level, you can use different tools:

#### Option A: Shell Script (Simplest)

Good for:
- RSS feeds
- Static pages
- APIs with simple responses

Tools you might use:
- `curl` or `wget` for fetching
- `xmllint` or `xq` for XML/RSS parsing
- `jq` for JSON parsing
- `sed`/`awk` for text processing

#### Option B: Python Script

Good for:
- Complex HTML parsing
- Multiple sources
- Advanced data transformation

Example structure:
```python
#!/usr/bin/env python3
import sys
import requests
from bs4 import BeautifulSoup
import datetime

def scrape_news(output_dir):
    # Your scraping logic
    pass

if __name__ == "__main__":
    output_dir = sys.argv[1] if len(sys.argv) > 1 else "src/articles"
    scrape_news(output_dir)
```

#### Option C: Node.js/Deno Script

Good for:
- Integration with existing JS tooling
- Using npm packages for scraping

Example with Deno:
```javascript
#!/usr/bin/env -S deno run --allow-net --allow-write

const outputDir = Deno.args[0] || "src/articles";
// Your scraping logic
```

### 5. Handle Common Scenarios

#### Avoiding Duplicates

Check if a file exists before creating it:

```bash
if [ ! -f "$FILENAME" ]; then
    # Create file
else
    echo "Article already exists, skipping"
fi
```

#### Multiple Articles Per Day

Add a sequence number or slug:

```bash
FILENAME="$OUTPUT_DIR/$DATE-$LANGUAGE-$SLUG.md"
```

#### Fetching Historical Data

Add a date range parameter:

```bash
SINCE_DATE="${2:-$(date -d '7 days ago' +%Y-%m-%d)}"
```

### 6. Test Your Scraper

Run your scraper and verify the output:

```bash
# Run the scraper
./scrapers/yourlanguage-scraper.sh

# Check the generated files
ls -la src/articles/

# Verify the format
head -20 src/articles/YYYY-MM-DD-yourlanguage.md

# Build the site to ensure articles render correctly
deno task build

# View locally
deno task serve
```

### 7. Handle Errors Gracefully

Add error handling to your scraper:

```bash
set -e  # Exit on error

# Wrap risky operations in error checks
if ! curl -f "https://source.com/feed" -o /tmp/feed.xml; then
    echo "Error: Failed to fetch feed" >&2
    exit 1
fi
```

### 8. Document Your Scraper

Add a comment block at the top of your scraper:

```bash
#!/bin/bash
#
# [Language] News Scraper
#
# Fetches news from:
# - Source 1: https://...
# - Source 2: https://...
#
# Usage: ./scrapers/yourlanguage-scraper.sh [OUTPUT_DIR]
#
# Dependencies:
# - curl
# - jq (for JSON parsing)
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

- **File**: `scrapers/haskell-scraper.sh`
- **Sources**: Currently generates sample articles (POC)
- **Notes**: Reference implementation demonstrating the scraper protocol

## Tips and Best Practices

### Rate Limiting

Be respectful of source websites:

```bash
sleep 1  # Wait between requests
```

### Caching

Consider caching fetched data to avoid re-fetching:

```bash
CACHE_FILE="/tmp/yourlanguage-feed.xml"
if [ ! -f "$CACHE_FILE" ] || [ $(find "$CACHE_FILE" -mmin +60) ]; then
    curl "https://source.com/feed" -o "$CACHE_FILE"
fi
```

### Logging

Add logging for debugging:

```bash
LOG_FILE="/tmp/yourlanguage-scraper.log"
echo "[$(date)] Starting scrape" >> "$LOG_FILE"
```

### Configuration Files

For complex scrapers, consider using a config file:

```bash
CONFIG_FILE="scrapers/yourlanguage-config.json"
SOURCES=$(jq -r '.sources[]' "$CONFIG_FILE")
```

## Troubleshooting

### "Permission denied" when running scraper

Make the script executable:
```bash
chmod +x scrapers/yourlanguage-scraper.sh
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
2. Review the reference implementation: `scrapers/haskell-scraper.sh`
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
