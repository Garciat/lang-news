export const layout = "layouts/base.tsx";

export const title = "Sources - Programming Language News";

export default ({ feeds }: Lume.Data<FeedsData>, h: Lume.Helpers) => {
  return (
    <>
      <main>
        <header>
          <h1>Programming Language News</h1>
          <p>Fetched at {feeds.fetchedAt.toString()}</p>
          <p>
            <a href={h.url("/")}>Go back</a>
          </p>
        </header>
        {feeds.sources.map((source) => (
          <p>
            <strong>{`[${source.source.name}]`}</strong>{" "}
            <a href={source.source.url}>{source.source.url}</a>
            {" — "}
            <small>
              {`Last updated: ${source.result.updatedAt.toString()}`}
            </small>
            {" — "}
            <small>{`Articles: ${source.result.articles.length}`}</small>
            {source.result.lastFetchError && (
              <>
                {" — "}
                <small>
                  <strong>
                    {`🔴 ${source.result.lastFetchError}`}
                  </strong>
                </small>
              </>
            )}
          </p>
        ))}
      </main>
    </>
  );
};
