import { BhaiBhaiError } from "./errors.js";
import { isAlpha, isAlphaNumeric, isDigit } from "./utils.js";

const KEYWORDS = new Map([
  ["dhoro", "dhoro"],
  ["Bhai", "Bhai"],
  ["if", "Bhai"],
  ["Nahole", "Nahole"],
  ["else", "Nahole"],
  ["hobe", "hobe"],
  ["for", "hobe"],
  ["Kotokhun", "Kotokhun"],
  ["jotokhun", "jotokhun"],
  ["while", "jotokhun"],
  ["kaj", "kaj"],
  ["function", "kaj"],
  ["ferot", "ferot"],
  ["return", "ferot"],
  ["tham", "tham"],
  ["break", "tham"],
  ["chol", "chol"],
  ["continue", "chol"],
  ["sotti", "true"],
  ["true", "true"],
  ["mitha", "false"],
  ["false", "false"],
  ["khali", "null"],
  ["null", "null"],
]);

const OPERATORS_3 = new Set(["===", "!=="]);
const OPERATORS_2 = new Set([
  "==",
  "!=",
  ">=",
  "<=",
  "&&",
  "||",
  "++",
  "--",
  "^",
]);
const SINGLE = new Set([
  "+",
  "-",
  "*",
  "/",
  "%",
  ">",
  "<",
  "!",
  "=",
  "^",
  "(",
  ")",
  "{",
  "}",
  "[",
  "]",
  ",",
  ";",
]);

export function tokenizeImpl(input, { includeComments = false } = {}) {
  const tokens = [];
  let i = 0;
  let line = 1;
  let col = 1;

  function loc() {
    return { line, col, offset: i };
  }

  function advance(n = 1) {
    for (let k = 0; k < n; k++) {
      const ch = input[i++];
      if (ch === "\n") {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
  }

  function peek(n = 0) {
    return input[i + n] ?? "";
  }

  function add(type, value, raw = value, startLoc = loc()) {
    tokens.push({ type, value, raw, location: startLoc });
  }

  while (i < input.length) {
    const ch = peek();

    if (/\s/.test(ch)) {
      advance();
      continue;
    }

    if (ch === "/" && peek(1) === "/") {
      const start = loc();
      let raw = "";
      while (i < input.length && peek() !== "\n") {
        raw += peek();
        advance();
      }
      if (includeComments) add("Comment", raw, raw, start);
      continue;
    }

    if (ch === "/" && peek(1) === "*") {
      const start = loc();
      let raw = "";
      advance(2);
      raw += "/*";
      while (i < input.length && !(peek() === "*" && peek(1) === "/")) {
        raw += peek();
        advance();
      }
      if (i >= input.length) {
        throw new BhaiBhaiError("Unterminated comment", {
          kind: "SyntaxError",
          location: start,
        });
      }
      advance(2);
      raw += "*/";
      if (includeComments) add("Comment", raw, raw, start);
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = loc();
      advance();
      let value = "";
      while (i < input.length && peek() !== quote) {
        if (peek() === "\\") {
          const esc = peek(1);
          if (esc === "n") {
            value += "\n";
            advance(2);
            continue;
          }
          if (esc === "t") {
            value += "\t";
            advance(2);
            continue;
          }
          if (esc === "r") {
            value += "\r";
            advance(2);
            continue;
          }
          if (esc === quote) {
            value += quote;
            advance(2);
            continue;
          }
          value += esc;
          advance(2);
          continue;
        }
        value += peek();
        advance();
      }
      if (peek() !== quote) {
        throw new BhaiBhaiError("Unterminated string", {
          kind: "SyntaxError",
          location: start,
        });
      }
      advance();
      add("String", value, input.slice(start.offset, i), start);
      continue;
    }

    if (isDigit(ch) || (ch === "." && isDigit(peek(1)))) {
      const start = loc();
      let raw = "";
      let hasDot = false;
      while (i < input.length) {
        const c = peek();
        if (c === "." && !hasDot) {
          hasDot = true;
          raw += c;
          advance();
          continue;
        }
        if (isDigit(c)) {
          raw += c;
          advance();
          continue;
        }
        break;
      }
      add("Number", Number(raw), raw, start);
      continue;
    }

    if (isAlpha(ch)) {
      const start = loc();
      let raw = "";
      while (i < input.length && isAlphaNumeric(peek())) {
        raw += peek();
        advance();
      }
      const kw = KEYWORDS.get(raw);
      if (kw) {
        if (kw === "true") add("Boolean", true, raw, start);
        else if (kw === "false") add("Boolean", false, raw, start);
        else if (kw === "null") add("Null", null, raw, start);
        else add("Keyword", kw, raw, start);
      } else {
        add("Identifier", raw, raw, start);
      }
      continue;
    }

    const three = ch + peek(1) + peek(2);
    if (OPERATORS_3.has(three)) {
      const start = loc();
      advance(3);
      add("Operator", three, three, start);
      continue;
    }

    const two = ch + peek(1);
    if (OPERATORS_2.has(two)) {
      const start = loc();
      advance(2);
      add("Operator", two, two, start);
      continue;
    }

    if (SINGLE.has(ch)) {
      const start = loc();
      advance();
      const mapType = ["(", ")", "{", "}", "[", "]", ",", ";"].includes(ch)
        ? "Punctuation"
        : "Operator";
      add(mapType, ch, ch, start);
      continue;
    }

    throw new BhaiBhaiError(`Unknown character: ${ch}`, {
      kind: "SyntaxError",
      location: loc(),
    });
  }

  tokens.push({
    type: "EOF",
    value: "",
    raw: "",
    location: { line, col, offset: i },
  });
  return tokens;
}
