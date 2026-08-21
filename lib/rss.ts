import * as HTML from "jsr:@std/html@1.0.7";
import * as XML from "@std/xml";
import * as zod from "@zod/zod";

import * as xod from "lib/xod.ts";

const DateRfc2822Schema = zod
  .string()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    {
      message: "Invalid date",
    },
  )
  .transform((value) => new Date(value).toTemporalInstant());

const UrlSchema = zod
  .url()
  .transform((value) => new URL(value));

const HtmlEscapedTextCodec = zod.codec(
  zod.string(),
  zod.string(),
  {
    decode: (value) => HTML.unescape(value),
    encode: (value) => HTML.escape(value),
  },
);

export interface RssFeed {
  channels: ReadonlyArray<RssChannel>;
}

export interface RssChannel {
  title: string;
  lastBuildDate: Temporal.Instant;
  items: ReadonlyArray<RssItem>;
}

export interface RssItem {
  title: string;
  link: URL;
  pubDate: Temporal.Instant;
}

export function parseRssFeed(doc: XML.XmlDocument): xod.Safe<RssFeed> {
  const item = xod.element(
    "item",
    zod.object(),
    {
      title: xod.one(xod.text(HtmlEscapedTextCodec)),
      link: xod.one(xod.text(UrlSchema)),
      pubDate: xod.one(xod.text(DateRfc2822Schema)),
    },
    ({ children }) => ({
      title: children.title,
      link: children.link,
      pubDate: children.pubDate,
    } satisfies RssItem),
  );

  const channel = xod.element(
    "channel",
    zod.object(),
    {
      title: xod.one(xod.text(zod.string())),
      lastBuildDate: xod.optional(xod.text(DateRfc2822Schema)),
      item: xod.many(item),
    },
    ({ children }) => ({
      title: children.title,
      lastBuildDate: children.lastBuildDate ?? Temporal.Now.instant(),
      items: children.item,
    } satisfies RssChannel),
  );

  const rss = xod.element(
    "rss",
    zod.object(),
    { channel: xod.some(channel) },
    ({ children }) => ({ channels: children.channel } satisfies RssFeed),
  );

  return rss(doc.root);
}
