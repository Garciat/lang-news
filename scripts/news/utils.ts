import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.56/deno-dom-wasm.ts";
import { dirname, join } from "@std/path";
import {
  type ArticleSourceConfig,
  type NewsArticle,
  type RawFeedEntry,
} from "./types.ts";

const VERSION_PATTERN =
  /\b(?:v)?(\d+\.\d+(?:\.\d+)?(?:-[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*)?)\b/;
const FRONT_MATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

export const INCLUSION_RULES = [
  "Only ingest posts from official or primary language sources configured in the scraper registry.",
  "Keep release announcements, language feature rollouts, standards or proposal updates, roadmap posts, and other language-level announcements.",
  "Skip tutorials, opinion posts, community roundups, and third-party ecosystem coverage that is not clearly language-level news.",
];

interface RenderedPage {
  fileName: string;
  content: string;
}

interface HomePageRenderOptions {
  title: string;
  url: string;
  weekArchive?: WeekArchiveEntry[];
}

interface WeeklyArticleGroup {
  weekYear: number;
  weekNumber: number;
  label: string;
  articles: NewsArticle[];
}

interface WeekArchiveEntry {
  label: string;
  url: string;
  isCurrent: boolean;
  languageCounts: WeekLanguageCount[];
}

interface WeekLanguageCount {
  language: string;
  count: number;
}

interface WeeklyPage {
  fileName: string;
  title: string;
  url: string;
  group: WeeklyArticleGroup;
}

interface FeedNode {
  textContent: string | null;
  innerHTML: string;
  tagName: string;
  getAttribute(name: string): string | null;
  querySelectorAll(selector: string): Iterable<unknown>;
}

const WEEK_ARCHIVE_WINDOW = 8;

export async function ensureDir(path: string): Promise<void> {
  await Deno.mkdir(path, { recursive: true });
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "lang-news-bot/1.0 (+https://github.com/Garciat/lang-news)",
      accept:
        "application/atom+xml, application/rss+xml, application/xml, text/xml, text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} for ${url}`);
  }

  return await response.text();
}

export function parseFeed(xml: string): RawFeedEntry[] {
  const doc = new DOMParser().parseFromString(xml, "text/html");
  const entries = doc
    ? toFeedNodes(doc.querySelectorAll("item, entry"))
    : [];

  if (!entries.length) {
    throw new Error("Feed did not contain any item or entry elements.");
  }

  return Array.from(entries, (entry) => {
    const title = readFeedText(entry, ["title"]);
    const url = extractFeedUrl(entry) || readFeedText(entry, ["id", "link"]);
    const publishedAt = readFeedText(entry, ["pubdate", "published", "updated"]);
    const updatedAt = readFeedText(entry, ["updated"]);
    const summaryHtml = readFeedInnerHtml(entry, ["description", "summary"]);
    const contentHtml = readFeedInnerHtml(entry, ["content:encoded", "content"]);

    if (!title || !url || !publishedAt) {
      throw new Error("Feed entry is missing required fields.");
    }

    return {
      title: decodeHtml(title),
      url: decodeHtml(url),
      publishedAt: decodeHtml(publishedAt),
      updatedAt: updatedAt ? decodeHtml(updatedAt) : undefined,
      summaryHtml: summaryHtml ? decodeHtml(summaryHtml) : undefined,
      contentHtml: contentHtml ? decodeHtml(contentHtml) : undefined,
    } satisfies RawFeedEntry;
  });
}

export function shouldIncludeEntry(
  config: ArticleSourceConfig,
  entry: RawFeedEntry,
): boolean {
  const haystack = `${entry.title}\n${
    htmlToSummaryText(entry.summaryHtml ?? entry.contentHtml ?? "")
  }`;

  if (config.excludePatterns?.some((pattern) => pattern.test(haystack))) {
    return false;
  }

  return config.includePatterns.some((pattern) => pattern.test(haystack));
}

