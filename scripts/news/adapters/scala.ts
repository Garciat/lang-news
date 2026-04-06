import type { SourceAdapter } from "../types.ts";
import { createFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "scala-lang",
  language: "Scala",
  languageSlug: "scala",
  sourceName: "Scala Blog",
  sourceUrl: "https://www.scala-lang.org/blog/",
  feedUrl: "https://www.scala-lang.org/feed/index.xml",
  tags: ["scala", "scala-lang"],
  includePatterns: [
    /scala\s+\d+(?:\.\d+)?/i,
    /release|released|security|compiler|language|type|platform|roadmap/i,
  ],
  excludePatterns: [
    /scala days|advent of code|recap|meetup|conference/i,
  ],
} as const;

export const scalaAdapter: SourceAdapter = createFeedAdapter(config);
