import { dirname, join } from "@std/path";
import {
  ARTICLE_CATEGORIES,
  type ArticleCategory,
  type ArticleSourceConfig,
  type NewsArticle,
  type RawFeedEntry,
} from "./types.ts";

const CATEGORY_PATTERNS: Record<ArticleCategory, RegExp[]> = {
  release: [/(\b|v)\d+\.\d+(?:\.\d+)?\b/i, /release|released|stable|beta|alpha|rc/i],
  feature: [/feature|stabiliz|language support|improvement|new in|syntax/i],
  spec: [/spec|pep|rfc|proposal|edition|standard|roadmap/i],
  tooling: [/cargo|pip|build tool|package manager|tooling|compiler/i],
  announcement: [/announc|update|status|blog/i],
};

const VERSION_PATTERN = /\b(?:v)?(\d+\.\d+(?:\.\d+)?(?:-[A-Za-z0-9.]+)?)\b/;
const FRONT_MATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

export const INCLUSION_RULES = [
  "Only ingest posts from official or primary language sources configured in the scraper registry.",
  "Keep release announcements, language feature rollouts, standards or proposal updates, roadmap posts, and other language-level announcements.",
  "Skip tutorials, opinion posts, community roundups, and third-party ecosystem coverage that is not clearly language-level news.",
];

export async function ensureDir(path: string): Promise<void> {
  await Deno.mkdir(path, { recursive: true });
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "lang-news-bot/1.0 (+https://github.com/Garciat/lang-news)",
      accept: "application/atom+xml, application/rss+xml, application/xml, text/xml, text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} for ${url}`);
  }

  return await response.text();
}

export function parseFeed(xml: string): RawFeedEntry[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  if (!doc) {
    throw new Error("Unable to parse source feed XML.");
  }

  const entries = [
    ...Array.from(doc.getElementsByTagName("item")),
    ...Array.from(doc.getElementsByTagName("entry")),
  ];

  return entries
    .map((entry) => {
      const title = firstText(entry, ["title"]);
      const url = readLink(entry);
      const publishedAt = firstText(entry, ["pubDate", "published", "updated"]);
      const updatedAt = firstText(entry, ["updated"]);
      const summaryHtml = firstText(entry, ["description", "summary"]);
      const contentHtml = firstText(entry, ["content:encoded", "content"]);

      if (!title || !url || !publishedAt) {
        return null;
      }

      return {
        title,
        url,
        publishedAt,
        updatedAt: updatedAt || undefined,
        summaryHtml: summaryHtml || undefined,
        contentHtml: contentHtml || undefined,
      } satisfies RawFeedEntry;
    })
    .filter((entry): entry is RawFeedEntry => entry !== null);
}

export function shouldIncludeEntry(config: ArticleSourceConfig, entry: RawFeedEntry): boolean {
  const haystack = `${entry.title}\n${stripHtml(entry.summaryHtml ?? "")}\n${stripHtml(entry.contentHtml ?? "")}`;

  if (config.excludePatterns?.some((pattern) => pattern.test(haystack))) {
    return false;
  }

  return config.includePatterns.some((pattern) => pattern.test(haystack));
}

export async function normalizeEntry(
  config: ArticleSourceConfig,
  entry: RawFeedEntry,
  fetchedAt: string,
): Promise<NewsArticle> {
  const canonicalUrl = normalizeUrl(entry.url);
  const content = htmlToText(entry.contentHtml ?? entry.summaryHtml ?? "");
  const summarySource = htmlToText(entry.summaryHtml ?? entry.contentHtml ?? "");
  const summary = truncate(summarySource || content, 280);
  const category = inferCategory(entry.title, `${summary}\n${content}`);
  const version = detectVersion(entry.title) ?? detectVersion(content);
  const id = `${slugify(config.language)}-${await shortHash(canonicalUrl)}`;
  const date = normalizeDate(entry.publishedAt);
  const url = `/articles/${config.id}/${date.slice(0, 10)}-${id}/`;
  const tags = uniqueValues([
    slugify(config.language),
    category,
    "official",
    ...config.tags,
  ]);
  const contentHash = await shortHash(`${entry.title}\n${summary}\n${content}`);

  return {
    id,
    title: cleanWhitespace(entry.title),
    date,
    language: config.language,
    sourceName: config.sourceName,
    sourceUrl: config.sourceUrl,
    canonicalUrl,
    category,
    version,
    summary,
    content,
    tags,
    fetchedAt,
    updatedAt: fetchedAt,
    sourceUpdatedAt: entry.updatedAt ? normalizeDate(entry.updatedAt) : undefined,
    contentHash,
    url,
    sourceId: config.id,
  };
}

