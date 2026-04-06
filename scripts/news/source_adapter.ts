import { join } from "@std/path";
import type { NewsArticle, ScraperContext, SourceAdapter } from "./types.ts";
import { fetchText, normalizeEntry, parseFeed, shouldIncludeEntry, uniqueByCanonicalUrl, writeArticleFile } from "./utils.ts";

export async function runFeedAdapter(
  adapter: SourceAdapter,
  context: ScraperContext,
): Promise<NewsArticle[]> {
  const xml = await fetchText(adapter.config.feedUrl);
  const entries = parseFeed(xml)
    .filter((entry) => shouldIncludeEntry(adapter.config, entry));

  const articles = uniqueByCanonicalUrl(await Promise.all(
    entries.map((entry) => normalizeEntry(adapter.config, entry, context.fetchedAt)),
  ));

  const outputDir = join(context.outputDir, adapter.config.id);
  for (const article of articles) {
    await writeArticleFile(outputDir, article);
  }

  return articles;
}
