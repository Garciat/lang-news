import { csharpAdapter } from "./adapters/csharp.ts";
import { dAdapter } from "./adapters/d.ts";
import { elixirAdapter } from "./adapters/elixir.ts";
import { erlangAdapter } from "./adapters/erlang.ts";
import { goAdapter } from "./adapters/go.ts";
import { haskellAdapter } from "./adapters/haskell.ts";
import { javaAdapter } from "./adapters/java.ts";
import { join } from "@std/path";
import { kotlinAdapter } from "./adapters/kotlin.ts";
import { phpAdapter } from "./adapters/php.ts";
import { pythonAdapter } from "./adapters/python.ts";
import { rustAdapter } from "./adapters/rust.ts";
import { rubyAdapter } from "./adapters/ruby.ts";
import { scalaAdapter } from "./adapters/scala.ts";
import { swiftAdapter } from "./adapters/swift.ts";
import { typescriptAdapter } from "./adapters/typescript.ts";
import {
  NEWS_ARTICLES_DIR,
  NEWS_DATA_PATH,
  NEWS_META_PATH,
  NEWS_SITE_DIR,
  type NewsMeta,
  type NewsArticle,
  type SourceAdapter,
  type SourceRunResult,
} from "./types.ts";
import {
  clearDir,
  ensureDir,
  INCLUSION_RULES,
  loadArticleSummaries,
  renderHomePages,
  renderLanguagePage,
  writeJson,
} from "./utils.ts";

const adapters: SourceAdapter[] = [
  rustAdapter,
  pythonAdapter,
  javaAdapter,
  dAdapter,
  scalaAdapter,
  goAdapter,
  haskellAdapter,
  kotlinAdapter,
  elixirAdapter,
  erlangAdapter,
  phpAdapter,
  rubyAdapter,
  swiftAdapter,
  typescriptAdapter,
  csharpAdapter,
];
const repoRoot = Deno.cwd();
const articlesRoot = join(repoRoot, NEWS_ARTICLES_DIR);
const siteRoot = join(repoRoot, NEWS_SITE_DIR);
const newsDataPath = join(repoRoot, NEWS_DATA_PATH);
const newsMetaPath = join(repoRoot, NEWS_META_PATH);

const collectedAt = new Date().toISOString();
const sourceResults: SourceRunResult[] = [];

await ensureDir(articlesRoot);

for (const adapter of adapters) {
  try {
    const articles = await adapter.scrape({
      outputDir: articlesRoot,
      collectedAt,
    });
    sourceResults.push({
      sourceId: adapter.config.id,
      language: adapter.config.language,
      articleCount: articles.length,
      status: "success",
    });
    console.log(
      `Fetched ${articles.length} articles from ${adapter.config.sourceName}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sourceResults.push({
      sourceId: adapter.config.id,
      language: adapter.config.language,
      articleCount: 0,
      status: "error",
      error: message,
    });
    console.error(`Failed to ingest ${adapter.config.sourceName}: ${message}`);
  }
}

const articles = await loadArticleSummaries(articlesRoot);
const articlesByLanguage = groupArticlesByLanguage(articles);
const languages = Array.from(articlesByLanguage.keys()).sort();

await clearDir(siteRoot);
for (const page of renderHomePages(articles)) {
  await Deno.writeTextFile(join(siteRoot, page.fileName), page.content);
}

const languagesDir = join(siteRoot, "languages");
await ensureDir(languagesDir);
for (const language of languages) {
  const languageArticles = articlesByLanguage.get(language) ?? [];
  await Deno.writeTextFile(
    join(
      languagesDir,
      `${languageArticles[0].languageSlug}.md`,
    ),
    renderLanguagePage(language, languageArticles[0].languageSlug, languageArticles),
  );
}

await writeJson(newsDataPath, articles);

const meta: NewsMeta = {
  generatedAt: collectedAt,
  articleCount: articles.length,
  languages,
  sources: sourceResults,
  inclusionRules: INCLUSION_RULES,
};

await writeJson(newsMetaPath, meta);

function groupArticlesByLanguage(
  articles: NewsArticle[],
): Map<string, NewsArticle[]> {
  const grouped = new Map<string, NewsArticle[]>();

  for (const article of articles) {
    const languageArticles = grouped.get(article.language) ?? [];
    languageArticles.push(article);
    grouped.set(article.language, languageArticles);
  }

  return grouped;
}
