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

### Command-Line Interface

Recommended CLI pattern:

```bash
scraper-name --output-dir <path> [options]
```

Example:
```bash
./scrapers/haskell-scraper.sh --output-dir src/articles/
```

### Configuration

Scrapers may accept additional optional parameters:
- `--max-items`: Limit number of articles to fetch
- `--since`: Only fetch news since a specific date
- `--dry-run`: Print what would be done without creating files

### Dependencies

- Scrapers should minimize dependencies
- Document any required tools or libraries
- Provide installation instructions

## Example Implementation

Here's a simple shell script scraper structure:

```bash
#!/bin/bash

set -e

OUTPUT_DIR="${1:-src/articles}"
LANGUAGE="haskell"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Fetch and process news items
# ... scraping logic here ...

# Generate article file
DATE=$(date +%Y-%m-%d)
FILENAME="$OUTPUT_DIR/$DATE-$LANGUAGE.md"

cat > "$FILENAME" << EOF
---
title: "News Title"
date: $DATE
language: $LANGUAGE
source: "https://example.com/news"
tags: [tag1, tag2]
---

Article content here...
EOF

echo "Created article: $FILENAME"
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

The Haskell scraper (`scrapers/haskell-scraper.sh`) serves as the reference implementation of this protocol. Refer to it when building new scrapers.
