import type { SourceAdapter } from "../types.ts";
import { runFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "php-releases",
  language: "PHP",
  languageSlug: "php",
  sourceName: "PHP.net Releases",
  sourceUrl: "https://www.php.net/releases/",
  feedUrl: "https://www.php.net/releases/feed.php",
  tags: ["php", "php-releases"],
  includePatterns: [
    /php\s+\d+(?:\.\d+)+\s+released/i,
    /security/i,
  ],
} as const;

export const phpAdapter: SourceAdapter = {
  config,
  scrape: (context) => runFeedAdapter(config, context),
};
