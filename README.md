# lang-news

Lang News is a static site that aggregates programming language news from
official sources using [Lume](https://lume.land) and [Deno](https://deno.land).

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
