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

import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

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
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  if (!doc) {
    console.error("Failed to parse HTML");
    return articles;
  }
  
  // Find all paragraph elements containing article links
  const paragraphs = doc.querySelectorAll("main p");
  
  for (const p of paragraphs) {
    const link = p.querySelector("a");
    const time = p.querySelector("time");
    
    if (link && time) {
      const url = link.getAttribute("href") || "";
      const title = link.textContent?.trim() || "";
      const datetime = time.getAttribute("datetime") || "";
      
      if (url && title && datetime) {
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
    }
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
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  if (!doc) {
    return "Content not available. Please visit the original article for full details.";
  }
  
  // Find the article element
  const article = doc.querySelector("article");
  if (!article) {
    return "Content not available. Please visit the original article for full details.";
  }
  
  // Remove the title (h1) and metadata (span with class s95)
  const h1 = article.querySelector("h1");
  if (h1) h1.remove();
  
  const metaSpan = article.querySelector("span.s95");
  if (metaSpan) metaSpan.remove();
  
  // Convert the article to markdown
  const markdown = htmlToMarkdown(article);
  
  // Clean up the markdown
  let cleaned = markdown
    .replace(/\n\n\n+/g, "\n\n")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
  
  // Limit content length to avoid very large files
  if (cleaned.length > 3000) {
    cleaned = cleaned.substring(0, 3000) + "\n\n...\n\n*Content truncated. Please visit the original article for the full post.*";
  }
  
  return cleaned || "Content not available. Please visit the original article for full details.";
}

/**
 * Convert HTML element to markdown
 */
function htmlToMarkdown(element: Element): string {
  let markdown = "";
  
  for (const node of element.childNodes) {
    if (node.nodeType === 3) { // Text node
      const text = node.textContent?.trim();
      if (text) {
        markdown += text + " ";
      }
    } else if (node.nodeType === 1) { // Element node
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();
      
      switch (tagName) {
        case "h1":
          markdown += `\n# ${el.textContent?.trim()}\n\n`;
          break;
        case "h2":
          markdown += `\n## ${el.textContent?.trim()}\n\n`;
          break;
        case "h3":
          markdown += `\n### ${el.textContent?.trim()}\n\n`;
          break;
        case "h4":
          markdown += `\n#### ${el.textContent?.trim()}\n\n`;
          break;
        case "p":
          const pContent = htmlToMarkdown(el).trim();
          if (pContent) {
            markdown += `${pContent}\n\n`;
          }
          break;
        case "a":
          const href = el.getAttribute("href") || "";
          const text = el.textContent?.trim() || "";
          markdown += `[${text}](${href})`;
          break;
        case "strong":
        case "b":
          markdown += `**${el.textContent?.trim()}**`;
          break;
        case "em":
        case "i":
          markdown += `*${el.textContent?.trim()}*`;
          break;
        case "code":
          markdown += `\`${el.textContent?.trim()}\``;
          break;
        case "pre":
          markdown += `\n\`\`\`\n${el.textContent?.trim()}\n\`\`\`\n\n`;
          break;
        case "ul":
        case "ol":
          markdown += "\n" + htmlToMarkdown(el);
          break;
        case "li":
          markdown += `- ${htmlToMarkdown(el).trim()}\n`;
          break;
        case "br":
          markdown += "\n";
          break;
        case "img":
        case "video":
        case "script":
        case "style":
        case "span":
          // Skip these elements but process their children for span
          if (tagName === "span") {
            markdown += htmlToMarkdown(el);
          }
          break;
        default:
          // For other elements, recursively process their children
          markdown += htmlToMarkdown(el);
          break;
      }
    }
  }
  
  return markdown;
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
layout: article.vto
title: "${article.title.replace(/"/g, '\\"')}"
date: ${article.date}
language: ${LANGUAGE}
source: "${article.url}"
tags: [${article.tags.join(", ")}]
version: ""
url: /articles/${article.date}-${LANGUAGE}/
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
