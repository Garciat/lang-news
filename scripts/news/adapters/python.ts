import type { SourceAdapter } from "../types.ts";
import { createFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "python-insider",
  language: "Python",
  languageSlug: "python",
  sourceName: "Python Insider",
  sourceUrl: "https://blog.python.org/",
  feedUrl: "https://blog.python.org/rss.xml",
  tags: ["python", "python-insider"],
  includePatterns: [
    /python\s+\d+\.\d+/i,
    /release|released|beta|alpha|rc|pep|feature|announc/i,
  ],
  excludePatterns: [
    /jobs|community|event|conference|survey/i,
  ],
} as const;

export const pythonAdapter: SourceAdapter = createFeedAdapter(config);
