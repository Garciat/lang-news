import { assert, assertExists } from "jsr:@std/assert";
import * as XML from "jsr:@std/xml";

import * as zod from "jsr:@zod/zod";

// Generic

type Empty = Record<never, never>;

function isKeyOf<T extends object>(
  obj: T,
  key: string,
): key is Extract<keyof T, string> {
  return key in obj;
}

// Parsing

// deno-lint-ignore no-namespace
namespace xod {
  export type Safe<T> =
    | { success: true; data: T }
    | { success: false; error: Error };

  function safeSuccess<T>(data: T): Safe<T> {
    return { success: true, data };
  }

  function safeFail<T>(msg: string, cause?: Error): Safe<T> {
    return { success: false, error: new Error(msg, { cause }) };
  }

  type Parser<T, R> = (input: T) => Safe<R>;

  type ParserResult<P> = P extends Parser<infer _, infer R> ? R
    : never;

  function sequenceParsers<A, B, C>(
    p1: Parser<A, B>,
    p2: Parser<B, C>,
  ): Parser<A, C> {
    return (a) => {
      const b = p1(a);
      return b.success ? p2(b.data) : b; // funny structural subtyping
    };
  }

  type XmlAttributesParser<T> = Parser<Readonly<Record<string, string>>, T>;

  type XmlChildrenParser<R> = Parser<ReadonlyArray<XML.XmlNode>, R>;

  type ElementParser<R> = Parser<XML.XmlElement, R>;

  type XmlChildParser<R> = Parser<
    ReadonlyArray<XML.XmlElement>,
    R
  >;

  type XmlChildrenParserRecord<C> = {
    [K in keyof C & string]: C[K] extends XmlChildParser<infer R>
      ? XmlChildParser<R>
      : never;
  };

  type XmlChildrenParserRecordResult<C> = {
    [K in keyof C]: C[K] extends XmlChildParser<infer R> ? R
      : never;
  };

  function _emptyParserRecordResult<T extends object>(
    obj: T,
  ): XmlChildrenParserRecordResult<T> {
    return Object.fromEntries(
      Object.entries(obj).map(([key, _]) => [key, undefined]), // TODO: undefined is wrong
    ) as XmlChildrenParserRecordResult<T>;
  }

  export function element<C extends XmlChildrenParserRecord<C>, A, R>(
    name: string,
    attributes: zod.ZodType<A>,
    children: C,
    builder: (
      args: { attributes: A; children: XmlChildrenParserRecordResult<C> },
    ) => R,
  ): Parser<XML.XmlNode, R> {
    return sequenceParsers(
      parsingXmlNodeToElement(name),
      sequenceParsers(
        parsingXmlElementContents(
          parsingAttributesWithZod(attributes),
          parsingStructuredXmlChildren(children),
        ),
        (args) => safeSuccess(builder(args)),
      ),
    );
  }

  export function text<T>(
    ty: zod.ZodType<T, string>,
  ): Parser<XML.XmlElement, T> {
    return sequenceParsers(
      parsingXmlElementContents(ignoringAttributes(), parsingXmlTextChildren()),
      ({ children }) => {
        const result = ty.safeDecode(children);
        return result.success
          ? safeSuccess(result.data)
          : safeFail(`zod decode fail`, result.error);
      },
    );
  }

  export function one<T>(parser: ElementParser<T>): XmlChildParser<T> {
    return (elements) => {
      switch (elements.length) {
        case 1:
          return parser(elements[0]);
        default:
          return safeFail("expected exactly one child of specific type");
      }
    };
  }

  export function some<T>(
    parser: ElementParser<T>,
  ): XmlChildParser<ReadonlyArray<T>> {
    return (elements) => {
      if (elements.length === 1) {
        return safeFail("expected at least one child of specific type");
      }

      const output: T[] = [];

      for (const elem of elements) {
        const result = parser(elem);
        if (result.success) {
          output.push(result.data);
        } else {
          return result;
        }
      }

      return safeSuccess(output);
    };
  }

  export function many<T>(
    parser: ElementParser<T>,
  ): XmlChildParser<ReadonlyArray<T>> {
    return (elements) => {
      const output: T[] = [];

      for (const elem of elements) {
        const result = parser(elem);
        if (result.success) {
          output.push(result.data);
        } else {
          return result;
        }
      }

      return safeSuccess(output);
    };
  }

  function parsingXmlTextChildren(): XmlChildrenParser<string> {
    return (nodes) => {
      let result = "";

      for (const node of nodes) {
        switch (node.type) {
          case "text":
          case "cdata":
            result += node.text;
            break;
          case "element":
          case "comment":
            return safeFail(`expected text node, got: ${node.type}`);
        }
      }

      return safeSuccess(result);
    };
  }

