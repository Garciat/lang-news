import * as XML from "@std/xml";
import * as zod from "@zod/zod";

import * as xod from "lib/xod.ts";

const UrlSchema = zod
  .url()
  .transform((value) => new URL(value));

const OffsetDateTimeSchema = zod.iso
  .datetime({ offset: true })
  .transform((value) => Temporal.Instant.from(value));

export interface AtomFeed {
  title: string;
  updated: Temporal.Instant;
  entries: ReadonlyArray<AtomEntry>;
}

export interface AtomEntry {
  title: string;
  link: URL;
  updated: Temporal.Instant;
  categories?: ReadonlySet<string>;
}

export async function readAtomFeed(
  url: string | URL,
): Promise<xod.Safe<AtomFeed>> {
  const req = new Request(url, {
    method: "GET",
  });

  const res = await fetch(req);

  if (!res.ok || !res.body) {
    return xod.safeFail(`failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const doc = XML.parse(await res.text());

  const feed = parseAtomFeed(doc);

  if (!feed.success) {
    return xod.safeFail("failed to parse RSS feed", feed.error);
  }

  return feed;
}

function parseAtomFeed(doc: XML.XmlDocument): xod.Safe<AtomFeed> {
  const link = xod.element(
    "link",
    zod.object({ href: UrlSchema }),
    {},
    ({ attributes }) => attributes.href,
  );

  const category = xod.element(
    "category",
    zod.object({ term: zod.string() }),
    {},
    ({ attributes }) => attributes.term,
  );

  const entry = xod.element("entry", zod.object(), {
    title: xod.one(xod.text(zod.string())),
    id: xod.one(xod.text(UrlSchema)),
    link: xod.many(link),
    updated: xod.one(xod.text(OffsetDateTimeSchema)),
    category: xod.many(category),
  }, ({ children }) => ({
    title: children.title,
    // TODO lil hack to avoid checking link:rel
    link: children.link.length === 1 ? children.link[0] : children.id,
    updated: children.updated,
    categories: new Set(children.category),
  } satisfies AtomEntry));

  const feed = xod.element(
    "feed",
    zod.object(),
    {
      title: xod.one(xod.text(zod.string())),
      updated: xod.one(xod.text(OffsetDateTimeSchema)),
      entry: xod.many(entry),
    },
    (
      { children },
    ) => ({
      title: children.title,
      updated: children.updated,
      entries: children.entry,
    } satisfies AtomFeed),
  );

  return feed(doc.root);
}
