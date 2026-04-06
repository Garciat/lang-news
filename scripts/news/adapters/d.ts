import type { SourceAdapter } from "../types.ts";
import { createFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "d-blog",
  language: "D",
  languageSlug: "d",
  sourceName: "The D Blog",
  sourceUrl: "https://dlang.org/blog/",
  feedUrl: "https://dlang.org/blog/feed/",
  tags: ["d", "d-blog"],
  includePatterns: [
    /release|released|announc|compiler|language|spec|phobos|\bdmd\b|\bdub\b/i,
  ],
} as const;

export const dAdapter: SourceAdapter = createFeedAdapter(config);
