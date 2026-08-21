import * as zod from "@zod/zod";

const UtcDateTimeCodec = zod.codec(
  zod.iso.datetime(),
  zod.instanceof(Temporal.Instant),
  {
    decode: (text) => Temporal.Instant.from(text),
    encode: (dt) => dt.toString(),
  },
);

const UrlCodec = zod.codec(
  zod.url(),
  zod.instanceof(URL),
  {
    decode: (text) => new URL(text),
    encode: (url) => url.toString(),
  },
);

const ArticleSchema = zod.object({
  title: zod.string(),
  date: UtcDateTimeCodec,
  link: UrlCodec,
  source: zod.string(),
});

export type Article = zod.infer<typeof ArticleSchema>;

const ArticleSourceSchema = zod.object({
  name: zod.string(),
  url: zod.url(),
  kind: zod.literal(["rss", "atom"]),
  proxy: zod.optional(zod.boolean()),
});

export type ArticleSource = zod.infer<typeof ArticleSourceSchema>;

const ArticleSourceResultSchema = zod.object({
  updatedAt: UtcDateTimeCodec,
  articles: zod.array(ArticleSchema).readonly(),
  lastFetchError: zod.optional(zod.string()),
});

export type ArticleSourceResult = zod.infer<typeof ArticleSourceResultSchema>;

const ArticlesFetchResultSchema = zod.object({
  fetchedAt: UtcDateTimeCodec,
  sources: zod.array(zod.object({
    source: ArticleSourceSchema,
    result: ArticleSourceResultSchema,
  })).readonly(),
});

export type ArticlesFetchResult = zod.infer<typeof ArticlesFetchResultSchema>;

const ArticleStorageSchema = zod.object({
  version: zod.literal(2),
  result: ArticlesFetchResultSchema,
});

export const ArticleStorageCodec = zod.codec(
  zod.string(),
  ArticleStorageSchema,
  {
    decode: (text) => JSON.parse(text),
    encode: (storage) => JSON.stringify(storage),
  },
);
