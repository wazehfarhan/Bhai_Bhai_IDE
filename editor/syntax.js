export class SyntaxHighlighter {
  constructor() {
    this.classFor = (tok) => {
      switch (tok.type) {
        case "Keyword":
          return "tok-keyword";
        case "Identifier":
          return "tok-ident";
        case "Number":
          return "tok-number";
        case "String":
          return "tok-string";
        case "Boolean":
          return "tok-boolean";
        case "Null":
          return "tok-null";
        case "Comment":
          return "tok-comment";
        case "Operator":
          return "tok-operator";
        case "Punctuation":
          return tok.value === "(" ||
            tok.value === ")" ||
            tok.value === "{" ||
            tok.value === "}"
            ? "tok-paren"
            : "";
        default:
          return "";
      }
    };
  }

  renderTokens(tokens, { source = "", showUnknownAsPlain = true } = {}) {
    // Preserve whitespace and line breaks exactly as they appear in the source.
    // We reconstruct the original source and wrap only the token text in spans.
    let html = "";
    let cursor = 0;

    for (const tok of tokens) {
      if (tok.type === "EOF") break;
      if (typeof tok.location?.offset !== "number") {
        const raw = tok.raw ?? String(tok.value ?? "");
        if (!raw) continue;
        const cls = this.classFor(tok);
        const safe = escapeHtml(raw);
        if (cls) html += `<span class="${cls}">${safe}</span>`;
        else if (showUnknownAsPlain) html += safe;
        continue;
      }

      const start = tok.location.offset;
      const raw = tok.raw ?? String(tok.value ?? "");
      const before = source.slice(cursor, start);
      if (before) html += escapeHtml(before);

      cursor = start + raw.length;
      const cls = this.classFor(tok);
      const safe = escapeHtml(raw);
      if (cls) html += `<span class="${cls}">${safe}</span>`;
      else if (showUnknownAsPlain) html += safe;
    }

    const tail = source.slice(cursor);
    if (tail) html += escapeHtml(tail);
    return html;
  }

  renderSource(source, { showUnknownAsPlain = true } = {}) {
    return escapeHtml(source).replace(/\n/g, "\n");
  }
}

export function safeRenderTokens(source, tokens = [], options = {}) {
  const { highlighter = new SyntaxHighlighter(), showUnknownAsPlain = true } = options;

  if (!source) return "";

  try {
    if (tokens.length === 0) {
      return highlighter.renderSource(source, { showUnknownAsPlain });
    }
    return highlighter.renderTokens(tokens, { source, showUnknownAsPlain });
  } catch {
    return highlighter.renderSource(source, { showUnknownAsPlain });
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
