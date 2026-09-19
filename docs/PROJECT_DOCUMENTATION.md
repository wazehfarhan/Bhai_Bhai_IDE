# Bhai Bhai Project Documentation

## 1. Project purpose

Bhai Bhai is a browser-based toy programming language built for learning language internals. The project demonstrates the classic pipeline:

- source text
- tokenizer
- parser
- AST
- interpreter
- runtime built-ins
- browser IDE output

The language is intentionally small, readable, and beginner-friendly. It uses Bangla-inspired keywords such as `dhoro`, `Bhai`, `Nahole`, `hobe`, `jotokhun`, and `ferot`.

## 2. High-level architecture

### Browser IDE layer

- `index.html` defines the editor, output panes, tabs, controls, and UI layout.
- `style.css` provides the dark editor theme and syntax highlighting styles.
- `app.js` connects the editor to the tokenizer, parser, runtime, and output panels.

### Language implementation layer

- `src/tokenizer_impl.js` tokenizes source code into tokens, keywords, numbers, strings, operators, punctuation, and EOF markers.
- `src/tokenizer.js` exposes a public tokenizer wrapper and an IDE-friendly tokenizer used by the editor.
- `src/parser.js` converts tokens into an AST using recursive-descent parsing.
- `src/ast.js` defines AST node constructors for statements and expressions.
- `src/interpreter.js` executes the AST in a runtime environment.
- `src/environment.js` provides scoped variable lookup and assignment.
- `src/runtime.js` registers built-in functions such as `dekhaw`, `naw`, `length`, and arithmetic helpers.
- `src/errors.js` defines the custom error model and Bengali-style formatting helpers.
- `src/compiler.js` acts as a lightweight compile facade that returns tokens and AST.

### Editor experience layer

- `editor/autocomplete.js` provides keyword and builtin suggestions.
- `editor/syntax.js` renders token-based color highlighting.

## 3. Core execution pipeline

The project follows this flow:

1. User writes code in the browser editor.
2. `tokenizeForIDE` tokenizes the text and highlights keywords.
3. `parseProgram` builds a syntax tree.
4. `Interpreter.execute` runs the AST with a runtime environment.
5. Built-ins print output and expose helper functions.
6. Errors are displayed in the UI panels.

## 4. Supported language concepts

### Variables

- `dhoro x = 10`
- `dhoro name = "Bhai"`

### Control flow

- `Bhai (condition) { ... }`
- `Nahole { ... }`
- `hobe (...) { ... }`
- `jotokhun (condition) { ... }`

### Functions

- `kaj add(a, b) { ferot a + b }`

### Return, break, continue

- `ferot value`
- `tham`
- `chol`

### Expressions

- arithmetic: `+ - * / % ^`
- comparison: `== != > < >= <=`
- logical: `&& || !`
- arrays: `[1, 2, 3]`
- literals: numbers, strings, booleans, null

## 5. Built-in runtime functions

The runtime currently registers these functions in `src/runtime.js`:

- `dekhaw(value)` -> outputs text to the console/pane
- `neo(prompt?)` -> reads user input; numbers become numbers and other text stays a string
- `input(prompt?)` -> alias for `neo(prompt?)`
- `naw()` -> returns 0
- `length(value)` -> returns array/string/object length
- `push(array, item)` -> append to array
- `pop(array)` -> pop last item
- `random()` -> random number
- `sqrt(x)` -> square root
- `abs(x)` -> absolute value
- `min(a, b)` -> min value
- `max(a, b)` -> max value
- `time()` -> current timestamp

## 6. Current strengths

- Simple and readable language architecture
- Browser-based IDE with real-time tokens and AST output
- Good educational value for compiler/interpreter learning
- Custom keyword system and clear runtime separation
- Lightweight editor experience with autocomplete and syntax highlighting

## 7. Current limitations

The project is intentionally a prototype, and a few real-language features are still limited:

- parser support for object literals exists but runtime handling is minimal
- assignment is restricted to identifiers
- expression coverage is not broad enough for a full language runtime
- no module system or imports
- no package manager or CLI workflow
- no unit test suite yet
- no formal docs/examples folder beyond this project introduction
- no robust standard library or REPL-only workflow beyond the browser editor

## 8. File-by-file overview

- `app.js` – browser IDE orchestration and execution logic
- `index.html` – application shell and panel layout
- `style.css` – editor theme and output styling
- `src/ast.js` – AST constructors
- `src/compiler.js` – compile facade
- `src/environment.js` – lexical scope manager
- `src/errors.js` – runtime/syntax error handling
- `src/interpreter.js` – main evaluator
- `src/parser.js` – recursive-descent parser
- `src/runtime.js` – built-in functions and runtime globals
- `src/tokenizer.js` – public tokenizer wrapper
- `src/tokenizer_impl.js` – lexer implementation
- `src/utils.js` – small helper functions
- `editor/autocomplete.js` – autocomplete support
- `editor/syntax.js` – syntax highlighting

## 9. Suggested target status

This project is best understood as an educational interpreter prototype. It is strongest as a teaching project and a first-step language implementation rather than a production-ready language runtime.

## 10. Recommended next focus areas

- stabilize parsing for more statement forms
- add tests for tokenizer and parser behavior
- improve runtime safety and error messages
- add comments and examples for each feature
- create a richer standard library
- support modules, files, and CLI execution

## 11. Summary

Bhai Bhai is a compact, browser-based programming language built around a simple teaching architecture. It demonstrates how a token stream, AST, and runtime interpreter can work together in an interactive environment. The repository is well suited for further experimentation, language-language features, and learning compiler design in practice.
