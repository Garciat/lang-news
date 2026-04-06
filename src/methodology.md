---
title: Methodology
layout: layout.vto
url: /methodology/
---

# Methodology

Lang News only aggregates items from official or primary language sources.

It publishes short summaries and links back to the original source instead of
republishing full article bodies.

## Inclusion rules

- Official language sites, blogs, feeds, or standards bodies only.
- Keep new versions, release candidates, language feature announcements,
  standards or proposal updates, roadmap posts, and comparable language-level
  announcements.
- Skip tutorials, opinion posts, third-party commentary, and ecosystem news that
  is not clearly about the language itself.

## Current sources

- Rust Blog (`https://blog.rust-lang.org/`)
- Python Insider (`https://blog.python.org/`)
- Inside Java (`https://inside.java/`)
- The D Blog (`https://dlang.org/blog/`)
- Scala Blog (`https://www.scala-lang.org/blog/`)
- The Go Blog (`https://go.dev/blog/`)
- Haskell Blog (`https://blog.haskell.org/`)
- Kotlin Blog (`https://blog.jetbrains.com/kotlin/`)
- Elixir Blog (`https://elixir-lang.org/blog/`)
- Erlang/OTP Blog (`https://www.erlang.org/blog`)
- PHP.net Releases (`https://www.php.net/releases/`)
- Ruby News (`https://www.ruby-lang.org/en/news/`)
- Swift.org Blog (`https://www.swift.org/blog/`)
- TypeScript Blog (`https://devblogs.microsoft.com/typescript/`)
- .NET Blog C# tag (`https://devblogs.microsoft.com/dotnet/tag/csharp/`)

## Pipeline

1. Fetch configured official feeds.
2. Normalize entries into a shared article schema.
3. Deduplicate by canonical source URL.
4. Write one generated markdown file per article.
5. Rebuild the homepage and language landing pages from generated content.
