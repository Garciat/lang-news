import { SourcesPageData } from "../types.ts";

export const layout = "layouts/base.tsx";

export const title = "Sources - Programming Language News";

export default (data: Lume.Data<SourcesPageData>, h: Lume.Helpers) => {
  const { result } = data;

  return (
    <>
      <main>
        <header>
          <h1>Programming Language News</h1>
          <p>Fetched at {result.fetchedAt.toString()}</p>
          <p>
            <a href={h.url("/")}>Go back</a>
          </p>
        </header>
        {result.sources.map((source) => (
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
