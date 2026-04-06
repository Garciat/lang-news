import type { SourceAdapter } from "../types.ts";
import { createFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "go-blog",
  language: "Go",
  languageSlug: "go",
  sourceName: "The Go Blog",
  sourceUrl: "https://go.dev/blog/",
  feedUrl: "https://go.dev/blog/feed.atom",
  tags: ["go", "go-blog"],
  includePatterns: [
    /go\s+\d+(?:\.\d+)?/i,
    /release|released|proposal|language|toolchain|compiler|runtime|garbage collector|go fix|inliner|allocation|type/i,
  ],
  excludePatterns: [
    /survey|birthday|sweet\s+\d+/i,
  ],
} as const;

export const goAdapter: SourceAdapter = createFeedAdapter(config);
