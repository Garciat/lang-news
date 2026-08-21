import { Intern } from "lib/intern.ts";

import { SiteConfig } from "./_includes/config.ts";

export const layout = "layouts/base.tsx";

export default ({ feeds }: Lume.Data<FeedsData>, h: Lume.Helpers) => {
  const year = Temporal.Now.zonedDateTimeISO("UTC").year;

  const articles = feeds.sources.flatMap((source) => source.result.articles)
    .filter((article) => article.date.toZonedDateTimeISO("UTC").year == year)
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
          <h1>{SiteConfig.title}</h1>
          <p>
            Aggregated news from several official programming language/platform
            {" "}
            <a href={h.url("/sources/")}>sources</a> that interest{" "}
            <a href="https://garciat.com/">me</a>.
          </p>
          <p>
            <small style={{ opacity: "0.5" }}>
              This feed is updated hourly. Last update:{" "}
              <relative-time datetime={feeds.fetchedAt.toString()}>
                {new Date(feeds.fetchedAt.epochMilliseconds).toUTCString()}
              </relative-time>
            </small>
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
                    <strong>
                      <a href={h.url(`/source/${article.source}/`)}>
                        {article.source}
                        {" ↗"}
                      </a>
                    </strong>
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
