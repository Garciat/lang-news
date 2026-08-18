import { Article, ArticleSource } from "./_includes/types.ts";

declare global {
  interface SourcePageData {
    source: ArticleSource;
    articles: ReadonlyArray<Article>;
  }
}

export const layout = "layouts/source.tsx";

export default async function* (
  { feeds }: Lume.Data<FeedsData>,
): AsyncGenerator<SourcePageData & Partial<Lume.Data>> {
  for (const source of feeds.sources) {
    yield {
      basename: source.source.name,
      source: source.source,
      articles: source.result.articles,
    };
  }
}
