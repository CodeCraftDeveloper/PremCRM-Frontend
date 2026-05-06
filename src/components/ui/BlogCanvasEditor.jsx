import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Rows3,
  Sparkles,
} from "lucide-react";
import {
  getBlogContentHtml,
  getBlogEditingSource,
  getBlogWordCount,
  getPlainTextFromBlogContent,
} from "../../utils/blogContent";
import "./BlogCanvasEditor.css";

const TEMPLATE_SNIPPETS = [
  {
    id: "hero-intro",
    title: "Hero Intro",
    description: "Start with a strong opening and reader context.",
    icon: Sparkles,
    markdown:
      "## Why this matters\n\nStart with a clear hook, name the problem, and tell the reader what they will learn.\n",
  },
  {
    id: "key-takeaways",
    title: "Key Takeaways",
    description: "Insert a fast-scanning summary list.",
    icon: Rows3,
    markdown:
      "## Key takeaways\n\n- Lead with the most important insight\n- Keep each point short and practical\n- End with the next action for the reader\n",
  },
  {
    id: "quote-callout",
    title: "Quote Callout",
    description: "Add a highlighted quote block.",
    icon: Quote,
    markdown:
      "> A strong quote or sharp idea gives the article a memorable pause.\n",
  },
  {
    id: "checklist",
    title: "Checklist",
    description: "Create a quick implementation checklist.",
    icon: List,
    markdown:
      "## Checklist\n\n- [ ] Define the goal\n- [ ] Prepare the inputs\n- [ ] Execute the steps\n- [ ] Review the outcome\n",
  },
  {
    id: "code-example",
    title: "Code Example",
    description: "Drop in a fenced code block.",
    icon: Code2,
    markdown: "```js\nconst example = true;\n```\n",
  },
  {
    id: "image-section",
    title: "Image Section",
    description: "Insert an image placeholder.",
    icon: ImageIcon,
    markdown: "![Featured image](https://placehold.co/1200x630?text=Image)\n",
  },
];

const SHORTCUT_GROUPS = [
  "Ctrl/Cmd+B bold",
  "Ctrl/Cmd+I italic",
  "Ctrl/Cmd+K link",
  "Ctrl/Cmd+Shift+8 bullets",
  "Ctrl/Cmd+Shift+7 numbering",
];