  function parsingStructuredXmlChildren<
    C extends XmlChildrenParserRecord<C>,
  >(
    parsers: C,
  ): XmlChildrenParser<XmlChildrenParserRecordResult<C>> {
    return (nodes) => {
      const childElementsByName = Map.groupBy(
        _selectElements(nodes),
        (node) => node.name.raw,
      );
      const children = _emptyParserRecordResult(parsers);

      for (const [name, elements] of childElementsByName.entries()) {
        if (isKeyOf(parsers, name)) {
          const p = parsers[name];
          const r = p(elements);
          if (r.success) {
            children[name] = r.data as any; // TODO ):
          } else {
            return safeFail("failed to parse children", r.error);
          }
        } else {
          // TODO strict on children?
        }
      }

      return safeSuccess(children);
    };
  }

  function _selectElements(
    nodes: ReadonlyArray<XML.XmlNode>,
  ): ReadonlyArray<XML.XmlElement> {
    return Array.from(function* () {
      for (const node of nodes) {
        if (node.type === "element") {
          yield node;
        }
      }
    }());
  }

  function ignoringChildren(): XmlChildrenParser<Empty> {
    return (_) => safeSuccess({});
  }

  function ignoringAttributes(): XmlAttributesParser<Empty> {
    return (_) => safeSuccess({});
  }

  function parsingAttributesWithZod<T>(
    ty: zod.ZodType<T>,
  ): XmlAttributesParser<T> {
    return (input) => ty.safeDecode(input);
  }

  function parsingXmlNodeToElement(
    name: string,
  ): Parser<XML.XmlNode, XML.XmlElement> {
    return (node: XML.XmlNode) => {
      if (node.type !== "element") {
        return safeFail(`expected element node, got: ${node.type}`);
      }

      if (node.name.local !== name) {
        return safeFail(
          `expected "${name}" element, got: "${node.name.local}"`,
        );
      }

      return safeSuccess(node);
    };
  }

  function parsingXmlElementContents<C, A, R>(
    attributeParser: XmlAttributesParser<A>,
    childrenParser: XmlChildrenParser<C>,
  ): Parser<XML.XmlElement, { attributes: A; children: C }> {
    return (node: XML.XmlElement) => {
      const attributes = attributeParser(node.attributes);

      if (!attributes.success) {
        return safeFail(`invalid attributes`, attributes.error);
      }

      const children = childrenParser(node.children);

      if (!children.success) {
        return safeFail(`invalid children`, children.error);
      }

      return safeSuccess({
        attributes: attributes.data,
        children: children.data,
      });
    };
  }
}

// RSS

interface RssFeed {
  channels: ReadonlyArray<RssChannel>;
}

interface RssChannel {
  title: string;
  lastBuildDate: Date;
  items: ReadonlyArray<RssItem>;
}

interface RssItem {
  title: string;
  link: URL;
  pubDate: Date;
}

const DateRfc2822Schema = zod
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date",
  })
  .transform((value) => new Date(value));

const UrlSchema = zod
  .url()
  .transform((value) => new URL(value));

function parseRssFeed(doc: XML.XmlDocument): xod.Safe<RssFeed> {
  const item = xod.element(
    "item",
    zod.object(),
    {
      title: xod.one(xod.text(zod.string())),
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
      lastBuildDate: xod.one(xod.text(DateRfc2822Schema)),
      item: xod.many(item),
    },
    ({ children }) => ({
      title: children.title,
      lastBuildDate: children.lastBuildDate,
      items: children.item,
    } satisfies RssChannel),
  );

  const rss = xod.element(
    "rss",
    zod.object(),
    { channel: xod.many(channel) },
    ({ children }) => ({ channels: children.channel } satisfies RssFeed),
  );

  return rss(doc.root);
}

export async function readRssFeed(url: string | URL): Promise<RssFeed> {
  const req = new Request(url, {
    method: "GET",
  });

  const res = await fetch(req);

  assert(res.ok);
  assertExists(res.body);

  const doc = XML.parse(await res.text());

  const feed = parseRssFeed(doc);

  if (!feed.success) {
    throw new Error("failed to parse RSS feed", { cause: feed.error });
  }

  return feed.data;
}

// Atom

export interface AtomFeed {
  title: string;
  entries: ReadonlyArray<AtomEntry>;
}

export interface AtomEntry {
  title: string;
  link: URL;
  updated: Date;
  categories?: ReadonlySet<string>;
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
    updated: xod.one(
      xod.text(
        zod.iso.datetime({ offset: true }).transform((value) =>
          new Date(value)
        ),
      ),
    ),
    category: xod.many(category),
  }, ({ children }) => ({
    title: children.title,
    link: children.id,
    updated: children.updated,
    categories: new Set(children.category),
  } satisfies AtomEntry));

  const feed = xod.element(
    "feed",
    zod.object(),
    {
      title: xod.one(xod.text(zod.string())),
      entry: xod.many(entry),
    },
    (
      { children },
    ) => ({
      title: children.title,
      entries: children.entry,
    } satisfies AtomFeed),
  );

  return feed(doc.root);
}

export async function readAtomFeed(url: string | URL): Promise<AtomFeed> {
  const req = new Request(url, {
    method: "GET",
  });

  const res = await fetch(req);

  assert(res.ok);
  assertExists(res.body);

  const doc = XML.parse(await res.text());

  const feed = parseAtomFeed(doc);

  if (!feed.success) {
    throw new Error("failed to parse Atom feed", { cause: feed.error });
  }

  return feed.data;
}
