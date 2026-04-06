import type { SourceAdapter } from "../types.ts";
import { runFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "haskell-blog",
  language: "Haskell",
  languageSlug: "haskell",
  sourceName: "Haskell Blog",
  sourceUrl: "https://blog.haskell.org/",
  feedUrl: "https://blog.haskell.org/atom.xml",
  tags: ["haskell", "haskell-blog"],
  includePatterns: [
    /\bghc\b|\bcabal\b|\bhaskell language server\b|\bhls\b/i,
    /release|alpha|beta|lts|language|stability|proposal|foundation/i,
  ],
  excludePatterns: [
    /summer of code|from the trenches|production engineering|survey/i,
  ],
} as const;

export const haskellAdapter: SourceAdapter = {
  config,
  scrape: (context) => runFeedAdapter(config, context),
};
