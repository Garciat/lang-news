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

  type ParserResultGatherer<T> = {
    [K in keyof T]: Array<ParserResult<T[K]>>;
  };

  function _emptyParserResultArray<K, V>(
    [k, _]: [K, V],
  ): [K, Array<ParserResult<V>>] {
    return [k, []];
  }

  function _emptyParserResultGatherer<T extends object>(
    obj: T,
  ): ParserResultGatherer<T> {
    return Object.fromEntries(
      Object.entries(obj).map(_emptyParserResultArray),
    ) as ParserResultGatherer<T>;
  }

  type XmlAttributesParser<T> = Parser<Readonly<Record<string, string>>, T>;

  type XmlChildrenParser<R> = Parser<ReadonlyArray<XML.XmlNode>, R>;

  type XmlChildrenParserRecord<T> = {
    [K in keyof T]: T[K] extends Parser<XML.XmlElement, infer R>
      ? Parser<XML.XmlElement, R>
      : never;
  };

  type XmlChildrenParserRecordResult<C> = {
    [K in keyof C]: ReadonlyArray<ParserResult<C[K]>>;
  };

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
      const children = _emptyParserResultGatherer(parsers);

      for (const node of nodes) {
        if (node.type === "element") {
          if (isKeyOf(parsers, node.name.raw)) {
            const p = parsers[node.name.raw];
            const r = p(node);
            if (r.success) {
              children[node.name.raw].push(r.data as any); // TODO ):
            }
          }
        }
      }

      return safeSuccess(children);
    };
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

  function _node() {
    return zod.object<XML.XmlNode>({
      type: zod.string(),
    });
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
      title: xod.text(zod.string()),
      link: xod.text(UrlSchema),
      pubDate: xod.text(DateRfc2822Schema),
    },
    ({ children }) => ({
      title: children.title.join(),
      link: new URL(children.link.join()),
      pubDate: new Date(children.pubDate.join()),
    } satisfies RssItem),
  );

  const channel = xod.element(
    "channel",
    zod.object(),
    {
      title: xod.text(zod.string()),
      lastBuildDate: xod.text(DateRfc2822Schema),
      item: item,
    },
    ({ children }) => ({
      title: children.title.join(),
      lastBuildDate: new Date(children.lastBuildDate.join()),
      items: children.item,
    } satisfies RssChannel),
  );

  const rss = xod.element(
    "rss",
    zod.object(),
    { channel: channel },
    ({ children }) => ({ channels: children.channel } satisfies RssFeed),
  );

  return rss(doc.root);
}

// Main

async function main() {
  const req = new Request("https://devblogs.microsoft.com/dotnet/tag/c/feed/", {
    method: "GET",
  });

  const res = await fetch(req);

  assert(res.ok);
  assertExists(res.body);

  const doc = XML.parse(await res.text());

  console.log(JSON.stringify(parseRssFeed(doc), null, 2));
}

await main();