const BlogCanvasEditor = ({
  value,
  onChange,
  previewTitle,
  previewDescription,
  previewImage,
  previewImageAlt,
}) => {
  const textareaRef = useRef(null);
  const [markdown, setMarkdown] = useState(() => getBlogEditingSource(value));

  useEffect(() => {
    const nextSource = getBlogEditingSource(value);
    // Functional-update bail-out prevents cascading renders; this pattern is safe here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMarkdown((currentValue) =>
      currentValue === nextSource ? currentValue : nextSource,
    );
  }, [value]);

  const updateMarkdown = (nextValue, selection) => {
    setMarkdown(nextValue);
    onChange(nextValue);

    if (!selection || !textareaRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      if (!textareaRef.current) {
        return;
      }

      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        selection.selectionStart,
        selection.selectionEnd,
      );
    });
  };

  const withSelection = (transform) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = markdown.slice(selectionStart, selectionEnd);
    const result = transform({
      selectionEnd,
      selectionStart,
      selectedText,
      value: markdown,
    });

    if (!result) {
      return;
    }

    updateMarkdown(result.value, {
      selectionEnd: result.selectionEnd,
      selectionStart: result.selectionStart,
    });
  };

  const wrapSelection = (before, after = before, placeholder = "text") => {
    withSelection(({ selectionEnd, selectionStart, selectedText, value }) => {
      const content = selectedText || placeholder;
      const nextValue =
        value.slice(0, selectionStart) +
        before +
        content +
        after +
        value.slice(selectionEnd);
      const nextStart = selectionStart + before.length;
      const nextEnd = nextStart + content.length;

      return {
        selectionEnd: nextEnd,
        selectionStart: nextStart,
        value: nextValue,
      };
    });
  };

  const prefixLines = (formatter) => {
    withSelection(({ selectionEnd, selectionStart, value }) => {
      const blockStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
      const rawBlockEnd = value.indexOf("\n", selectionEnd);
      const blockEnd = rawBlockEnd === -1 ? value.length : rawBlockEnd;
      const blockText = value.slice(blockStart, blockEnd);
      const lines = blockText.split("\n");
      const nextBlock = lines.map((line, index) => formatter(line, index)).join("\n");
      const nextValue =
        value.slice(0, blockStart) + nextBlock + value.slice(blockEnd);

      return {
        selectionEnd: blockStart + nextBlock.length,
        selectionStart: blockStart,
        value: nextValue,
      };
    });
  };

  const insertText = (text) => {
    withSelection(({ selectionEnd, selectionStart, value }) => {
      const nextValue =
        value.slice(0, selectionStart) + text + value.slice(selectionEnd);
      const cursor = selectionStart + text.length;

      return {
        selectionEnd: cursor,
        selectionStart: cursor,
        value: nextValue,
      };
    });
  };

  const insertSnippet = (snippet) => {
    const needsLeadingBreak =
      markdown &&
      !markdown.endsWith("\n") &&
      !snippet.startsWith("\n") &&
      snippet !== "  ";

    insertText(`${needsLeadingBreak ? "\n" : ""}${snippet}`);
  };

  const applyHeading = (level) => {
    const prefix = `${"#".repeat(level)} `;
    prefixLines((line) => `${prefix}${line.replace(/^#{1,6}\s+/, "")}`.trimEnd());
  };

  const applyBulletList = () => {
    prefixLines((line) => `- ${line.replace(/^\s*[-*+]\s+/, "")}`.trimEnd());
  };

  const applyOrderedList = () => {
    prefixLines((line, index) => `${index + 1}. ${line.replace(/^\s*\d+\.\s+/, "")}`.trimEnd());
  };

  const applyQuote = () => {
    prefixLines((line) => `> ${line.replace(/^>\s+/, "")}`.trimEnd());
  };

  const applyCodeBlock = () => {
    withSelection(({ selectionEnd, selectionStart, selectedText, value }) => {
      const content = selectedText || "const example = true;";
      const prefix = value.slice(0, selectionStart).endsWith("\n") ? "" : "\n";
      const snippet = `${prefix}\`\`\`\n${content}\n\`\`\`\n`;
      const nextValue =
        value.slice(0, selectionStart) + snippet + value.slice(selectionEnd);
      const codeStart = selectionStart + prefix.length + 4;
      const codeEnd = codeStart + content.length;

      return {
        selectionEnd: codeEnd,
        selectionStart: codeStart,
        value: nextValue,
      };
    });
  };

  const applyLink = () => {
    const url = window.prompt("Enter a link URL", "https://");

    if (!url) {
      return;
    }

    withSelection(({ selectionEnd, selectionStart, selectedText, value }) => {
      const label = selectedText || "Link text";
      const snippet = `[${label}](${url.trim()})`;
      const nextValue =
        value.slice(0, selectionStart) + snippet + value.slice(selectionEnd);
      const nextStart = selectionStart + 1;
      const nextEnd = nextStart + label.length;

      return {
        selectionEnd: nextEnd,
        selectionStart: nextStart,
        value: nextValue,
      };
    });
  };

  const handleKeyDown = (event) => {
    const withModifier = event.metaKey || event.ctrlKey;

    if (!withModifier) {
      if (event.key === "Tab") {
        event.preventDefault();
        insertText("  ");
      }

      return;
    }

    const key = event.key.toLowerCase();

    if (key === "b") {
      event.preventDefault();
      wrapSelection("**", "**", "bold text");
      return;
    }

    if (key === "i") {
      event.preventDefault();
      wrapSelection("*", "*", "italic text");
      return;
    }

    if (key === "k") {
      event.preventDefault();
      applyLink();
      return;
    }

    if (event.shiftKey && key === "8") {
      event.preventDefault();
      applyBulletList();
      return;
    }

    if (event.shiftKey && key === "7") {
      event.preventDefault();
      applyOrderedList();
    }
  };

  const previewHtml =
    getBlogContentHtml(markdown) ||
    "<p>Start writing in Markdown and the README-style preview will appear here.</p>";
  const plainText = getPlainTextFromBlogContent(markdown);
  const wordCount = getBlogWordCount(markdown);

  return (
    <div className="blog-readme-shell">
      <section className="blog-readme-editor-panel">
        <div className="blog-readme-panel-header">
          <div>
            <h4>README Editor</h4>
            <p>
              Write in Markdown with GitHub-style formatting, shortcuts, and a
              live preview beside it.
            </p>
          </div>
          <span className="blog-readme-status">
            {plainText ? `${wordCount} words` : "Empty draft"}
          </span>
        </div>

        <div className="blog-readme-toolbar">
          <button
            type="button"
            className="blog-readme-tool"
            onClick={() => wrapSelection("**", "**", "bold text")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="blog-readme-tool"
            onClick={() => wrapSelection("*", "*", "italic text")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="blog-readme-tool"
            onClick={() => applyHeading(1)}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="blog-readme-tool"
            onClick={() => applyHeading(2)}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="blog-readme-tool"
            onClick={() => applyHeading(3)}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="blog-readme-tool"
            onClick={applyBulletList}
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="blog-readme-tool"
            onClick={applyOrderedList}
            title="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="blog-readme-tool"
            onClick={applyQuote}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="blog-readme-tool"
            onClick={applyCodeBlock}
            title="Code block"
          >
            <Code2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="blog-readme-tool"
            onClick={applyLink}
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="blog-readme-templates">
          <span className="blog-readme-templates-label">Templates</span>
          <div className="blog-readme-templates-list">
            {TEMPLATE_SNIPPETS.map((template) => {
              const Icon = template.icon;

              return (
                <button
                  key={template.id}
                  type="button"
                  className="blog-readme-template"
                  onClick={() => insertSnippet(template.markdown)}
                  title={`${template.title} - ${template.description}`}
                  aria-label={template.title}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          className="blog-readme-textarea"
          value={markdown}
          onChange={(event) => updateMarkdown(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`# Write your blog like a README\n\n## Add sections\n- Use markdown lists\n- Paste code blocks\n- Write naturally`}
          spellCheck
        />

        <div className="blog-readme-footer">
          <span>{SHORTCUT_GROUPS.join(" · ")}</span>
        </div>
      </section>

      <aside className="blog-readme-preview-panel">
        <div className="blog-readme-panel-header">
          <div>
            <h4>GitHub-style Preview</h4>
            <p>Rendered like a README page so structure stays readable while you write.</p>
          </div>
          <span className="blog-readme-status blog-readme-status-preview">
            <Eye className="h-4 w-4" />
            Preview
          </span>
        </div>

        <article className="blog-readme-preview-article">
          {previewImage && (
            <div className="blog-readme-preview-image">
              <img
                src={previewImage}
                alt={previewImageAlt || previewTitle || "Blog"}
              />
            </div>
          )}

          <div className="blog-readme-preview-copy">
            <h1>{previewTitle || "Your blog title will appear here"}</h1>
            {previewDescription && (
              <p className="blog-readme-preview-summary">{previewDescription}</p>
            )}
            <div
              className="blog-readme-markdown-body"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </article>
      </aside>
    </div>
  );
};

export default BlogCanvasEditor;
