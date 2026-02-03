# lang-news

A static site aggregator for programming language news and updates. Built with [Lume](https://lume.land) and [Deno](https://deno.land).

## Overview

Lang News collects and displays news, updates, and releases from various programming language communities in one convenient location. Each language has a dedicated scraper that fetches news and converts it into standardized articles.

## Features

- 📰 **Aggregated News**: All language news in one place
- 🏷️ **Tagged Content**: Easy filtering by topic
- 🔍 **Clean Interface**: Simple, fast, and mobile-friendly
- 📅 **Chronological Feed**: Latest news first
- 🔗 **Source Attribution**: Links to original articles

## Prerequisites

- [Deno](https://deno.land) installed on your system

## Quick Start

### Development

Start the development server:

```bash
deno task serve
```

The site will be available at `http://localhost:3000`.

### Building

Build the static site:

```bash
deno task build
```

The built site will be output to the `dist/` directory.

## Generating Content

### Running Scrapers

Scrapers are written in Deno (TypeScript) and fetch real news from language-specific sources.

To populate the site with articles, run the language-specific scrapers:

```bash
# Run the Haskell scraper (fetches from https://blog.haskell.org/archive/)
./scrapers/haskell-scraper.ts

# Or specify a custom output directory
./scrapers/haskell-scraper.ts src/articles/
```

After running scrapers, rebuild the site to see the new articles:

```bash
deno task build
```

### Adding New Scrapers

Want to add news for your favorite language? See the [Adding Scrapers Guide](docs/adding-scrapers.md) for detailed instructions.

## Project Structure

```
lang-news/
├── src/                      # Source files for the website
│   ├── _includes/            # Layout templates
│   │   ├── base.vto         # Base HTML layout
│   │   └── article.vto      # Article page layout
│   ├── articles/             # Generated article files
│   │   └── YYYY-MM-DD-language.md
│   ├── index.md              # Home page
│   └── articles.vto          # All articles feed page
├── scrapers/                 # Language-specific scrapers (Deno/TypeScript)
│   └── haskell-scraper.ts
├── docs/                     # Documentation
│   ├── article-format.md    # Article format specification
│   ├── scraper-protocol.md  # Scraper protocol specification
│   └── adding-scrapers.md   # Guide for adding new scrapers
├── dist/                     # Built site output (generated)
├── _config.ts                # Lume configuration file
├── deno.json                 # Deno configuration and tasks
└── README.md                 # This file
```

## Architecture

### Article Format

Articles are written as Markdown files with YAML front matter. Each article includes:

- **title**: Article title
- **date**: Publication date (YYYY-MM-DD)
- **language**: Programming language (lowercase)
- **source**: URL to original article
- **tags**: Array of topic tags
- **version**: (Optional) Language/tool version

See [Article Format Specification](docs/article-format.md) for details.

### Scraper Protocol

Scrapers are written in **Deno (TypeScript)** and follow a simple protocol:
1. Accept an output directory as argument
2. Fetch real news from language-specific sources
3. Generate articles as `YYYY-MM-DD-language.md` files
4. Include all required front matter fields
5. Handle errors gracefully

The reference implementation fetches from https://blog.haskell.org/archive/

See [Scraper Protocol Specification](docs/scraper-protocol.md) for details.

## Documentation

- [Article Format Specification](docs/article-format.md) - Details on the article file format
- [Scraper Protocol](docs/scraper-protocol.md) - How scrapers should work
- [Adding Scrapers](docs/adding-scrapers.md) - Step-by-step guide for creating new scrapers

## Contributing

Contributions are welcome! Here's how you can help:

1. **Add a new language scraper**: Follow the [Adding Scrapers Guide](docs/adding-scrapers.md)
2. **Improve existing scrapers**: Make them more robust or add new sources
3. **Enhance the UI**: Improve the design or add new features
4. **Fix bugs**: Report issues or submit fixes

## Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] Define article format and scraper protocol
- [x] Implement Haskell scraper (POC)
- [x] Set up Lume rendering
- [x] Create feed and article pages
- [x] Documentation

### Phase 2: Expansion (Coming Next)
- [ ] Add more language scrapers (Python, Rust, Go, etc.)
- [ ] Implement real data fetching (RSS, APIs, web scraping)
- [ ] Add language-specific pages
- [ ] Improve filtering and search

### Phase 3: Enhancement
- [ ] Add RSS feed output
- [ ] Implement automatic scraper scheduling
- [ ] Add social media integration
- [ ] Improve mobile experience

## License

See [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with:
- [Lume](https://lume.land) - Static site generator for Deno
- [Deno](https://deno.land) - Secure JavaScript/TypeScript runtime