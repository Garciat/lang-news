# lang-news

Lang News is a static site that aggregates high-signal programming language news
from official sources using [Lume](https://lume.land) and
[Deno](https://deno.land).

## Scope

The site focuses on official language-level updates such as:

- releases and release candidates
- language features and stabilization announcements
- specifications, proposals, and standards updates
- roadmap and status announcements

It intentionally excludes tutorials, opinion posts, and third-party ecosystem
coverage.

## Current sources

- Rust Blog
- Python Insider
- Inside Java
- The D Blog
- Scala Blog
- The Go Blog
- Haskell Blog
- Kotlin Blog
- Elixir Blog
- Erlang/OTP Blog
- PHP.net Releases
- Ruby News
- Swift.org Blog
- TypeScript Blog
- .NET Blog (C#)

## Prerequisites

- [Deno](https://deno.land) installed on your system

## Development

Fetch the latest source data and start the local development server:

```bash
deno task serve
```

The site will be available at `http://localhost:3000`.

## Building

Build the generated content and static site:

```bash
deno task build
```

The built site will be output to the `dist/` directory.

## Data pipeline

The ingestion pipeline lives in `scripts/news/` and is organized around:

- a canonical article model shared by all sources
- source adapters for each official feed
- shared normalization, deduplication, and summary-writing utilities
- generated markdown content under `src/generated/`

## Project structure

- `scripts/news/` - data ingestion pipeline and source adapters
- `src/generated/` - generated article and listing content
- `src/_includes/` - Lume layout templates
- `src/methodology.md` - editorial and inclusion rules
- `dist/` - built site output (generated)
- `_config.ts` - Lume configuration file
- `deno.json` - Deno configuration and tasks
