import type { SourceAdapter } from "../types.ts";
import { createFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "typescript-blog",
  language: "TypeScript",
  languageSlug: "typescript",
  sourceName: "TypeScript Blog",
  sourceUrl: "https://devblogs.microsoft.com/typescript/",
  feedUrl: "https://devblogs.microsoft.com/typescript/feed/",
  tags: ["typescript", "typescript-blog"],
  includePatterns: [
    /typescript\s+\d+(?:\.\d+)?/i,
    /announcing|release candidate|\brc\b|beta|roadmap|language service|compiler/i,
  ],
} as const;

export const typescriptAdapter: SourceAdapter = createFeedAdapter(config);