export function uniqueByCanonicalUrl(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Map<string, NewsArticle>();

  for (const article of articles) {
    if (!seen.has(article.canonicalUrl)) {
      seen.set(article.canonicalUrl, article);
    }
  }

  return Array.from(seen.values());
}

export async function writeArticleFile(directory: string, article: NewsArticle): Promise<void> {
  await ensureDir(directory);
  const filePath = join(directory, `${article.date.slice(0, 10)}-${article.id}.md`);
  const existing = await readArticleFile(filePath);
  const updatedAt = existing && existing.contentHash === article.contentHash
    ? existing.updatedAt
    : article.fetchedAt;
  const nextArticle = { ...article, updatedAt };

  await Deno.writeTextFile(filePath, renderArticleMarkdown(nextArticle));
}

export async function loadArticleSummaries(rootDir: string): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];

  try {
    for await (const entry of Deno.readDir(rootDir)) {
      if (!entry.isDirectory) {
        continue;
      }

      const dirPath = join(rootDir, entry.name);
      for await (const nested of Deno.readDir(dirPath)) {
        if (!nested.isFile || !nested.name.endsWith(".md")) {
          continue;
        }

        const article = await readArticleFile(join(dirPath, nested.name));
        if (article) {
          articles.push(article);
        }
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  return articles.sort((a, b) => b.date.localeCompare(a.date));
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await ensureDir(dirname(path));
  await Deno.writeTextFile(path, `${JSON.stringify(data, null, 2)}\n`);
}

export async function clearDir(path: string): Promise<void> {
  await Deno.remove(path, { recursive: true }).catch((error) => {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  });
  await ensureDir(path);
}

export function renderHomePage(articles: NewsArticle[]): string {
  const languages = uniqueValues(articles.map((article) => article.language)).sort();
  const categories = uniqueValues(articles.map((article) => article.category)).sort();
  const articleCards = articles.map(renderArticleCard).join("\n");
  const languageOptions = languages.map((language) => `<option value="${escapeHtml(language)}">${escapeHtml(language)}</option>`).join("");
  const categoryOptions = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(toTitleCase(category))}</option>`).join("");

  return `---
title: Lang News
layout: layout.vto
url: /
---

# Programming language news from official sources

Lang News tracks release announcements, language-level feature rollouts, standards updates, and roadmap posts from the primary sites for each language.

<div class="filters">
  <label>
    Language
    <select id="language-filter">
      <option value="">All languages</option>
      ${languageOptions}
    </select>
  </label>
  <label>
    Category
    <select id="category-filter">
      <option value="">All categories</option>
      ${categoryOptions}
    </select>
  </label>
</div>

<div class="article-feed" id="article-feed">
${articleCards}
</div>

<script>
  const languageFilter = document.getElementById("language-filter");
  const categoryFilter = document.getElementById("category-filter");
  const cards = Array.from(document.querySelectorAll("[data-language][data-category]"));

  function updateFeed() {
    const language = languageFilter.value;
    const category = categoryFilter.value;

    for (const card of cards) {
      const matchesLanguage = !language || card.dataset.language === language;
      const matchesCategory = !category || card.dataset.category === category;
      card.hidden = !(matchesLanguage && matchesCategory);
    }
  }

  languageFilter.addEventListener("change", updateFeed);
  categoryFilter.addEventListener("change", updateFeed);
</script>
`;
}

export function renderLanguagePage(language: string, articles: NewsArticle[]): string {
  const articleCards = articles.map(renderArticleCard).join("\n");

  return `---
title: ${escapeYaml(language)}
layout: layout.vto
url: /languages/${slugify(language)}/
---

# ${language}

Official ${language} language news collected from primary release and announcement channels.

<div class="article-feed">
${articleCards}
</div>
`;
}

function renderArticleCard(article: NewsArticle): string {
  return `<article class="article-card" data-language="${escapeHtml(article.language)}" data-category="${escapeHtml(article.category)}">
  <p class="eyebrow">${escapeHtml(article.language)} · ${escapeHtml(toTitleCase(article.category))} · ${escapeHtml(formatDate(article.date))}</p>
  <h2><a href="${escapeHtml(article.url)}">${escapeHtml(article.title)}</a></h2>
  <p>${escapeHtml(article.summary)}</p>
  <p class="meta">Source: <a href="${escapeHtml(article.canonicalUrl)}">${escapeHtml(article.sourceName)}</a></p>
</article>`;
}

function readLink(entry: Element): string {
  for (const link of Array.from(entry.getElementsByTagName("link"))) {
    const href = link.getAttribute("href");
    const rel = link.getAttribute("rel");

    if (href && (!rel || rel === "alternate")) {
      return href.trim();
    }
  }

  return firstText(entry, ["link"]);
}

function firstText(parent: Element, tagNames: string[]): string {
  for (const tagName of tagNames) {
    const element = parent.getElementsByTagName(tagName)[0];
    const text = element?.textContent?.trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function htmlToText(html: string): string {
  if (!html.trim()) {
    return "";
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = doc?.body?.textContent ?? html;
  return cleanWhitespace(decodeHtml(text));
}

function stripHtml(html: string): string {
  return htmlToText(html);
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/#.*$/, "");
}

function inferCategory(title: string, content: string): ArticleCategory {
  const haystack = `${title}\n${content}`;

  for (const category of ARTICLE_CATEGORIES) {
    if (CATEGORY_PATTERNS[category].some((pattern) => pattern.test(haystack))) {
      return category;
    }
  }

  return "announcement";
}

function detectVersion(text: string): string | undefined {
  return text.match(VERSION_PATTERN)?.[1];
}

function normalizeDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid publication date: ${value}`);
  }

  return date.toISOString();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function cleanWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function shortHash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 12);
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function renderArticleMarkdown(article: NewsArticle): string {
  const body = article.content || article.summary;

  return `---
title: ${escapeYaml(article.title)}
layout: article.vto
url: ${article.url}
articleId: ${article.id}
type: article
date: ${article.date}
language: ${escapeYaml(article.language)}
sourceId: ${article.sourceId}
sourceName: ${escapeYaml(article.sourceName)}
sourceUrl: ${escapeYaml(article.sourceUrl)}
canonicalUrl: ${escapeYaml(article.canonicalUrl)}
category: ${article.category}
version: ${article.version ? escapeYaml(article.version) : ""}
summary: ${escapeYaml(article.summary)}
fetchedAt: ${article.fetchedAt}
updatedAt: ${article.updatedAt}
sourceUpdatedAt: ${article.sourceUpdatedAt ?? ""}
contentHash: ${article.contentHash}
tags:
${article.tags.map((tag) => `  - ${escapeYaml(tag)}`).join("\n")}
---

${body}
`;
}

