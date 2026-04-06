import type { SourceAdapter } from "../types.ts";
import { createFeedAdapter } from "../source_adapter.ts";

const config = {
  id: "erlang-blog",
  language: "Erlang",
  languageSlug: "erlang",
  sourceName: "Erlang/OTP Blog",
  sourceUrl: "https://www.erlang.org/blog",
  feedUrl: "https://www.erlang.org/blog.xml",
  tags: ["erlang", "otp", "erlang-blog"],
  includePatterns: [
    /erlang\/otp\s+\d+/i,
    /release|released|highlights?|eep|language|shell|compiler|type|comprehension/i,
  ],
} as const;

export const erlangAdapter: SourceAdapter = createFeedAdapter(config);
