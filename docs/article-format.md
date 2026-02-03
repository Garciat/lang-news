# Article Format Specification

## Overview

Articles in lang-news are written as Markdown files with YAML front matter. Each article represents a news item or update related to a specific programming language.

## File Naming Convention

Articles must be named using the following pattern:

```
YYYY-MM-DD-language.md
```

Where:
- `YYYY-MM-DD` is the publication date in ISO 8601 format
- `language` is the programming language name in lowercase (e.g., `haskell`, `rust`, `python`)

Examples:
- `2026-02-03-haskell.md`
- `2026-01-15-rust.md`

## Front Matter Fields

All articles must include the following YAML front matter fields:

### Required Fields

- **title** (string): The title of the article/news item
- **date** (date): Publication date in `YYYY-MM-DD` format
- **language** (string): The programming language this news relates to (lowercase)
- **source** (string): URL to the original source of the news
- **tags** (array): List of relevant tags for categorization

### Optional Fields

- **version** (string): Language version if the news is version-specific (e.g., "9.6.4", "1.75")
- **author** (string): Author of the original article/news
- **summary** (string): Brief summary of the article

## Example Article

```markdown
---
title: "GHC 9.6.4 Released"
date: 2026-02-03
language: haskell
source: "https://www.haskell.org/ghc/blog/20260203-ghc-9.6.4-released.html"
tags: [release, compiler, ghc]
version: "9.6.4"
---

# GHC 9.6.4 Released

The GHC team is pleased to announce the release of GHC 9.6.4.

## Key Changes

- Bug fixes for the simplifier
- Improvements to error messages
- Performance enhancements

For more details, see the [release notes](https://www.haskell.org/ghc/blog/20260203-ghc-9.6.4-released.html).
```

## Content Guidelines

1. **Keep it concise**: Articles should summarize the key points
2. **Link to sources**: Always provide proper attribution
3. **Use standard Markdown**: Stick to common Markdown features for compatibility
4. **Add context**: Include enough context for readers unfamiliar with the topic
5. **Tag appropriately**: Use relevant tags to help with discovery

## Storage Location

All articles should be placed in the `src/articles/` directory.
