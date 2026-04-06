import type { SourceAdapter } from "../types.ts";
import { runFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "inside-java",
  language: "Java",
  languageSlug: "java",
  sourceName: "Inside Java",
  sourceUrl: "https://inside.java/",
  feedUrl: "https://inside.java/feed.xml",
  tags: ["java", "inside-java"],
  includePatterns: [
    /java\s+\d+/i,
    /jdk\s+\d+/i,
    /\bjep\s+\d+\b/i,
    /release|released|preview|feature|quality outreach|roadmap|announc|language/i,
  ],
  excludePatterns: [
    /podcast|newsletter/i,
  ],
} as const;

export const javaAdapter: SourceAdapter = {
  config,
  scrape: (context) => runFeedAdapter(config, context),
};
