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
  // Format: <p><a href="URL">TITLE</a> - <time datetime="YYYY-MM-DD">YYYY-MM-DD</time></p>
  const entryRegex = /<p><a\s+href="([^"]+)">([^<]+)<\/a>\s*-\s*<time\s+datetime="([^"]+)">([^<]+)<\/time><\/p>/gi;
  
  let match;
  while ((match = entryRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    const datetime = match[3];
    
    // Convert URL to full URL if needed
    const fullUrl = url.startsWith('http') ? url : `https://blog.haskell.org${url}`;
    
    articles.push({
      title,
      date: datetime,
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
  // Remove script and style tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  content = content.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "");
  content = content.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "");
  content = content.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "");
  content = content.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");
  
  // Extract the main article content
  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    content = articleMatch[1];
    
    // Remove the title and metadata (first h1 and span)
    content = content.replace(/<h1[^>]*>.*?<\/h1>/i, "");
    content = content.replace(/<span\s+class="s95"[^>]*>.*?<\/span>/i, "");
  } else {
    // Fallback: try to find main content
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      content = mainMatch[1];
    }
  }
  
  // Convert HTML to markdown
  content = content
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<a\s+(?:[^>]*\s+)?href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, "```\n$1\n```\n")
    .replace(/<ul[^>]*>/gi, "")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ol[^>]*>/gi, "")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<video[^>]*>[\s\S]*?<\/video>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/\n\n\n+/g, "\n\n")
    .trim();
  
  // Limit content length to avoid very large files
  if (content.length > 3000) {
    content = content.substring(0, 3000) + "\n\n...\n\n*Content truncated. Please visit the original article for the full post.*";
  }
  
  return content || "Content not available. Please visit the original article for full details.";
}

/**
 * Infer tags from the article title and URL
 */
function inferTags(title: string, url: string): string[] {
  const tags: string[] = [];
  const text = `${title} ${url}`.toLowerCase();
  
  // Common Haskell-related tags
  if (text.includes("ghc") || text.includes("compiler")) tags.push("compiler");
  if (text.includes("release") || text.includes("announce")) tags.push("release");
  if (text.includes("stack")) tags.push("stack");
  if (text.includes("cabal")) tags.push("cabal");
  if (text.includes("hls") || text.includes("language server")) tags.push("tooling");
  if (text.includes("foundation")) tags.push("community");
  if (text.includes("library") || text.includes("package")) tags.push("library");
  if (text.includes("tutorial") || text.includes("guide") || text.includes("how to")) tags.push("tutorial");
  if (text.includes("performance") || text.includes("optimization")) tags.push("performance");
  if (text.includes("security")) tags.push("security");
  if (text.includes("gsoc") || text.includes("google summer")) tags.push("gsoc");
  if (text.includes("working group") || text.includes("committee")) tags.push("governance");
  
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
