import { MuxAsyncIterator } from "jsr:@std/async/mux-async-iterator";

import * as zod from "jsr:@zod/zod";

import {
  AtomEntry,
  readAtomFeed,
  readRssFeed,
  RssItem,
} from "./_includes/feed.ts";
import { ArticlePageData } from "./_includes/types.ts";

const ArticleSchema = zod.object({
  title: zod.string(),
  date: zod.instanceof(Temporal.ZonedDateTime),
  link: zod.instanceof(URL),
  source: zod.string(),
});

type Article = zod.infer<typeof ArticleSchema>;

const StoredArticleSchema = zod.object({
  title: zod.string(),
  date: zod.iso.datetime(),
  link: zod.url(),
  source: zod.string(),
});

const StoredArticleCodec = zod.codec(
  StoredArticleSchema,
  ArticleSchema,
  {
    decode: (stored) => ({
      title: stored.title,
      date: Temporal.Instant.from(stored.date).toZonedDateTimeISO("UTC"),
      link: new URL(stored.link),
      source: stored.source,
    }),
    encode: (article) => ({
      title: article.title,
      date: article.date.toInstant().toString(),
      link: article.link.toString(),
      source: article.source,
    }),
  },
);

const ArticleStorageSchema = zod.object({
  version: zod.literal(1),
  articles: zod.array(StoredArticleSchema).readonly(),
});

const ArticleStorageCodec = zod.codec(
  zod.string(),
  ArticleStorageSchema,
  {
    decode: (text) => JSON.parse(text),
    encode: (storage) => JSON.stringify(storage),
  },
);

export default async function* (
  _data: Lume.Data,
  h: Lume.Helpers,
): AsyncGenerator<Partial<Lume.Data<ArticlePageData>>> {
  const articles = await readAllArticles();

  yield* articles.filter((article) =>
    article.date.year ===
      Temporal.Now.plainDateISO().year
  ).map((article) => ({
    type: "article",
    title: article.title,
    date: new Date(article.date.epochMilliseconds),
    source: article.source,
    articleLink: article.link,
  }));

  yield {
    url: "/data.json",
    content: ArticleStorageCodec.encode({
      version: 1,
      articles: articles.map((article) => StoredArticleCodec.encode(article)),
    }),
  };
}

async function readAllArticles() {
  const articles = await combine(
    storage(
      "https://garciat.com/lang-news/data.json",
    ),
    rss(
      "clojure",
      "https://clojure.org/feed.xml",
    ),
    rss(
      "csharp",
      "https://devblogs.microsoft.com/dotnet/tag/csharp/feed/",
    ),
    atom(
      "dlang",
      "https://blog.dlang.org/feed.xml",
    ),
    atom(
      "elixir",
      "https://elixir-lang.org/atom.xml",
    ),
    atom(
      "erlang",
      "https://www.erlang.org/blog.xml",
    ),
    atom(
      "golang",
      "https://go.dev/blog/feed.atom",
    ),
    atom(
      "haskell",
      "https://blog.haskell.org/atom.xml",
    ),
    rss(
      "java",
      "https://feed.infoq.com/openjdk/news/",
    ),
    // rss(
    //   "java",
    //   "https://bsky.app/profile/jeptracker.bsky.social/rss",
    //   {
    //     mapper: (item) => ({
    //       ...item,
    //       title: item.description ?? "???",
    //     }),
    //   },
    // ),
    rss(
      "kotlin",
      "https://blog.jetbrains.com/kotlin/category/releases/feed/",
    ),
    // atom(
    //   "php",
    //   "https://www.php.net/feed.atom",
    //   {
    //     filter: (entry) => entry?.categories?.has("releases") ?? false,
    //   },
    // ),
    rss(
      "python",
      "https://blog.python.org/rss.xml",
    ),
    rss(
      "ruby",
      "https://www.ruby-lang.org/en/feeds/news.rss",
    ),
    atom(
      "rust",
      "https://blog.rust-lang.org/feed.xml",
    ),
    atom(
      "scala",
      "https://www.scala-lang.org/feed/index.xml",
    ),
    atom(
      "swift",
      "https://www.swift.org/atom.xml",
    ),
    rss(
      "typescript",
      "https://devblogs.microsoft.com/typescript/feed/",
    ),
    rss(
      "zig",
      "https://ziglang.org/news/index.xml",
    ),
  );

  return dedupeBy(articles, (article) => article.link.toString())
    .toSorted((a, b) => Temporal.ZonedDateTime.compare(a.date, b.date));
}

async function* rss(
  source: string,
  url: string,
  options?: { mapper?: (item: RssItem) => RssItem },
): AsyncGenerator<Article> {
  const feed = await readRssFeed(
    url,
  );

  console.log(
    `[${source}] fetched ${feed.channels[0].items.length} articles`,
  );

  const mapper = options?.mapper ?? ((item) => item);

  const builder = (item: RssItem) => ({
    title: item.title,
    date: item.pubDate.toTemporalInstant().toZonedDateTimeISO("UTC"),
    link: item.link,
    source: source,
  });

  for (const item of feed.channels[0].items) {
    yield builder(mapper(item));
  }
}

async function* atom(
  source: string,
  url: string,
  options?: { filter?: (entry: AtomEntry) => boolean },
): AsyncGenerator<Article> {
  const feed = await readAtomFeed(
    url,
  );

  console.log(
    `[${source}] fetched ${feed.entries.length} articles`,
  );

  const filter = options?.filter ?? (() => true);

  for (const entry of feed.entries) {
    if (filter(entry)) {
      yield {
        title: entry.title,
        date: entry.updated.toTemporalInstant().toZonedDateTimeISO("UTC"),
        link: entry.link,
        source: source,
      };
    }
  }
}

async function* storage(url: string): AsyncGenerator<Article> {
  const res = await fetch(url);
  const body = await res.text();

  const storage = ArticleStorageCodec.safeDecode(body);

  if (!storage.success) {
    console.warn(
      `ignoring storage: failed to parse:\n${zod.prettifyError(storage.error)}`,
    );
    return;
  }

  console.log(`read ${storage.data.articles.length} articles from storage`);

  return yield* storage.data.articles.map((stored) =>
    StoredArticleCodec.decode(stored)
  );
}

async function combine<T>(
  ...gens: AsyncGenerator<T>[]
): Promise<ReadonlyArray<T>> {
  const mux = new MuxAsyncIterator<T>();
  for (const gen of gens) {
    mux.add(gen);
  }
  return await Array.fromAsync(mux);
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
