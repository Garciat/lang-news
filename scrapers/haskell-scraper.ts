#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read
/**
 * Haskell News Scraper
 *
 * Fetches recent news from the Haskell blog and generates article files
 * in the lang-news format.
 *
 * Usage: ./haskell-scraper.ts [OUTPUT_DIR]
 *
 * OUTPUT_DIR: Directory where article files will be created (default: src/articles)
 */

const OUTPUT_DIR = Deno.args[0] || "src/articles";
const LANGUAGE = "haskell";
const BLOG_ARCHIVE_URL = "https://blog.haskell.org/archive/";

interface Article {
  title: string;
  date: string;
  url: string;
  content: string;
  tags: string[];
}

/**
 * Ensure the output directory exists
 */
async function ensureOutputDir(): Promise<void> {
  try {
    await Deno.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

/**
 * Fetch and parse the Haskell blog archive page
 */
async function fetchBlogArchive(): Promise<Article[]> {
  console.log(`Fetching from ${BLOG_ARCHIVE_URL}...`);
  
  try {
    const response = await fetch(BLOG_ARCHIVE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch blog archive: ${response.statusText}`);
    }
    
    const html = await response.text();
    return parseArchivePage(html);
  } catch (error) {
    console.error(`Error fetching blog archive: ${error.message}`);
    throw error;
  }
}

/**
 * Parse the archive HTML to extract article information
 */
function parseArchivePage(html: string): Article[] {
  const articles: Article[] = [];
  
  // Match article entries in the archive
  // The Haskell blog uses a simple format with links to posts
  const linkRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  const dateRegex = /(\d{4})-(\d{2})-(\d{2})/;
  
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    
    // Skip non-article links (navigation, etc.)
    if (!url.startsWith('/') && !url.startsWith('http')) continue;
    if (url.includes('archive') || url.includes('feed')) continue;
    
    // Extract date from URL or content
    const dateMatch = url.match(dateRegex);
    if (!dateMatch) continue;
    
    const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    const fullUrl = url.startsWith('http') ? url : `https://blog.haskell.org${url}`;
    
    articles.push({
      title,
      date,
      url: fullUrl,
      content: "", // Will be filled when fetching individual articles
      tags: inferTags(title, url),
    });
  }
  
  // Sort by date (newest first) and take recent ones
  return articles
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10); // Get the 10 most recent articles
}

/**
 * Fetch the full content of an article
 */
async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch article content from ${url}: ${response.statusText}`);
      return "";
    }
    
    const html = await response.text();
    return extractArticleContent(html);
  } catch (error) {
    console.warn(`Error fetching article content from ${url}: ${error.message}`);
    return "";
  }
}

/**
 * Extract article content from HTML
 */
function extractArticleContent(html: string): string {
  // Remove HTML tags and extract main content
  // This is a simple extraction - you may need to adjust based on the actual HTML structure
  
  // Remove script and style tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  
  // Try to extract the main article content
  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    content = articleMatch[1];
  } else {
    // Fallback: try to find content div
    const contentMatch = content.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (contentMatch) {
      content = contentMatch[1];
    }
  }
  
  // Convert HTML to basic markdown
  content = content
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<ul[^>]*>(.*?)<\/ul>/gi, "$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\n\n\n+/g, "\n\n")
    .trim();
  
  return content || "Content not available. Please visit the original article for full details.";
}

/**
 * Infer tags from the article title and URL
 */
function inferTags(title: string, url: string): string[] {
  const tags: string[] = [];
  const text = `${title} ${url}`.toLowerCase();
  
  // Common Haskell-related tags
  if (text.includes("ghc") || text.includes("compiler")) tags.push("ghc");
  if (text.includes("release") || text.includes("announce")) tags.push("release");
  if (text.includes("stack")) tags.push("stack");
  if (text.includes("cabal")) tags.push("cabal");
  if (text.includes("foundation")) tags.push("foundation");
  if (text.includes("community")) tags.push("community");
  if (text.includes("library") || text.includes("package")) tags.push("library");
  if (text.includes("tutorial") || text.includes("guide")) tags.push("tutorial");
  if (text.includes("performance")) tags.push("performance");
  if (text.includes("security")) tags.push("security");
  
  // If no tags were inferred, add a general tag
  if (tags.length === 0) {
    tags.push("news");
  }
  
  return tags;
}

/**
 * Generate the article file
 */
async function generateArticleFile(article: Article): Promise<void> {
  const filename = `${OUTPUT_DIR}/${article.date}-${LANGUAGE}.md`;
  
  // Check if file already exists
  try {
    await Deno.stat(filename);
    console.log(`- Skipped (exists): ${filename}`);
    return;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  
  // Fetch full article content
  console.log(`Fetching content for: ${article.title}`);
  const content = await fetchArticleContent(article.url);
  
  // Generate front matter
  const frontMatter = `---
title: "${article.title.replace(/"/g, '\\"')}"
date: ${article.date}
language: ${LANGUAGE}
source: "${article.url}"
tags: [${article.tags.join(", ")}]
---

`;
  
  const fullContent = frontMatter + content;
  
  try {
    await Deno.writeTextFile(filename, fullContent);
    console.log(`✓ Created: ${filename}`);
  } catch (error) {
    console.error(`Error writing file ${filename}: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("Haskell News Scraper");
  console.log("====================");
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log("");
  
  try {
    // Ensure output directory exists
    await ensureOutputDir();
    
    // Fetch and parse blog archive
    const articles = await fetchBlogArchive();
    
    if (articles.length === 0) {
      console.log("No articles found.");
      return;
    }
    
    console.log(`Found ${articles.length} articles`);
    console.log("");
    
    // Generate article files
    for (const article of articles) {
      await generateArticleFile(article);
    }
    
    console.log("");
    console.log(`Done! Generated articles in ${OUTPUT_DIR}`);
    console.log("");
    console.log("To view the articles, build the site with:");
    console.log("  deno task build");
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }
}

// Run the scraper
if (import.meta.main) {
  main();
}
