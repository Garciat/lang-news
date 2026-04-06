import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.56/deno-dom-wasm.ts";
import type { RawFeedEntry, SourceAdapter } from "../types.ts";
import { runHtmlAdapter } from "../source_adapter.ts";

const WG21_NEWS_PATTERN =
  /<br>\s*News (\d{4}-\d{2}-\d{2}):\s*([\s\S]*?)(?=<br>\s*News \d{4}-\d{2}-\d{2}:|<p>)/gi;
const MAX_ENTRIES = 20;

const config = {
  id: "wg21",
  language: "C++",
  languageSlug: "cpp",
  sourceName: "WG21 News",
  sourceUrl: "https://www.open-std.org/jtc1/sc22/wg21/",
  feedUrl: "https://www.open-std.org/jtc1/sc22/wg21/",
  tags: ["cpp", "wg21"],
  includePatterns: [/./],
} as const;

export const cppAdapter: SourceAdapter = {
  config,
  scrape: (context) => runHtmlAdapter(config, context, extractEntries),
};

function extractEntries(html: string): RawFeedEntry[] {
  const entries: RawFeedEntry[] = [];

  for (const match of html.matchAll(WG21_NEWS_PATTERN)) {
    if (entries.length >= MAX_ENTRIES) {
      break;
    }

    const [, rawDate, rawSnippet] = match;
    const title = htmlToText(rawSnippet);
    const url = firstLink(rawSnippet) ?? config.sourceUrl;

    entries.push({
      title,
      url: new URL(url, config.sourceUrl).href,
      publishedAt: `${rawDate}T00:00:00Z`,
      summaryHtml: `<p>${escapeHtml(title)}</p>`,
    });
  }

  return entries;
}

function firstLink(html: string): string | undefined {
  return html.match(/<a [^>]*href="([^"]+)"/i)?.[1];
}

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  return doc?.body?.textContent?.replace(/\s+/g, " ").trim() ??
    html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
