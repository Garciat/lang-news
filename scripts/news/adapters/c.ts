import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.56/deno-dom-wasm.ts";
import type { RawFeedEntry, SourceAdapter } from "../types.ts";
import { runHtmlAdapter } from "../source_adapter.ts";

const WG14_ENTRY_PATTERN =
  /<a href=([^>\s]+)>([^<]+)<\/a>\s+(\d{4}\/\d{2}\/\d{2})\s+([\s\S]*?)<br>/gi;
const MAX_ENTRIES = 25;

const config = {
  id: "wg14",
  language: "C",
  languageSlug: "c",
  sourceName: "WG14 Document Log",
  sourceUrl: "https://open-std.org/JTC1/SC22/WG14/www/",
  feedUrl: "https://open-std.org/JTC1/SC22/WG14/www/wg14_document_log.htm",
  tags: ["c", "wg14"],
  includePatterns: [/./],
} as const;

export const cAdapter: SourceAdapter = {
  config,
  scrape: (context) => runHtmlAdapter(config, context, extractEntries),
};

function extractEntries(html: string): RawFeedEntry[] {
  const entries: RawFeedEntry[] = [];
  const cleanedHtml = html.replace(/<!--[\s\S]*?-->/g, "");

  for (const match of cleanedHtml.matchAll(WG14_ENTRY_PATTERN)) {
    if (entries.length >= MAX_ENTRIES) {
      break;
    }

    const [, href, documentNumber, rawDate, rawMetadata] = match;
    const metadata = htmlToText(rawMetadata);
    const [author, ...titleParts] = metadata.split(", ");
    const titleText = titleParts.join(", ").trim();

    entries.push({
      title: titleText ? `${documentNumber}: ${titleText}` : documentNumber,
      url: new URL(href, config.sourceUrl).href,
      publishedAt: `${rawDate.replaceAll("/", "-")}T00:00:00Z`,
      summaryHtml: `<p>${escapeHtml(author || "WG14")} published ${documentNumber}.</p>`,
    });
  }

  return entries;
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
