import * as XML from "@std/xml";
import * as zod from "@zod/zod";

type Empty = Record<never, never>;

function typedKeys<T extends object>(obj: T): ReadonlyArray<keyof T> {
  return Object.keys(obj).map((key) => (key as keyof T));
}

export type Safe<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

export function safeSuccess<T>(data: T): Safe<T> {
  return { success: true, data };
}

export function safeFail<T>(msg: string, cause?: Error): Safe<T> {
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

export function field<A, T, R>(
  name: string,
  attributes: zod.ZodType<A>,
  bodyType: zod.ZodType<T, string>,
  builder: (
    args: { attributes: A; body: T },
  ) => R,
): Parser<XML.XmlElement, R> {
  return sequenceParsers(
    parsingXmlNodeToElement(name),
    sequenceParsers(
      parsingXmlElementContents(
        parsingAttributesWithZod(attributes),
        parsingXmlTextChildren(),
      ),
      ({ attributes, children }) => {
        const result = bodyType.safeDecode(children);
        return result.success
          ? safeSuccess(builder({ attributes, body: result.data }))
          : safeFail(`zod decode fail`, result.error);
      },
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

export function optional<T>(
  parser: ElementParser<T>,
): XmlChildParser<T | undefined> {
  return (elements) => {
    switch (elements.length) {
      case 0:
        return safeSuccess(undefined);
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
    if (elements.length === 0) {
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

    for (const key of typedKeys(parsers)) {
      const parser = parsers[key];
      const elements = childElementsByName.get(key as string) ?? [];
      const parse = parser(elements);
      if (parse.success) {
        children[key] = parse.data as any; // TODO ):
      } else {
        return safeFail(
          `failed to parse children for field: ${String(key)}`,
          parse.error,
        );
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
