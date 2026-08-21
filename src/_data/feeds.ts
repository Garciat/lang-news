import { readFeeds } from "../_includes/feeds.ts";
import { ArticlesFetchResult, ArticleSource } from "../_includes/types.ts";

const sources: ReadonlyArray<ArticleSource> = [
  {
    name: "clojure",
    url: "https://clojure.org/feed.xml",
    kind: "rss",
  },
  {
    name: "cpp",
    url: "https://isocpp.org/blog/rss/category/standardization",
    kind: "rss",
    proxy: true,
  },
  {
    name: "csharp",
    url: "https://devblogs.microsoft.com/dotnet/tag/csharp/feed/",
    kind: "rss",
  },
  {
    name: "dart",
    url: "https://dart.dev/blog/feed.xml",
    kind: "atom",
  },
  {
    name: "dlang",
    url: "https://blog.dlang.org/feed.xml",
    kind: "atom",
  },
  {
    name: "dotnet",
    url: "https://devblogs.microsoft.com/dotnet/category/aspnetcore/feed/",
    kind: "rss",
  },
  {
    name: "ecmascript",
    url: "https://ecmascript-daily.github.io/atom.xml",
    kind: "atom",
  },
  {
    name: "elixir",
    url: "https://elixir-lang.org/atom.xml",
    kind: "atom",
  },
  {
    name: "erlang",
    url: "https://www.erlang.org/blog.xml",
    kind: "atom",
  },
  {
    name: "fsharp",
    url: "https://devblogs.microsoft.com/dotnet/tag/f/feed/",
    kind: "rss",
  },
  {
    name: "ghc",
    url: "https://www.haskell.org/ghc/rss.xml",
    kind: "rss",
  },
  {
    name: "golang",
    url: "https://go.dev/blog/feed.atom",
    kind: "atom",
  },
  {
    name: "haskell",
    url: "https://blog.haskell.org/atom.xml",
    kind: "atom",
  },
  {
    name: "java",
    url: "https://feed.infoq.com/openjdk/news/",
    kind: "rss",
  },
  {
    name: "julia",
    url: "https://julialang.org/feed.xml",
    kind: "rss",
  },
  {
    name: "kotlin",
    url: "https://blog.jetbrains.com/kotlin/category/releases/feed/",
    kind: "rss",
  },
  {
    name: "openjdk",
    url: "https://garciat.com/openjdk-jep-history/feed.xml",
    kind: "rss",
  },
  {
    name: "python",
    url: "https://blog.python.org/rss.xml",
    kind: "rss",
  },
  {
    name: "ruby",
    url: "https://www.ruby-lang.org/en/feeds/news.rss",
    kind: "rss",
  },
  {
    name: "rust",
    url: "https://blog.rust-lang.org/feed.xml",
    kind: "atom",
  },
  {
    name: "scala",
    url: "https://www.scala-lang.org/feed/index.xml",
    kind: "atom",
  },
  {
    name: "swift",
    url: "https://www.swift.org/atom.xml",
    kind: "atom",
  },
  {
    name: "typescript",
    url: "https://devblogs.microsoft.com/typescript/feed/",
    kind: "rss",
  },
  {
    name: "w3c",
    url: "https://www.w3.org/news/feed/",
    kind: "rss",
  },
  {
    name: "wasm",
    url: "https://bytecodealliance.org/feed.xml",
    kind: "atom",
  },
  {
    name: "web",
    url: "https://web.dev/static/blog/feed.xml",
    kind: "rss",
  },
  {
    name: "zig",
    url: "https://ziglang.org/news/index.xml",
    kind: "rss",
  },
];

const feeds = await readFeeds(sources);

export default feeds;

declare global {
  interface FeedsData {
    feeds: ArticlesFetchResult;
  }
}
