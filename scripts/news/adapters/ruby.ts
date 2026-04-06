import type { SourceAdapter } from "../types.ts";
import { createFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "ruby-news",
  language: "Ruby",
  languageSlug: "ruby",
  sourceName: "Ruby News",
  sourceUrl: "https://www.ruby-lang.org/en/news/",
  feedUrl: "https://www.ruby-lang.org/en/feeds/news.rss",
  tags: ["ruby", "ruby-news"],
  includePatterns: [
    /ruby\s+\d+(?:\.\d+)+/i,
    /released|release|security|cve|preview|yjit|prism/i,
  ],
  excludePatterns: [
    /redesign|site identity|documentation/i,
  ],
} as const;

export const rubyAdapter: SourceAdapter = createFeedAdapter(config);
