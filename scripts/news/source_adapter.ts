import { join } from "@std/path";
import type {
  ArticleSourceConfig,
  NewsArticle,
  RawFeedEntry,
  ScraperContext,
  SourceAdapter,
} from "./types.ts";
import {
  articleFileName,
  ensureDir,
  fetchText,
  normalizeEntry,
  parseFeed,
  shouldIncludeEntry,
  uniqueByCanonicalUrl,
  writeArticleFile,
} from "./utils.ts";

export async function runFeedAdapter(
  config: ArticleSourceConfig,
  context: ScraperContext,
): Promise<NewsArticle[]> {
  const xml = await fetchText(config.feedUrl);
  return await runEntriesAdapter(config, context, parseFeed(xml));
}

export function createFeedAdapter(
  config: ArticleSourceConfig,
): SourceAdapter {
  return {
    config,
    scrape: (context) => runFeedAdapter(config, context),
  };
}

export async function runHtmlAdapter(
  config: ArticleSourceConfig,
  context: ScraperContext,
  extractEntries: (html: string) => RawFeedEntry[],
): Promise<NewsArticle[]> {
  const html = await fetchText(config.feedUrl);
  return await runEntriesAdapter(config, context, extractEntries(html));
}

async function runEntriesAdapter(
  config: ArticleSourceConfig,
  context: ScraperContext,
  entries: RawFeedEntry[],
): Promise<NewsArticle[]> {
  const filteredEntries = entries.filter((entry) => shouldIncludeEntry(config, entry));
  const articles = uniqueByCanonicalUrl(await Promise.all(
    filteredEntries.map((entry) => normalizeEntry(config, entry, context.collectedAt)),
  ));

  const outputDir = join(context.outputDir, config.id);
  await ensureDir(outputDir);
  for (const article of articles) {
    await writeArticleFile(outputDir, article);
  }
  await pruneRemovedArticles(outputDir, articles);

  return articles;
}

async function pruneRemovedArticles(
  outputDir: string,
  articles: NewsArticle[],
): Promise<void> {
  const nextFiles = new Set(articles.map(articleFileName));

  for await (const entry of Deno.readDir(outputDir)) {
    if (!entry.isFile || !entry.name.endsWith(".md") || nextFiles.has(entry.name)) {
      continue;
    }

    await Deno.remove(join(outputDir, entry.name));
  }
}
