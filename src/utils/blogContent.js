import { marked } from "marked";
import TurndownService from "turndown";

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const MARKDOWN_FORMATTING_PATTERN =
  /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```)|\[[^\]]+\]\([^)]+\)|!\[[^\]]*\]\([^)]+\)|(\*\*|__|~~|`)/;

const turndownService = new TurndownService({
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  headingStyle: "atx",
  strongDelimiter: "**",
});

turndownService.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

marked.setOptions({
  breaks: true,
  gfm: true,
});

const collapseWhitespace = (value = "") =>
  String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const stripMarkdown = (content = "") =>
  String(content || "")
    .replace(/```([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, " ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getTextFromHtml = (content = "") => {
  const rawContent = String(content || "");

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const parsed = new DOMParser().parseFromString(rawContent, "text/html");
    const text = parsed.body?.textContent || parsed.documentElement?.textContent || "";
    return collapseWhitespace(text);
  }

  return collapseWhitespace(
    rawContent
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
};

export const isHtmlBlogContent = (content = "") =>
  HTML_TAG_PATTERN.test(String(content || "").trim());

export const isMarkdownBlogContent = (content = "") =>
  MARKDOWN_FORMATTING_PATTERN.test(String(content || "").trim());

export const getBlogEditingSource = (content = "") => {
  const rawContent = String(content || "");

  if (!rawContent.trim()) {
    return "";
  }

  if (!isHtmlBlogContent(rawContent)) {
    return rawContent;
  }

  return collapseWhitespace(turndownService.turndown(rawContent));
};

export const getPlainTextFromBlogContent = (content = "") => {
  const rawContent = String(content || "");

  if (!rawContent.trim()) {
    return "";
  }

  if (isHtmlBlogContent(rawContent)) {
    return getTextFromHtml(rawContent);
  }

  return stripMarkdown(rawContent);
};

export const getBlogContentHtml = (content = "") => {
  const rawContent = String(content || "");

  if (!rawContent.trim()) {
    return "";
  }

  if (isHtmlBlogContent(rawContent)) {
    return rawContent;
  }

  return String(marked.parse(rawContent));
};

export const getBlogWordCount = (content = "") => {
  const plainText = getPlainTextFromBlogContent(content);

  if (!plainText) {
    return 0;
  }

  return plainText.split(/\s+/).filter(Boolean).length;
};

export const getBlogExcerpt = (content = "", maxLength = 150) => {
  const plainText = getPlainTextFromBlogContent(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trimEnd()}...`;
};
