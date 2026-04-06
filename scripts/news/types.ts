export const NEWS_ARTICLES_DIR = "src/generated/articles";
export const NEWS_SITE_DIR = "src/generated/site";
export const NEWS_DATA_PATH = "src/generated/news.json";
export const NEWS_META_PATH = "src/_data/news_meta.json";

export const ARTICLE_CATEGORIES = [
  "release",
  "feature",
  "spec",
  "tooling",
  "announcement",
] as const;

export type ArticleCategory = typeof ARTICLE_CATEGORIES[number];

export interface ArticleSourceConfig {
  id: string;
  language: string;
  sourceName: string;
  sourceUrl: string;
  feedUrl: string;
  tags: string[];
  includePatterns: RegExp[];
  excludePatterns?: RegExp[];
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
  sourceName: string;
  sourceUrl: string;
  canonicalUrl: string;
  category: ArticleCategory;
  version?: string;
  summary: string;
  content: string;
  tags: string[];
  fetchedAt: string;
  updatedAt: string;
  sourceUpdatedAt?: string;
  contentHash: string;
  url: string;
  sourceId: string;
}

export interface ScraperContext {
  outputDir: string;
  fetchedAt: string;
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

export interface NewsMeta {
  generatedAt: string;
  articleCount: number;
  languages: string[];
  categories: ArticleCategory[];
  sources: SourceRunResult[];
  inclusionRules: string[];
}
