import { helpers } from "deno-static/mod.ts";

import { Intern } from "lib/intern.ts";

import { SiteConfig } from "../config.ts";
import { paths } from "../paths.ts";
import { ArticlesFetchResult } from "../types.ts";

import { BaseLayout } from "./layouts/base.tsx";

type HomePageProps = {
  feeds: ArticlesFetchResult;
};

export const HomePage: React.FC<HomePageProps> = ({ feeds }) => {
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
    <BaseLayout title={SiteConfig.title} url={paths.index()}>
      <main>
        <header>
          <h1>{SiteConfig.title}</h1>
          <p>
            Aggregated news from several official programming language/platform
            {" "}
            <a href={helpers.url(paths.sources())}>sources</a>.
          </p>
          <p>
            <small style={{ opacity: "0.5" }}>
              This feed is updated{" "}
              <abbr title="best-effort by free GitHub Actions">~hourly</abbr>.
              Last update:{" "}
              <relative-time datetime={feeds.fetchedAt.toString()}>
                {new Date(feeds.fetchedAt.epochMilliseconds).toUTCString()}
              </relative-time>
            </small>
          </p>
        </header>
        {articlesByYearMonth.entries().toArray().map((
          [yearMonth, articles],
        ) => (
          <section key={yearMonth.toString()}>
            <header>
              <h3>
                {yearMonth.toPlainDate({ day: 1 })
                  .withCalendar("gregory")
                  .toPlainYearMonth()
                  .toLocaleString("en-US", { dateStyle: "full" })}
              </h3>
            </header>
            {articles.map((article) => (
              <article key={article.guid} style={{ margin: "1.5em 0" }}>
                <header>
                  <small>
                    <strong>
                      <a href={helpers.url(paths.source(article.source))}>
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
                  <a href={article.link.toString()} rel="nofollow">
                    {article.title}
                  </a>
                </div>
              </article>
            ))}
          </section>
        ))}
      </main>
    </BaseLayout>
  );
};
