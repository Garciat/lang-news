import { join } from "@std/path";
import type { ArticleSourceConfig, NewsArticle, ScraperContext } from "./types.ts";
import { fetchText, normalizeEntry, parseFeed, shouldIncludeEntry, uniqueByCanonicalUrl, writeArticleFile } from "./utils.ts";

export async function runFeedAdapter(
  config: ArticleSourceConfig,
  context: ScraperContext,
): Promise<NewsArticle[]> {
  const xml = await fetchText(config.feedUrl);
  const entries = parseFeed(xml)
    .filter((entry) => shouldIncludeEntry(config, entry));

  const articles = uniqueByCanonicalUrl(await Promise.all(
    entries.map((entry) => normalizeEntry(config, entry, context.collectedAt)),
  ));

  const outputDir = join(context.outputDir, config.id);
  for (const article of articles) {
    await writeArticleFile(outputDir, article);
  }

  return articles;
}
