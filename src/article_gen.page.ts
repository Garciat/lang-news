import * as zod from "jsr:@zod/zod";

import { readAtomFeed, readRssFeed } from "./_includes/feed.ts";
import {
  ArticlePageData,
  ArticlesFetchResult,
  ArticleSource,
  ArticleSourceResult,
  ArticleStorageCodec,
  SourcesPageData,
} from "./_includes/types.ts";

export default async function* (
  _data: Lume.Data,
  _h: Lume.Helpers,
): AsyncGenerator<Partial<Lume.Data>> {
  const storage = await fetchFromStorage(
    "https://garciat.com/lang-news/data.json",
  );

  const current = await fetchFromSources(sources);

  const result = mergeFetchResults(current, storage);

  for (const source of result.sources) {
    for (const article of source.result.articles) {
      if (
        article.date.toZonedDateTimeISO("UTC").year ===
          Temporal.Now.plainDateISO().year
      ) {
        yield {
          type: "article",
          title: article.title,
          date: new Date(article.date.epochMilliseconds),
          source: article.source,
          articleLink: article.link,
        } satisfies Partial<Lume.Data> & ArticlePageData;
      }
    }
  }

  yield {
    url: "/data.json",
    content: ArticleStorageCodec.encode({
      version: 2,
      result: result,
    }),
  };

  yield {
    url: "/sources/",
    layout: "layouts/sources.tsx",
    result: result,
  } satisfies Partial<Lume.Data> & SourcesPageData;
}

function mergeFetchResults(
  current: ArticlesFetchResult,
  storage: ArticlesFetchResult | undefined,
): ArticlesFetchResult {
  const storageBySourceName = new Map(
    Array.from(function* () {
      for (const source of storage?.sources ?? []) {
        yield [source.source.name, source];
      }
    }()),
  );

  return {
    fetchedAt: current.fetchedAt,
    sources: current.sources.map((source) => {
      const stored = storageBySourceName.get(source.source.name);
      if (stored === undefined) {
        return source;
      }

      if (stored.source.url !== source.source.url) {
        return source;
      }

      return {
        source: source.source,
        result: {
          updatedAt: source.result.updatedAt,
          lastFetchError: source.result.lastFetchError,
          articles: dedupeBy(
            [...source.result.articles, ...stored.result.articles],
            (article) => article.link.toString(),
          ),
        },
      };
    }),
  };
}

const sources: ReadonlyArray<ArticleSource> = [
  {
    name: "clojure",
    url: "https://clojure.org/feed.xml",
    kind: "rss",
  },
  {
    name: "csharp",
    url: "https://devblogs.microsoft.com/dotnet/tag/csharp/feed/",
    kind: "rss",
  },
  {
    name: "dlang",
    url: "https://blog.dlang.org/feed.xml",
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
    name: "kotlin",
    url: "https://blog.jetbrains.com/kotlin/category/releases/feed/",
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
    name: "zig",
    url: "https://ziglang.org/news/index.xml",
    kind: "rss",
  },
];

async function fetchFromSources(
  sources: ReadonlyArray<ArticleSource>,
): Promise<ArticlesFetchResult> {
  const results = await Promise.all(
    sources.map(async (source) => {
      switch (source.kind) {
        case "rss":
          return {
            source,
            result: await rss(source.name, source.url),
          };
        case "atom":
          return {
            source,
            result: await atom(source.name, source.url),
          };
      }
    }),
  );

  return {
    fetchedAt: Temporal.Now.instant(),
    sources: results,
  };
}

async function rss(
  source: string,
  url: string,
): Promise<ArticleSourceResult> {
  const feed = await readRssFeed(url);

  if (!feed.success) {
    console.warn(`[${source}] failed to fetch`, feed.error);
    return {
      updatedAt: Temporal.Now.instant(),
      articles: [],
      lastFetchError: feed.error.message,
    };
  }

  const channel = feed.data.channels[0];

  console.log(
    `[${source}] fetched ${channel.items.length} articles`,
  );

  return {
    updatedAt: channel.lastBuildDate,
    articles: channel.items.map((item) => ({
      title: item.title,
      date: item.pubDate,
      link: item.link,
      source: source,
    })),
  };
}

async function atom(
  source: string,
  url: string,
): Promise<ArticleSourceResult> {
  const feed = await readAtomFeed(url);

  if (!feed.success) {
    console.warn(`[${source}] failed to fetch`, feed.error);
    return {
      updatedAt: Temporal.Now.instant(),
      articles: [],
      lastFetchError: feed.error.message,
    };
  }

  console.log(
    `[${source}] fetched ${feed.data.entries.length} articles`,
  );

  return {
    updatedAt: feed.data.updated,
    articles: feed.data.entries.map((entry) => ({
      title: entry.title,
      date: entry.updated,
      link: entry.link,
      source: source,
    })),
  };
}

async function fetchFromStorage(
  url: string,
): Promise<ArticlesFetchResult | undefined> {
  const res = await fetch(url);
  const body = await res.text();

  const storage = ArticleStorageCodec.safeDecode(body);

  if (!storage.success) {
    console.warn(
      `ignoring storage: failed to parse:\n${zod.prettifyError(storage.error)}`,
    );
    return undefined;
  }

  console.log(
    `read articles from storage dated: ${storage.data.result.fetchedAt.toString()}`,
  );

  return storage.data.result;
}

// because objects provide no meaningful keying
type BasicEquatable =
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

function dedupeBy<T, K extends BasicEquatable>(
  items: ReadonlyArray<T>,
  key: (value: T) => K,
): ReadonlyArray<T> {
  return Map.groupBy(items, key).values().map(([value]) => value).toArray();
}
