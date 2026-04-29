import { assertEquals } from "jsr:@std/assert";
import { parseFeed } from "./utils.ts";

Deno.test("parseFeed falls back to entry id when enclosure links do not point to article pages", () => {
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:php="http://php.net/ns/releases">
  <entry>
    <title>PHP 8.5.5 released!</title>
    <id>http://php.net/releases/8_5_5.php</id>
    <published>2026-04-09T00:00:00+00:00</published>
    <summary type="html">There is a new PHP release in town!</summary>
    <link rel="enclosure" title="PHP 8.5.5 (tar.gz)" href="/distributions/php-8.5.5.tar.gz">
      <php:sha256>276279f637a875a514346b332bba6d8b06c036cf7979a858e5c55f72c4874884</php:sha256>
      <php:releaseDate>2026-04-09T00:00:00+00:00</php:releaseDate>
    </link>
  </entry>
</feed>`;

  const [entry] = parseFeed(feed);

  assertEquals(entry.url, "http://php.net/releases/8_5_5.php");
});

Deno.test("parseFeed still reads standard RSS item links", () => {
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Example release</title>
      <link>https://example.com/releases/1</link>
      <pubDate>2026-04-09T00:00:00+00:00</pubDate>
      <description>Example summary</description>
    </item>
  </channel>
</rss>`;

  const [entry] = parseFeed(feed);

  assertEquals(entry.url, "https://example.com/releases/1");
});
