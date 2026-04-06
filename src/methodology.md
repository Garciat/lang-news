---
title: Methodology
layout: layout.vto
url: /methodology/
---

# Methodology

Lang News only aggregates items from official or primary language sources.

It publishes short summaries and links back to the original source instead of republishing full article bodies.

## Inclusion rules

- Official language sites, blogs, feeds, or standards bodies only.
- Keep new versions, release candidates, language feature announcements, standards or proposal updates, roadmap posts, and comparable language-level announcements.
- Skip tutorials, opinion posts, third-party commentary, and ecosystem news that is not clearly about the language itself.

## Current sources

- Rust Blog (`https://blog.rust-lang.org/`)
- Python Insider (`https://blog.python.org/`)

## Pipeline

1. Fetch configured official feeds.
2. Normalize entries into a shared article schema.
3. Deduplicate by canonical source URL.
4. Write one generated markdown file per article.
5. Rebuild the homepage and language landing pages from generated content.
