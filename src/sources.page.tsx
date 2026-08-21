import { SiteConfig } from "./_includes/config.ts";

export const layout = "layouts/base.tsx";

export const title = `Sources - ${SiteConfig.title}`;

export default ({ feeds }: Lume.Data<FeedsData>, h: Lume.Helpers) => {
  const sources = feeds.sources
    .toSorted((a, b) => a.source.name.localeCompare(b.source.name));

  return (
    <>
      <main>
        <header>
          <h1>{SiteConfig.title}</h1>
          <p>
            <a href={h.url("/")}>Back to all articles</a>
          </p>
        </header>
        {sources.map((source) => (
          <div style={{ margin: "1em 0" }}>
            <header>
              <strong>{source.source.name}</strong>{" "}
              <a href={h.url(`/source/${source.source.name}/`)}>↗</a>
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
    </>
  );
};
