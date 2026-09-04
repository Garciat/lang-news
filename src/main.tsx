import { directory, index, json, jsx, site, tree } from "deno-static/mod.ts";

import { SiteConfig, sources } from "./config.ts";
import { readFeeds } from "./feeds.ts";
import { paths } from "./paths.ts";
import { ArticleStorageSchema } from "./types.ts";

import { HomePage } from "./pages/home.tsx";
import { SourcesPage } from "./pages/sources.tsx";
import { SourcePage } from "./pages/source.tsx";

const feeds = await readFeeds(sources);

await site(() => ({
  [index]: jsx(<HomePage feeds={feeds} />),
  [paths.slugs.sources]: {
    [index]: jsx(<SourcesPage feeds={feeds} />),
  },
  [paths.slugs.source]: tree(
    feeds.sources.map((
      source,
    ) => [
      source.source.name,
      {
        [index]: jsx(
          <SourcePage
            key={source.source.name}
            source={source.source}
            articles={source.result.articles}
          />,
        ),
      },
    ]),
  ),
  [SiteConfig.storagePath]: json(
    ArticleStorageSchema.encode({
      version: 2,
      result: feeds,
    }),
  ),
  [paths.slugs.assets]: directory(import.meta.resolve("./assets/")),
}));
