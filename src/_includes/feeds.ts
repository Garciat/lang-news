import * as XML from "@std/xml";
import * as zod from "@zod/zod";

import { parseRssFeed } from "lib/rss.ts";
import { parseAtomFeed } from "lib/atom.ts";

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

async function fetchFromSources(
  sources: ReadonlyArray<ArticleSource>,
): Promise<ArticlesFetchResult> {
  const results = await Promise.all(
    sources.map(fetchFromSource),
  );

  return {
    fetchedAt: Temporal.Now.instant(),
    sources: results,
  };
}

async function fetchFromSource(source: ArticleSource) {
  const req = new Request(source.url, {
    method: "GET",
  });

  const res = await fetch(req);

  if (!res.ok || !res.body) {
    return {
      source,
      result: failedResult(
        `failed to fetch URL: ${res.status} ${res.statusText}`,
      ),
    };
  }

  switch (source.kind) {
    case "rss":
      return {
        source,
        result: await rss(source.name, res),
      };
    case "atom":
      return {
        source,
        result: await atom(source.name, res),
      };
  }
}

async function rss(
  source: string,
  res: Response,
): Promise<ArticleSourceResult> {
  const doc = XML.parse(await res.text());

  const feed = parseRssFeed(doc);

  if (!feed.success) {
    return failedResult(`failed to parse RSS feed: ${feed.error.message}`);
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
  res: Response,
): Promise<ArticleSourceResult> {
  const doc = XML.parse(await res.text());

  const feed = parseAtomFeed(doc);

  if (!feed.success) {
    return failedResult(`failed to parse Atom feed: ${feed.error.message}`);
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

function failedResult(message: string): ArticleSourceResult {
  return {
    updatedAt: Temporal.Now.instant(),
    articles: [],
    lastFetchError: message,
  };
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
