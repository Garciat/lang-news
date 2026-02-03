# lang-news

A static site built with [Lume](https://lume.land) and [Deno](https://deno.land).

## Prerequisites

- [Deno](https://deno.land) installed on your system

## Development

Start the development server:

```bash
deno task serve
```

The site will be available at `http://localhost:3000`.

## Building

Build the static site:

```bash
deno task build
```

The built site will be output to the `dist/` directory.

## Project Structure

- `src/` - Source files for the website
- `src/_includes/` - Layout templates
- `dist/` - Built site output (generated)
- `_config.ts` - Lume configuration file
- `deno.json` - Deno configuration and tasks