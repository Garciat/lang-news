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
  description?: string;
}

export async function readRssFeed(
  url: string | URL,
): Promise<xod.Safe<RssFeed>> {
  const req = new Request(url, {
    method: "GET",
  });

  const res = await fetch(req);

  if (!res.ok || !res.body) {
    return xod.safeFail(`failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const doc = XML.parse(await res.text());

  const feed = parseRssFeed(doc);

  if (!feed.success) {
    return xod.safeFail("failed to parse RSS feed", feed.error);
  }

  return feed;
}

function parseRssFeed(doc: XML.XmlDocument): xod.Safe<RssFeed> {
  const item = xod.element(
    "item",
    zod.object(),
    {
      title: xod.optional(xod.text(zod.string())),
      link: xod.one(xod.text(UrlSchema)),
      pubDate: xod.one(xod.text(DateRfc2822Schema)),
      description: xod.optional(xod.text(zod.string())),
    },
    ({ children }) => ({
      title: children.title ?? "???",
      link: children.link,
      pubDate: children.pubDate,
      description: children.description,
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
