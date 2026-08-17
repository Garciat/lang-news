export const layout = "layouts/base.tsx";

export const title = "Programming Language News";

export default ({ feeds }: Lume.Data<FeedsData>, h: Lume.Helpers) => {
  const articles = feeds.sources.flatMap((source) => source.result.articles)
    .filter((article) =>
      article.date.toZonedDateTimeISO("UTC").year ==
        Temporal.Now.zonedDateTimeISO("UTC").year
    )
    .toSorted((a, b) => Temporal.Instant.compare(b.date, a.date));

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
        {Map.groupBy(articles, (article) =>
          article.date.toZonedDateTimeISO("UTC").toPlainDate()
            .toPlainYearMonth().toString()).entries().map((
            [yearMonth, articles],
          ) => (
            <section>
              <header>
                <h3>{yearMonth}</h3>
              </header>
              {articles.map((article) => (
                <article style={{ margin: "1em 0" }}>
                  <small>
                    <strong>{`[${article.source}]`}</strong>
                  </small>{" "}
                  <a href={article.link.toString()}>{article.title}</a>{" "}
                  <small>
                    <time style={{ "white-space": "nowrap" }}>
                      {article.date.toZonedDateTimeISO(
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
