import { ArticleStorageCodec } from "./_includes/types.ts";

export default async function* (
  { feeds }: Lume.Data<FeedsData>,
): AsyncGenerator<Partial<Lume.Data>> {
  yield {
    url: "/data.json",
    content: ArticleStorageCodec.encode({
      version: 2,
      result: feeds,
    }),
  };
}
