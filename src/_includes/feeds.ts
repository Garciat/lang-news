import * as zod from "@zod/zod";

import { readRssFeed } from "lib/rss.ts";
import { readAtomFeed } from "lib/atom.ts";

import {
  ArticlesFetchResult,
  ArticleSource,
  ArticleSourceResult,
  ArticleStorageCodec,
} from "../_includes/types.ts";

export async function readFeeds(
  sources: ReadonlyArray<ArticleSource>,
): Promise<ArticlesFetchResult> {
  const storage = await fetchFromStorage(
    "https://garciat.com/lang-news/data.json",
  );

  const current = await fetchFromSources(sources);

  return mergeFetchResults(current, storage);
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
