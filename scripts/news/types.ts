export const NEWS_ARTICLES_DIR = "src/generated/articles";
export const NEWS_SITE_DIR = "src/generated/site";

export interface ArticleSourceConfig {
  id: string;
  language: string;
  languageSlug: string;
  sourceName: string;
  sourceUrl: string;
  feedUrl: string;
  tags: readonly string[];
  includePatterns?: readonly RegExp[];
  excludePatterns?: readonly RegExp[];
  includeTitlePatterns?: readonly RegExp[];
  includeSummaryPatterns?: readonly RegExp[];
  excludeTitlePatterns?: readonly RegExp[];
  excludeSummaryPatterns?: readonly RegExp[];
}

export interface RawFeedEntry {
  title: string;
  url: string;
  publishedAt: string;
  updatedAt?: string;
  summaryHtml?: string;
  contentHtml?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  language: string;
  languageSlug: string;
  sourceName: string;
  sourceUrl: string;
  canonicalUrl: string;
  version?: string;
  summary: string;
  tags: string[];
  collectedAt: string;
  updatedAt: string;
  sourceUpdatedAt?: string;
  contentHash: string;
  url: string;
  sourceId: string;
}

export interface ScraperContext {
  outputDir: string;
  collectedAt: string;
}

export interface SourceAdapter {
  config: ArticleSourceConfig;
  scrape(context: ScraperContext): Promise<NewsArticle[]>;
}

export interface SourceRunResult {
  sourceId: string;
  language: string;
  articleCount: number;
  status: "success" | "error";
  error?: string;
}
