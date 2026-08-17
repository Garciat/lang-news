export const layout = "layouts/base.tsx";

export const title = "Sources - Programming Language News";

export default ({ feeds }: Lume.Data<FeedsData>, h: Lume.Helpers) => {
  const sources = feeds.sources
    .toSorted((a, b) => a.source.name.localeCompare(b.source.name));

  return (
    <>
      <main>
        <header>
          <h1>Programming Language News</h1>
          <p>
            <a href={h.url("/")}>Go back</a>
          </p>
          <p>Fetched at {feeds.fetchedAt.toString()}</p>
        </header>
        {sources.map((source) => (
          <div style={{ margin: "1em 0" }}>
            <header>
              <strong>{source.source.name}</strong>
              {" "}
            </header>
            <div>
              <a href={source.source.url}>{source.source.url}</a>
            </div>
            <div>
              {`Last updated: ${source.result.updatedAt.toString()}`}
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
