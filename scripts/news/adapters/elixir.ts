import type { SourceAdapter } from "../types.ts";
import { createFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "elixir-lang",
  language: "Elixir",
  languageSlug: "elixir",
  sourceName: "Elixir Blog",
  sourceUrl: "https://elixir-lang.org/blog/",
  feedUrl: "https://elixir-lang.org/atom.xml",
  tags: ["elixir", "elixir-lang"],
  includePatterns: [
    /elixir\s+v?\d+(?:\.\d+)?/i,
    /release|released|release candidate|type inference|type checker|type system|set-theoretic|gradual typing|language server|interoperability|compiler|json/i,
  ],
  excludePatterns: [
    /case stud|welcome to our series|meetup|outreach|speaker|trainer/i,
  ],
} as const;

export const elixirAdapter: SourceAdapter = createFeedAdapter(config);
