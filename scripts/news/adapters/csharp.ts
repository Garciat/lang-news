import type { SourceAdapter } from "../types.ts";
import { runFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "csharp-dotnet-blog",
  language: "C#",
  languageSlug: "csharp",
  sourceName: ".NET Blog (C#)",
  sourceUrl: "https://devblogs.microsoft.com/dotnet/tag/csharp/",
  feedUrl: "https://devblogs.microsoft.com/dotnet/tag/csharp/feed/",
  tags: ["csharp", "dotnet-blog"],
  includePatterns: [
    /introducing c#|c#\s+\d+/i,
    /preview features|language|compiler|roslyn|spec/i,
  ],
  excludePatterns: [
    /dev kit|ai|toolkit|startup|mcp|aspire|nuget|native aot/i,
  ],
} as const;

export const csharpAdapter: SourceAdapter = {
  config,
  scrape: (context) => runFeedAdapter(config, context),
};
