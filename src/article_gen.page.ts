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
  date: zod.iso.datetime().transform((s) => new Date(s)),
  link: zod.url().transform((s) => new URL(s)),
  source: zod.string(),
});

type Article = zod.infer<typeof ArticleSchema>;

export default async function* (
  _data: Lume.Data,
  h: Lume.Helpers,
): AsyncGenerator<Partial<Lume.Data<ArticlePageData>>> {
  const dateSlug = (date: Date) =>
    date.toTemporalInstant()
      .toZonedDateTimeISO("UTC")
      .toPlainDate();

  const articles = await combine(
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
      // "https://feed.infoq.com/openjdk/news/",
      "https://bsky.app/profile/jeptracker.bsky.social/rss",
      {
        mapper: (item) => ({
          ...item,
          title: item.description ?? "???",
        }),
      },
    ),
    rss(
      "kotlin",
      "https://blog.jetbrains.com/kotlin/feed/",
    ),
    atom(
      "php",
      "https://www.php.net/feed.atom",
      {
        filter: (entry) => entry?.categories?.has("releases") ?? false,
      },
    ),
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
  );

  yield* articles.map((article) => {
    const basename = h.slugify(article.title);
    const url = `/articles/${article.source}/${
      dateSlug(article.date)
    }/${basename}/`;

    return {
      basename,
      url,
      type: "article",
      layout: "layouts/article.tsx",
      title: article.title,
      date: article.date,
      source: article.source,
      articleLink: article.link,
    };
  });

  yield {
    url: "/data.json",
    content: JSON.stringify({
      articles: articles.map((article) => ({
        title: article.title,
        date: article.date.toISOString(),
        link: article.link,
        source: article.source,
      })),
    }),
  };
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
    date: item.pubDate,
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
        date: entry.updated,
        link: entry.link,
        source: source,
      };
    }
  }
}

async function combine<T>(...gens: AsyncGenerator<T>[]): Promise<T[]> {
  const mux = new MuxAsyncIterator<T>();
  for (const gen of gens) {
    mux.add(gen);
  }
  return await Array.fromAsync(mux);
}
