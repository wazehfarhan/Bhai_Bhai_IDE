export function getLineIndent(source, caretPosition) {
  if (typeof source !== "string") return "";
  const safeCaret = Math.max(0, Math.min(caretPosition ?? source.length, source.length));
  const before = source.slice(0, safeCaret);
  const currentLine = before.split("\n").pop() ?? "";
  return currentLine.match(/^\s*/)?.[0] ?? "";
}

export function getAutoIndentInsert(source, caretPosition) {
  if (typeof source !== "string") return "\n";
  const safeCaret = Math.max(0, Math.min(caretPosition ?? source.length, source.length));
  const before = source.slice(0, safeCaret);
  const lines = before.split("\n");
  const currentLine = lines.at(-1) ?? "";
  const previousLine = lines.length > 1 ? lines.at(-2) ?? "" : "";
  const lineForIndent = currentLine.trim() === "" ? previousLine : currentLine;
  const baseIndent = lineForIndent.match(/^\s*/)?.[0] ?? "";

  if (lineForIndent.trimEnd().endsWith("{")) {
    return `\n${baseIndent}  `;
  }

  return `\n${baseIndent}`;
}

export function applyTabIndent(value, selectionStart, selectionEnd, indentString = "  ") {
  if (typeof value !== "string") {
    return { value: "", selectionStart: 0, selectionEnd: 0 };
  }

  const start = Math.min(selectionStart ?? value.length, value.length);
  const end = Math.min(Math.max(selectionEnd ?? start, start), value.length);
  const before = value.slice(0, start);
  const after = value.slice(end);
  const inserted = `${before}${indentString}${after}`;
  const cursor = start + indentString.length;

  return {
    value: inserted,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}
