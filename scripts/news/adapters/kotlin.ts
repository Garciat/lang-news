import type { SourceAdapter } from "../types.ts";
import { runFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "kotlin-blog",
  language: "Kotlin",
  languageSlug: "kotlin",
  sourceName: "Kotlin Blog",
  sourceUrl: "https://blog.jetbrains.com/kotlin/",
  feedUrl: "https://blog.jetbrains.com/kotlin/feed/",
  tags: ["kotlin", "kotlin-blog"],
  includePatterns: [
    /kotlin\s+\d+(?:\.\d+)+/i,
    /\bk2\b/i,
    /release|beta|alpha|rc|roadmap|language|compiler|announc/i,
  ],
  excludePatterns: [
    /kotlinconf|interview|webinar/i,
  ],
} as const;

export const kotlinAdapter: SourceAdapter = {
  config,
  scrape: (context) => runFeedAdapter(config, context),
};
