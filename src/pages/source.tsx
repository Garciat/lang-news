import { helpers } from "deno-static/mod.ts";

import { Intern } from "lib/intern.ts";

import { SiteConfig } from "../config.ts";
import { Article, ArticleSource } from "../types.ts";
import { BaseLayout } from "./layouts/base.tsx";

export const layout = "layouts/base.tsx";

type SourcePageProps = {
  source: ArticleSource;
  articles: ReadonlyArray<Article>;
};

export const SourcePage: React.FC<SourcePageProps> = ({ source, articles }) => {
  const year = Temporal.Now.zonedDateTimeISO("UTC").year;

  const articlesByYearMonth = Map.groupBy(
    articles.filter((article) =>
      article.date.toZonedDateTimeISO("UTC").year == year
    )
      .toSorted((a, b) => Temporal.Instant.compare(b.date, a.date)),
    (article) =>
      Intern.PlainYearMonth.from(
        article.date
          .toZonedDateTimeISO("UTC")
          .toPlainDate()
          .toPlainYearMonth(),
      ),
  );

  return (
    <BaseLayout
      title={`${source.name} - ${SiteConfig.title}`}
      url={`/source/${source.name}/`}
    >
      <main>
        <header>
          <h1>{SiteConfig.title}</h1>
          <p>
            Viewing articles for <strong>{source.name}</strong>
          </p>
          <p>
            <a href={helpers.url("/")}>Back to all articles</a>
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
    </BaseLayout>
  );
};
