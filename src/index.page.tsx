import { ArticlePageData } from "./_includes/types.ts";

export const layout = "layouts/base.tsx";

export const title = "Programming Language News";

export default (data: Lume.Data, h: Lume.Helpers) => {
  const { search } = data;

  const articles = search.pages<Lume.Data<ArticlePageData>>(
    "type=article",
    "date=desc",
  );

  return (
    <>
      <main>
        <header>
          <h1>Programming Language News</h1>
          <p>Generated at {Temporal.Now.instant().toString()}</p>
          <p>
            <a href={h.url("/sources/")}>View sources</a>
          </p>
        </header>
        {Map.groupBy(articles, (x) =>
          x.date.toTemporalInstant().toZonedDateTimeISO("UTC").toPlainDate()
            .toPlainYearMonth().toString()).entries().map((
            [date, articles],
          ) => (
            <section>
              <header>
                <h3>{date}</h3>
              </header>
              {articles.map((article) => (
                <article style={{ margin: "1em 0" }}>
                  <small>
                    <strong>{`[${article.source}]`}</strong>
                  </small>{" "}
                  <a href={article.articleLink.toString()}>{article.title}</a>
                  {" "}
                  <small>
                    <time style={{ "white-space": "nowrap" }}>
                      {article.date.toTemporalInstant().toZonedDateTimeISO(
                        "UTC",
                      ).toPlainDate().toString()}
                    </time>
                  </small>
                </article>
              ))}
            </section>
          )
          ).toArray()}
      </main>
    </>
  );
};
