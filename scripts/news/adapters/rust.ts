import type { SourceAdapter } from "../types.ts";
import { runFeedAdapter } from "../source_adapter.ts";

export const rustAdapter: SourceAdapter = {
  config: {
    id: "rust-blog",
    language: "Rust",
    sourceName: "Rust Blog",
    sourceUrl: "https://blog.rust-lang.org/",
    feedUrl: "https://blog.rust-lang.org/feed.xml",
    tags: ["rust", "rust-blog"],
    includePatterns: [
      /release|released|announcing|edition|roadmap|stabiliz|language/i,
      /Rust\s+\d+\.\d+/i,
    ],
    excludePatterns: [
      /call for papers|survey|event|jobs|this week in rust/i,
    ],
  },
  scrape: runFeedAdapter,
};
