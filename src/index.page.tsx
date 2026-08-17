import { Intern } from "lib/intern.ts";

export const layout = "layouts/base.tsx";

export const title = "Programming Language News";

export default ({ feeds }: Lume.Data<FeedsData>, h: Lume.Helpers) => {
  const articles = feeds.sources.flatMap((source) => source.result.articles)
    .filter((article) =>
      article.date.toZonedDateTimeISO("UTC").year ==
        Temporal.Now.zonedDateTimeISO("UTC").year
    )
    .toSorted((a, b) => Temporal.Instant.compare(b.date, a.date));

  const articlesByYearMonth = Map.groupBy(
    articles,
    (article) =>
      Intern.PlainYearMonth.from(
        article.date
          .toZonedDateTimeISO("UTC")
          .toPlainDate()
          .toPlainYearMonth(),
      ),
  );

  return (
    <>
      <main>
        <header>
          <h1>Programming Language News</h1>
          <p>
            <a href={h.url("/sources/")}>View sources</a>
          </p>
        </header>
        {articlesByYearMonth.entries().toArray().map((
          [yearMonth, articles],
        ) => (
          <section>
            <header>
              <h3>
                {yearMonth.toPlainDate({ day: 1 })
                  .withCalendar("gregory")
                  .toPlainYearMonth()
                  .toLocaleString("en-US", { dateStyle: "full" })}
              </h3>
            </header>
            {articles.map((article) => (
              <article style={{ margin: "1.5em 0" }}>
                <header>
                  <small>
                    <strong>{article.source}</strong>
                  </small>
                  {" • "}
                  <small>
                    <time>
                      {article.date.toZonedDateTimeISO(
                        "UTC",
                      ).toPlainDate().toString()}
                    </time>
                  </small>
                </header>
                <div>
                  <a href={article.link.toString()}>{article.title}</a>
                </div>
              </article>
            ))}
          </section>
        ))}
      </main>
    </>
  );
};