async function readArticleFile(path: string): Promise<NewsArticle | null> {
  try {
    const file = await Deno.readTextFile(path);
    const match = file.match(FRONT_MATTER_PATTERN);

    if (!match) {
      return null;
    }

    const [, frontMatter, body] = match;
    const record = parseFrontMatter(frontMatter);
    const tags = Array.isArray(record.tags) ? record.tags : [];

    return {
      id: toString(record.articleId),
      title: toString(record.title),
      date: toString(record.date),
      language: toString(record.language),
      sourceName: toString(record.sourceName),
      sourceUrl: toString(record.sourceUrl),
      canonicalUrl: toString(record.canonicalUrl),
      category: toString(record.category) as ArticleCategory,
      version: optionalString(record.version),
      summary: toString(record.summary),
      content: body.trim(),
      tags,
      fetchedAt: toString(record.fetchedAt),
      updatedAt: toString(record.updatedAt),
      sourceUpdatedAt: optionalString(record.sourceUpdatedAt),
      contentHash: toString(record.contentHash),
      url: toString(record.url),
      sourceId: toString(record.sourceId),
    };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }
}

function parseFrontMatter(frontMatter: string): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  let currentKey = "";

  for (const rawLine of frontMatter.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line) {
      continue;
    }

    if (line.startsWith("  - ") && currentKey) {
      const values = Array.isArray(record[currentKey]) ? record[currentKey] as string[] : [];
      values.push(unquote(line.slice(4)));
      record[currentKey] = values;
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    currentKey = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    record[currentKey] = value ? unquote(value) : "";
  }

  return record;
}

function unquote(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }
  return value;
}

function toString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function optionalString(value: string | string[] | undefined): string | undefined {
  const text = toString(value);
  return text || undefined;
}

function escapeYaml(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
