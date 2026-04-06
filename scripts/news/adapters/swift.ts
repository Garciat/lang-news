import type { SourceAdapter } from "../types.ts";
import { createFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "swift-blog",
  language: "Swift",
  languageSlug: "swift",
  sourceName: "Swift.org Blog",
  sourceUrl: "https://www.swift.org/blog/",
  feedUrl: "https://www.swift.org/atom.xml",
  tags: ["swift", "swift-blog"],
  includeTitlePatterns: [
    /swift\s+\d+(?:\.\d+)?/i,
    /release|released|release candidate|toolchain|package manager|build|language|evolution|concurrency|interoperability/i,
  ],
  excludeTitlePatterns: [
    /what'?s new in swift|community|adopters|workgroup/i,
  ],
} as const;

export const swiftAdapter: SourceAdapter = createFeedAdapter(config);
