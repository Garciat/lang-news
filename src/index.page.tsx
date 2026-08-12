import { ArticlePageData } from "./_includes/types.ts";

export const layout = "layouts/base.tsx";

export const title = "Programming Language News";

export default (data: Lume.Data, h: Lume.Helpers) => {
  const { search, config, page } = data;

  const articles = search.pages<Lume.Data<ArticlePageData>>(
    "type=article",
    "date=desc",
  );

  return (
    <>
      <main>
        <header>
          <h1>Programming Language News</h1>
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
              <ul>
                {articles.map((article) => (
                  <li>
                    {`[${article.source}]`}{" "}
                    <a href={article.articleLink.toString()}>{article.title}</a>
                    {" "}
                    <small>
                      {article.date.toTemporalInstant().toZonedDateTimeISO(
                        "UTC",
                      )
                        .toPlainDate().toString()}
                    </small>
                  </li>
                ))}
              </ul>
            </section>
          )
          ).toArray()}
      </main>
    </>
  );
};
