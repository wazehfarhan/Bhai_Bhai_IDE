// A lightweight facade that currently delegates to the parser/interpreter.
// Kept to match required architecture (compiler module).

import { tokenize } from "./tokenizer.js";
import { parseProgram } from "./parser.js";

export function compile(source, opts = {}) {
  const tokens = tokenize(source, { includeComments: !!opts.includeComments });
  const ast = parseProgram(tokens);
  return { tokens, ast };
}
