import { helpers } from "deno-static/mod.ts";
import { SiteConfig } from "../config.ts";
import { ArticlesFetchResult } from "../types.ts";

import { BaseLayout } from "./layouts/base.tsx";

type SourcePageProps = {
  feeds: ArticlesFetchResult;
};

export const SourcesPage: React.FC<SourcePageProps> = ({ feeds }) => {
  const sources = feeds.sources
    .toSorted((a, b) => a.source.name.localeCompare(b.source.name));

  return (
    <BaseLayout title={`Sources - ${SiteConfig.title}`} url="/sources/">
      <main>
        <header>
          <h1>{SiteConfig.title}</h1>
          <p>
            <a href={helpers.url("/")}>Back to all articles</a>
          </p>
        </header>
        {sources.map((source) => (
          <div key={source.source.name} style={{ margin: "1em 0" }}>
            <header>
              <strong>{source.source.name}</strong>{" "}
              <a href={helpers.url(`/source/${source.source.name}/`)}>↗</a>
            </header>
            <div>
              <a href={source.source.url}>{source.source.url}</a>
            </div>
            <div>
              Last updated:{" "}
              <relative-time datetime={source.result.updatedAt.toString()}>
                {new Date(source.result.updatedAt.epochMilliseconds)
                  .toUTCString()}
              </relative-time>
            </div>
            <div>
              {`Articles: ${source.result.articles.length}`}
            </div>
            {source.result.lastFetchError && (
              <div>
                🔴 Last error: <code>{source.result.lastFetchError}</code>
              </div>
            )}
          </div>
        ))}
      </main>
    </BaseLayout>
  );
};
