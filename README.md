# lang-news

A static site aggregator for programming language news and updates. Built with [Lume](https://lume.land) and [Deno](https://deno.land).

## Overview

Lang News collects and displays news, updates, and releases from various programming language communities in one convenient location. Each language has a dedicated scraper that fetches news and converts it into standardized articles.

## Prerequisites

- [Deno](https://deno.land) installed on your system

## Quick Start

### Building and Running

Build the site (automatically runs scrapers first):

```bash
deno task build
```

Start the development server:

```bash
deno task serve
```

The site will be available at `http://localhost:3000`.

### Running Scrapers Manually

```bash
# Run the Haskell scraper
deno task scrape

# Or run it directly
./scrapers/haskell-scraper.ts
```

## Project Structure

```
lang-news/
├── src/                      # Source files for the website
│   ├── _includes/            # Layout templates
│   ├── articles/             # Generated article files (gitignored)
│   ├── index.vto             # Home page
│   └── articles.vto          # All articles feed page
├── scrapers/                 # Language-specific scrapers (Deno/TypeScript)
│   └── haskell-scraper.ts
├── dist/                     # Built site output (generated)
├── _config.ts                # Lume configuration file
└── deno.json                 # Deno configuration and tasks
```

## Article Format

Articles are Markdown files with YAML front matter:

```yaml
---
layout: article.vto
title: "Article Title"
date: YYYY-MM-DD
language: haskell
source: "https://..."
tags: [tag1, tag2]
version: ""
url: /articles/YYYY-MM-DD-language/
---

Article content in markdown...
```

## Adding New Scrapers

Scrapers are Deno/TypeScript scripts that:
1. Fetch news from a language-specific source
2. Parse the content using deno_dom
3. Generate markdown files in `src/articles/`
4. Follow the naming pattern: `YYYY-MM-DD-language.md`

See `scrapers/haskell-scraper.ts` for a reference implementation.

## Contributing

Contributions are welcome! You can:
- Add new language scrapers
- Improve existing scrapers
- Enhance the UI
- Fix bugs

## License

See [LICENSE](LICENSE) file for details.

## Built With

- [Lume](https://lume.land) - Static site generator for Deno
- [Deno](https://deno.land) - Secure JavaScript/TypeScript runtime
- [deno_dom](https://deno.land/x/deno_dom) - HTML parsing