export async function normalizeEntry(
  config: ArticleSourceConfig,
  entry: RawFeedEntry,
  collectedAt: string,
): Promise<NewsArticle> {
  const canonicalUrl = normalizeUrl(entry.url);
  const summarySource = htmlToSummaryText(
    entry.summaryHtml ?? entry.contentHtml ?? "",
  );
  const summary = truncate(summarySource || cleanWhitespace(entry.title), 280);
  const version = detectVersion(entry.title) ?? detectVersion(summary);
  const id = `${config.languageSlug}-${await shortHash(canonicalUrl)}`;
  const date = normalizeDate(entry.publishedAt);
  const url = `/articles/${config.id}/${date.slice(0, 10)}-${id}/`;
  const tags = uniqueValues([
    config.languageSlug,
    "official",
    ...config.tags,
  ]);
  const contentHash = await shortHash(`${entry.title}\n${summary}`);

  return {
    id,
    title: cleanWhitespace(entry.title),
    date,
    language: config.language,
    languageSlug: config.languageSlug,
    sourceName: config.sourceName,
    sourceUrl: config.sourceUrl,
    canonicalUrl,
    version,
    summary,
    tags,
    collectedAt,
    updatedAt: collectedAt,
    sourceUpdatedAt: entry.updatedAt
      ? normalizeDate(entry.updatedAt)
      : undefined,
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

export async function writeArticleFile(
  directory: string,
  article: NewsArticle,
): Promise<void> {
  await ensureDir(directory);
  const filePath = join(directory, articleFileName(article));
  const existing = await readArticleFile(filePath);
  const updatedAt = existing && existing.contentHash === article.contentHash
    ? existing.updatedAt
    : article.collectedAt;
  const nextArticle = { ...article, updatedAt };

  await Deno.writeTextFile(filePath, renderArticleMarkdown(nextArticle));
}

export function articleFileName(article: NewsArticle): string {
  return `${article.date.slice(0, 10)}-${article.id}.md`;
}

export async function loadArticleSummaries(
  rootDir: string,
): Promise<NewsArticle[]> {
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

export function renderHomePages(articles: NewsArticle[]): RenderedPage[] {
  const weeklyGroups = groupArticlesByWeek(articles);

  if (!weeklyGroups.length) {
    return [{
      fileName: "index.md",
      content: renderHomePage(articles, {
        title: "Lang News",
        url: "/",
        weekArchive: [],
      }),
    }];
  }

  const weeklyPages: WeeklyPage[] = weeklyGroups.map((group, index) => ({
    fileName: index === 0
      ? "index.md"
      : `week-${group.weekYear}-${group.weekNumber}.md`,
    title: index === 0 ? "Lang News" : group.label,
    url: index === 0 ? "/" : `/weeks/${group.weekYear}/${group.weekNumber}/`,
    group,
  }));

  return weeklyPages.map((page, index) => ({
    fileName: page.fileName,
    content: renderHomePage(page.group.articles, {
      title: page.title,
      url: page.url,
      weekArchive: buildWeekArchive(weeklyPages, index),
    }),
  }));
}

function renderHomePage(
  articles: NewsArticle[],
  options: HomePageRenderOptions,
): string {
  const languages = uniqueValues(articles.map((article) => article.language))
    .sort();
  const articleCards = articles.map(renderArticleCard).join("\n");
  const languageOptions = languages
    .map((language) =>
      `<option value="${escapeHtml(language)}">${escapeHtml(language)}</option>`
    )
    .join("");
  const weekArchive = renderWeekArchive(options.weekArchive ?? []);

return `---
title: ${escapeYaml(options.title)}
layout: layout.vto
url: ${escapeYaml(options.url)}
---

# Programming language news from official sources

Lang News tracks release announcements, language-level feature rollouts, standards updates, and roadmap posts from the primary sites for each language.

${weekArchive}

<div class="filters">
  <label>
    Language
    <select id="language-filter">
      <option value="">All languages</option>
      ${languageOptions}
    </select>
  </label>
</div>

<div class="article-feed" id="article-feed">
${articleCards}
</div>

<script>
  const languageFilter = document.getElementById("language-filter");
  const cards = Array.from(document.querySelectorAll("[data-language]"));

  function updateFeed() {
    const language = languageFilter.value;

    for (const card of cards) {
      const matchesLanguage = !language || card.dataset.language === language;
      card.hidden = !matchesLanguage;
    }
  }

  languageFilter.addEventListener("change", updateFeed);
</script>
`;
}

export function renderLanguagePage(
  language: string,
  languageSlug: string,
  articles: NewsArticle[],
): string {
  const articleCards = articles.map(renderArticleCard).join("\n");

return `---
title: ${escapeYaml(language)}
layout: layout.vto
url: /languages/${languageSlug}/
---

# ${language}

Official ${language} language news collected from primary release and announcement channels.

<div class="article-feed">
${articleCards}
</div>
`;
}

function renderArticleCard(article: NewsArticle): string {
  return `<article class="article-card" data-language="${
    escapeHtml(article.language)
  }">
  <p class="eyebrow">${escapeHtml(article.language)} · ${
    escapeHtml(formatDate(article.date))
  }</p>
  <h2><a href="${escapeHtml(article.url)}">${escapeHtml(article.title)}</a></h2>
  <p>${escapeHtml(article.summary)}</p>
  <p class="meta">Source: <a href="${escapeHtml(article.canonicalUrl)}">${
    escapeHtml(article.sourceName)
  }</a></p>
</article>`;
}

function renderWeekArchive(entries: WeekArchiveEntry[]): string {
  if (!entries.length) {
    return "";
  }

  return `<div class="week-archive">
  <div class="week-archive-list">
${entries.map((entry) => renderWeekArchiveEntry(entry)).join("\n")}
  </div>
</div>`;
}

function renderWeekArchiveEntry(entry: WeekArchiveEntry): string {
  const chips = entry.languageCounts
    .map((count) =>
      `<span class="week-chip">${escapeHtml(count.language)} ${
        escapeHtml(String(count.count))
      }</span>`
    )
    .join("");

  return `    <section class="week-archive-item${
    entry.isCurrent ? " is-current" : ""
  }">
      <h2 class="week-archive-title"><a href="${escapeHtml(entry.url)}"${
    entry.isCurrent ? ' aria-current="page"' : ""
  }>${escapeHtml(entry.label)}</a></h2>
      <div class="week-chip-list">${chips}</div>
    </section>`;
}

function buildWeekArchive(
  weeklyPages: WeeklyPage[],
  currentIndex: number,
): WeekArchiveEntry[] {
  const maxStart = Math.max(0, weeklyPages.length - WEEK_ARCHIVE_WINDOW);
  const start = Math.max(
    0,
    Math.min(currentIndex - Math.floor(WEEK_ARCHIVE_WINDOW / 2), maxStart),
  );

  return weeklyPages.slice(start, start + WEEK_ARCHIVE_WINDOW).map((page, index) => ({
    label: page.group.label,
    url: page.url,
    isCurrent: start + index === currentIndex,
    languageCounts: countArticlesByLanguage(page.group.articles),
  }));
}

function countArticlesByLanguage(articles: NewsArticle[]): WeekLanguageCount[] {
  const counts = new Map<string, number>();

  for (const article of articles) {
    counts.set(article.language, (counts.get(article.language) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));
}

function htmlToText(html: string): string {
  if (!html.trim()) {
    return "";
  }

  const decoded = decodeHtml(html);
  const doc = new DOMParser().parseFromString(decoded, "text/html");

  if (!doc?.body) {
    return normalizeText(decoded.replace(/<[^>]+>/g, " "));
  }

  for (const element of doc.querySelectorAll("script, style")) {
    element.remove();
  }

  for (const breakNode of doc.querySelectorAll("br")) {
    breakNode.replaceWith(doc.createTextNode("\n"));
  }

  for (const item of doc.querySelectorAll("li")) {
    item.prepend(doc.createTextNode("- "));
  }

  for (
    const block of doc.querySelectorAll(
      "p, div, section, article, li, ul, ol, h1, h2, h3, h4, h5, h6, pre, blockquote",
    )
  ) {
    block.append("\n");
  }

  return normalizeText(doc.body.textContent ?? decoded);
}

function htmlToSummaryText(html: string): string {
  return cleanSummaryText(htmlToText(html));
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/#.*$/, "");
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

function cleanSummaryText(text: string): string {
  return cleanWhitespace(text)
    .replace(/\]\]>/g, "")
    .replace(/\s*The post .*? appeared first on .*?\.?$/i, "")
    .replace(/^["'“”‘’]+\s*/, "")
    .replace(/\s*["'“”‘’]+$/, "");
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
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 12);
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function groupArticlesByWeek(articles: NewsArticle[]): WeeklyArticleGroup[] {
  const groups = new Map<string, WeeklyArticleGroup>();

  for (const article of articles) {
    const { weekYear, weekNumber } = getIsoWeekInfo(article.date);
    const key = `${weekYear}-${weekNumber}`;
    const existing = groups.get(key);

    if (existing) {
      existing.articles.push(article);
      continue;
    }

    groups.set(key, {
      weekYear,
      weekNumber,
      label: `${weekYear} Week ${weekNumber}`,
      articles: [article],
    });
  }

  return Array.from(groups.values()).sort((a, b) =>
    b.weekYear - a.weekYear || b.weekNumber - a.weekNumber
  );
}

function getIsoWeekInfo(value: string): {
  weekYear: number;
  weekNumber: number;
} {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid week date: ${value}`);
  }

  const { weekYear, weekNumber } = getIsoWeekParts(date);
  return {
    weekYear,
    weekNumber,
  };
}

function getIsoWeekParts(date: Date): { weekYear: number; weekNumber: number } {
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
  const dayOfWeek = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayOfWeek);

  const weekYear = utcDate.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(weekYear, 0, 1));
  const weekNumber = Math.ceil(
    ((utcDate.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7,
  );

  return { weekYear, weekNumber };
}

function renderArticleMarkdown(article: NewsArticle): string {
  return `---
title: ${escapeYaml(article.title)}
layout: article.vto
url: ${article.url}
articleId: ${article.id}
type: article
date: ${article.date}
language: ${escapeYaml(article.language)}
languageSlug: ${escapeYaml(article.languageSlug)}
sourceId: ${article.sourceId}
sourceName: ${escapeYaml(article.sourceName)}
sourceUrl: ${escapeYaml(article.sourceUrl)}
canonicalUrl: ${escapeYaml(article.canonicalUrl)}
version: ${article.version ? escapeYaml(article.version) : ""}
summary: ${escapeYaml(article.summary)}
collectedAt: ${article.collectedAt}
updatedAt: ${article.updatedAt}
sourceUpdatedAt: ${article.sourceUpdatedAt ?? ""}
contentHash: ${article.contentHash}
tags:
${article.tags.map((tag) => `  - ${escapeYaml(tag)}`).join("\n")}
---
`;
}

async function readArticleFile(path: string): Promise<NewsArticle | null> {
  try {
    const file = await Deno.readTextFile(path);
    const match = file.match(FRONT_MATTER_PATTERN);

    if (!match) {
      return null;
    }

    const [, frontMatter] = match;
    const record = parseFrontMatter(frontMatter);
    const tags = Array.isArray(record.tags) ? record.tags : [];

    const article = {
      id: toString(record.articleId),
      title: toString(record.title),
      date: toString(record.date),
      language: toString(record.language),
      languageSlug: optionalString(record.languageSlug) ?? slugify(toString(record.language)),
      sourceName: toString(record.sourceName),
      sourceUrl: toString(record.sourceUrl),
      canonicalUrl: toString(record.canonicalUrl),
      version: optionalString(record.version),
      summary: toString(record.summary),
      tags,
      collectedAt: toString(record.collectedAt),
      updatedAt: toString(record.updatedAt),
      sourceUpdatedAt: optionalString(record.sourceUpdatedAt),
      contentHash: toString(record.contentHash),
      url: toString(record.url),
      sourceId: toString(record.sourceId),
    };

    return article;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }
}

function parseFrontMatter(
  frontMatter: string,
): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  let currentKey = "";

  for (const rawLine of frontMatter.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line) {
      continue;
    }

    if (line.startsWith("  - ") && currentKey) {
      const values = Array.isArray(record[currentKey])
        ? record[currentKey] as string[]
        : [];
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
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return value;
}

function toString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function optionalString(
  value: string | string[] | undefined,
): string | undefined {
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
    .replace(/&(amp|lt|gt|quot|apos);/g, (fullMatch, entity) => {
      switch (entity) {
        case "amp":
          return "&";
        case "lt":
          return "<";
        case "gt":
          return ">";
        case "quot":
          return '"';
        case "apos":
          return "'";
        default:
          return fullMatch;
      }
    })
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, code) => String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function readFeedText(element: FeedNode, tagNames: string[]): string {
  for (const tagName of tagNames) {
    const node = findFeedNode(element, tagName);
    const text = node?.textContent?.trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function readFeedInnerHtml(element: FeedNode, tagNames: string[]): string {
  for (const tagName of tagNames) {
    const node = findFeedNode(element, tagName);
    const html = node?.innerHTML?.trim();
    if (html) {
      return html;
    }
  }

  return "";
}

function extractFeedUrl(element: FeedNode): string {
  const links = findFeedNodes(element, "link");
  let fallbackUrl = "";

  for (const link of links) {
    const href = link.getAttribute("href")?.trim();
    if (!href) {
      const text = link.textContent?.trim();
      if (text) {
        fallbackUrl = fallbackUrl || text;
      }
      continue;
    }

    const rel = (link.getAttribute("rel") ?? "").toLowerCase();
    if (rel.includes("alternate")) {
      return href;
    }

    if (!rel || (!rel.includes("self") && !rel.includes("enclosure"))) {
      fallbackUrl = fallbackUrl || href;
    }
  }

  return fallbackUrl;
}

function findFeedNode(element: FeedNode, tagName: string): FeedNode | null {
  return findFeedNodes(element, tagName)[0] ?? null;
}

function findFeedNodes(element: FeedNode, tagName: string): FeedNode[] {
  const normalizedName = tagName.toLowerCase();
  return toFeedNodes(element.querySelectorAll("*")).filter((node) =>
    node.tagName.toLowerCase() === normalizedName
  );
}

function toFeedNodes(nodes: Iterable<unknown>): FeedNode[] {
  return Array.from(nodes).filter(isFeedNode);
}

function isFeedNode(value: unknown): value is FeedNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "textContent" in value && "innerHTML" in value && "tagName" in value &&
    "getAttribute" in value && "querySelectorAll" in value;
}

function normalizeText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}
