import * as XML from "@std/xml";
import * as zod from "@zod/zod";

import * as xod from "lib/xod.ts";

const Rfc822Codec = zod.codec(
  zod.string(),
  zod.instanceof(Temporal.Instant),
  {
    decode: (value) => new Date(value).toTemporalInstant(),
    encode: (instant) => new Date(instant.epochMilliseconds).toUTCString(),
  },
);

const UrlSchema = zod
  .url()
  .transform((value) => new URL(value));

export interface RssFeed {
  channels: ReadonlyArray<RssChannel>;
}

export interface RssChannel {
  title: string;
  link: URL;
  description: string;
  items: ReadonlyArray<RssItem>;
  lastBuildDate: Temporal.Instant;
}

export interface RssItem {
  title: string;
  link: URL;
  guid: RssGuid | undefined;
  pubDate: Temporal.Instant;
}

export interface RssGuid {
  value: string;
  isPermaLink: boolean;
}

export function parseRssFeed(doc: XML.XmlDocument): xod.Safe<RssFeed> {
  const guid = xod.field(
    "guid",
    zod.object({
      isPermaLink: zod.optional(zod.stringbool()),
    }),
    zod.string(),
    ({ attributes, body }) => ({
      value: body,
      isPermaLink: attributes.isPermaLink ?? false,
    } satisfies RssGuid),
  );

  const item = xod.element(
    "item",
    zod.object(),
    {
      title: xod.optional(xod.text(zod.string())),
      link: xod.one(xod.text(UrlSchema)),
      guid: xod.one(guid),
      pubDate: xod.one(xod.text(Rfc822Codec)),
    },
    ({ children }) => ({
      title: children.title ?? "???",
      link: children.link,
      guid: children.guid,
      pubDate: children.pubDate,
    } satisfies RssItem),
  );

  const channel = xod.element(
    "channel",
    zod.object(),
    {
      title: xod.one(xod.text(zod.string())),
      link: xod.one(xod.text(UrlSchema)),
      description: xod.one(xod.text(zod.string())),
      item: xod.many(item),
      lastBuildDate: xod.optional(xod.text(Rfc822Codec)),
    },
    ({ children }) => ({
      title: children.title,
      link: children.link,
      description: children.description,
      items: children.item,
      lastBuildDate: children.lastBuildDate ?? Temporal.Now.instant(),
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

export function formatRssFeed(feed: RssFeed): XML.XmlDocument {
  return {
    declaration: {
      type: "declaration",
      version: "1.0",
      encoding: "UTF-8",
      line: 1,
      column: 1,
      offset: 0,
    },
    root: element(
      "rss",
      { version: "2.0" },
      feed.channels.map((channel) =>
        element("channel", {}, [
          field("title", {}, channel.title),
          field("link", {}, channel.link.toString()),
          field("description", {}, channel.description),
          field("lastBuildDate", {}, Rfc822Codec.encode(channel.lastBuildDate)),
          ...channel.items.map((item) =>
            element(
              "item",
              {},
              Array.from(function* () {
                yield field("title", {}, item.title);
                yield field("link", {}, item.link.toString());
                yield field("pubDate", {}, Rfc822Codec.encode(item.pubDate));

                if (item.guid !== undefined) {
                  yield field(
                    "guid",
                    { isPermaLink: String(item.guid.isPermaLink) },
                    item.guid.value,
                  );
                }
              }()),
            )
          ),
        ])
      ),
    ),
  };
}

function element(
  name: string,
  attrs: Record<string, string>,
  children: XML.XmlNode[],
): XML.XmlElement {
  return {
    type: "element",
    name: { local: name, raw: name },
    attributes: attrs,
    children: children,
  };
}

function field(
  name: string,
  attrs: Record<string, string>,
  body: string,
): XML.XmlElement {
  return {
    type: "element",
    name: { local: name, raw: name },
    attributes: attrs,
    children: [
      { type: "cdata", text: body },
    ],
  };
}
