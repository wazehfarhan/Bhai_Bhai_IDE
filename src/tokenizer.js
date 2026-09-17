import { tokenizeImpl } from "./tokenizer_impl.js";

export function tokenize(source, opts = {}) {
  return tokenizeImpl(source, opts);
}

// Used by IDE (syntax highlighter + token viewer)
export function tokenizeForIDE(source, opts = {}) {
  const tokens = tokenizeImpl(source, opts);
  return tokens.map((t) => ({
    type: t.type,
    value: t.value,
    raw: t.raw,
    location: t.location,
  }));
}
