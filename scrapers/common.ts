/**
 * Common scraper utilities
 * 
 * Shared types and functions for all language scrapers.
 */

import { Element } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

/**
 * Article interface - common structure for all scraped articles
 */
export interface Article {
  title: string;
  date: string;
  url: string;
  content: string;
  tags: string[];
}

/**
 * Convert HTML element to markdown
 * 
 * Recursively traverses DOM nodes and converts them to markdown format.
 * 
 * @param element - The HTML element to convert
 * @returns Markdown string representation
 */
export function htmlToMarkdown(element: Element): string {
  let markdown = "";
  
  for (const node of element.childNodes) {
    if (node.nodeType === 3) { // Text node
      const text = node.textContent || "";
      if (text.trim()) {
        // Preserve single spaces but normalize multiple spaces
        markdown += text.replace(/\s+/g, " ");
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
