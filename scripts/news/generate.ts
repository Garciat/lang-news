import { csharpAdapter } from "./adapters/csharp.ts";
import { dAdapter } from "./adapters/d.ts";
import { haskellAdapter } from "./adapters/haskell.ts";
import { javaAdapter } from "./adapters/java.ts";
import { join } from "@std/path";
import { kotlinAdapter } from "./adapters/kotlin.ts";
import { pythonAdapter } from "./adapters/python.ts";
import { rustAdapter } from "./adapters/rust.ts";
import { typescriptAdapter } from "./adapters/typescript.ts";
import {
  NEWS_ARTICLES_DIR,
  NEWS_DATA_PATH,
  NEWS_META_PATH,
  NEWS_SITE_DIR,
  type NewsMeta,
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
  haskellAdapter,
  kotlinAdapter,
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
await pruneInactiveSourceDirectories(articlesRoot, adapters);

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
const languages = Array.from(
  new Set(articles.map((article) => article.language)),
).sort();

await clearDir(siteRoot);
for (const page of renderHomePages(articles)) {
  await Deno.writeTextFile(join(siteRoot, page.fileName), page.content);
}

const languagesDir = join(siteRoot, "languages");
await ensureDir(languagesDir);
for (const language of languages) {
  const languageArticles = articles.filter((article) =>
    article.language === language
  );
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

async function pruneInactiveSourceDirectories(
  rootDir: string,
  activeAdapters: SourceAdapter[],
): Promise<void> {
  const activeSourceIds = new Set(activeAdapters.map((adapter) => adapter.config.id));

  for await (const entry of Deno.readDir(rootDir)) {
    if (!entry.isDirectory || activeSourceIds.has(entry.name)) {
      continue;
    }

    await Deno.remove(join(rootDir, entry.name), { recursive: true });
  }
}
