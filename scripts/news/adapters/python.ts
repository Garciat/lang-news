import type { SourceAdapter } from "../types.ts";
import { runFeedAdapter } from "../source_adapter.ts";

export const pythonAdapter: SourceAdapter = {
  config: {
    id: "python-insider",
    language: "Python",
    sourceName: "Python Insider",
    sourceUrl: "https://pythoninsider.blogspot.com/",
    feedUrl: "https://feeds.feedburner.com/PythonInsider",
    tags: ["python", "python-insider"],
    includePatterns: [
      /python\s+\d+\.\d+/i,
      /release|released|beta|alpha|rc|pep|feature|announc/i,
    ],
    excludePatterns: [
      /jobs|community|event|conference|survey/i,
    ],
  },
  scrape: runFeedAdapter,
};
