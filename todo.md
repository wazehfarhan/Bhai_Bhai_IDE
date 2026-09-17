# Bhai Bhai — Optimization & Upgrade Plan

**Audit date:** 2026-09-17  
**Current baseline:** `npm test` passes (2 tests); the CLI example executes. The project is a browser-based educational interpreter and is not yet production-ready.

## Priority 0 — Correctness blockers

- [ ] **Fix comment handling in every parser context.** `parseProgram()` skips `Comment` tokens, but `parseBlock()` adds a `null` statement for comments; execution then fails when it reads `node.type`.
  - Files: `src/parser.js`, `tests/language.test.js`
  - Done when comments work before, between, and after statements at top level and in nested blocks.

- [ ] **Make the Stop button actually stop runaway programs.** Interpreter execution is synchronous, so a `while (sotti)` loop blocks the browser event loop before the button click can set `stopRequested`.
  - Files: `src/interpreter.js`, `src/runtime.js`, `app.js`
  - Recommended approach: run execution in a Web Worker, use messages for output/stop, and terminate the worker as a last-resort timeout.
  - Done when an infinite loop can be stopped without freezing the IDE.

- [ ] **Remove or complete unsupported syntax.** The tokenizer recognizes `++`, `--`, and `===`/`!==`, but the parser/interpreter do not support them. Object literals are scaffolded but cannot tokenize `:` or be parsed from a primary expression; the interpreter cannot evaluate them.
  - Files: `src/tokenizer_impl.js`, `src/parser.js`, `src/interpreter.js`, `src/ast.js`
  - Decision required: implement each construct end-to-end, or stop tokenizing/documenting it.

- [ ] **Correct the `hobe` loop keyword check.** The parser checks `Keyword: forCond` but consumes `Kotokhun`; that condition can never be true.
  - File: `src/parser.js`
  - Done when every documented loop spelling has a test and behaves consistently.

- [ ] **Define and enforce control-flow validity.** `ferot`, `tham`, and `chol` currently have no parser/runtime validation for use outside valid function or loop contexts.
  - Files: `src/parser.js`, `src/interpreter.js`, `src/errors.js`
  - Done when invalid use gives a location-aware language error, not silent or surprising behavior.

## Priority 1 — Stabilize the language core

- [ ] Publish a versioned language specification: grammar, keywords, precedence/associativity, values, coercion rules, scope rules, error behavior, and Bengali/English aliases.
- [ ] Choose an explicit value model. Replace accidental `Number(...)` coercions with predictable type checks and helpful errors for arithmetic, comparison, and built-ins.
- [ ] Implement short-circuit behavior for `&&` and `||`; both sides are currently evaluated, which can cause unwanted side effects/errors.
- [ ] Decide whether block variables are block-scoped or function/global-scoped, then document and test shadowing, closure capture, and reassignment.
- [ ] Add function argument validation: arity errors, readable function names in stack traces, and a defined policy for missing/excess arguments.
- [ ] Implement objects fully only after the syntax decision: object literal, property read/write, bracket access, nested values, and safe `length` behavior.
- [ ] Add array indexing and assignment, or remove arrays from the advertised feature set until they are usable beyond passing them to built-ins.
- [ ] Add source spans (`start` and `end`) to AST nodes so runtime errors can highlight the exact source range.
- [ ] Separate a public `compile()` pipeline into tokenize → parse → validate, with stable result/error types shared by the CLI and browser.

## Priority 2 — Testing and quality gates

- [ ] Expand unit tests by layer: tokenizer, parser/AST snapshots, interpreter, built-ins, errors, CLI behavior, and browser utility modules.
- [ ] Add regressions for comments in blocks, nested functions/loops, recursion, operator precedence, assignment chaining, optional semicolons, malformed input, escaped strings, and cancellation.
- [ ] Add tests for all documented examples; examples must run in CI.
- [ ] Add property/fuzz tests for tokenizer/parser termination and malformed-source error locations.
- [ ] Add coverage reporting with a meaningful threshold, starting with the language core.
- [ ] Add ESLint and Prettier (or equivalent) with `lint`, `format:check`, and `test` scripts.
- [ ] Add CI (GitHub Actions or chosen host) to run install, lint, tests, and example validation on supported Node versions.
- [ ] Add a browser test suite with Playwright for Run, Stop, upload/download, tabs, keyboard shortcuts, autocomplete, and error display.

## Priority 3 — Browser IDE performance, UX, and accessibility

- [ ] Re-enable or remove syntax highlighting deliberately. `.syntax-layer` is forced to `display: none`, so highlighting code currently runs but is never visible.
- [ ] If highlighting stays, render safely and efficiently: debounce input, use `textContent`/DOM nodes where practical, preserve raw token ranges, and avoid full-editor re-rendering for large files.
- [ ] Fix the highlighter’s string range calculation: tokenizer string `raw` omits quotation marks, causing source offsets to drift after strings.
- [ ] Replace `gutter.innerHTML` with safe DOM rendering and virtualize/debounce line-number updates for large sources.
- [ ] Add responsive layouts and mobile breakpoints; the two-column interface and tab row need to remain usable on narrow screens.
- [ ] Add keyboard-accessible tabs (`role=tablist`, `role=tab`, `aria-selected`, arrow-key navigation) and visible focus states for all controls.
- [ ] Add accessible labels/status announcements for run state, errors, output, file upload, and autocomplete.
- [ ] Respect reduced motion and improve color contrast; add a light theme only after tokens and UI meet contrast targets.
- [ ] Persist editor source, selected tab, and theme in `localStorage`, with explicit restore/clear controls and error handling for unavailable storage.
- [ ] Add unsaved-change protection before replacing code with an upload or navigating away.
- [ ] Improve editor behavior: multi-line indent/outdent, paired brackets, correct autocomplete caret positioning, suggestion selection with keyboard, and a real caret-based popup position.
- [ ] Add output limits/truncation and a “copy output” action so a program cannot create an unbounded DOM/string.
- [ ] Make metrics accurate: label heap measurement as browser-specific or hide it; include execution limits/timeouts rather than presenting unavailable memory as a metric.

## Priority 4 — Runtime safety and performance

- [ ] Define execution limits: instruction/iteration budget, maximum call depth, maximum output bytes, maximum array/object size, and configurable timeout.
- [ ] Check cancellation at configurable intervals within loops and function calls, not only per statement.
- [ ] Move browser execution into an isolated worker and make the worker protocol explicit (`run`, `output`, `success`, `error`, `stop`).
- [ ] Add a structured execution result containing output, elapsed time, diagnostics, and optional token/AST debug data.
- [ ] Add debug panels only on demand; serializing every token and AST on every Run wastes time and memory for normal execution.
- [ ] Make built-ins immutable at the language level unless mutability is intentional; document mutation for `push` and `pop`.
- [ ] Add a standard-library registry that records name, arity, description, type contract, and tests in one place.

## Priority 5 — CLI, packaging, and developer experience

- [ ] Add a `bin` entry so users can run `bhai-bhai file.bb` after installation, rather than invoking internal source paths.
- [ ] Replace synchronous CLI file reads with `node:fs/promises`; support `--help`, `--version`, `--tokens`, `--ast`, `--timeout`, and clear exit codes.
- [ ] Print CLI diagnostics with filename, line, column, source excerpt, and caret indicator.
- [ ] Add `engines.node`, license, repository, keywords, author, and package metadata to `package.json`.
- [ ] Add a lockfile and a reproducible install workflow before introducing dependencies.
- [ ] Add a minimal static-server/dev script and document it; opening ES-module files directly can be unreliable across browser environments.
- [ ] Add a release process: semantic versioning, changelog, tags, and a prepublish quality gate.

## Priority 6 — Documentation and examples

- [ ] Reconcile documentation with implementation. Existing docs still list CLI support and tests as future work even though they exist.
- [ ] Fix the in-app docs typo (`</n`) and validate every rendered code sample against the interpreter.
- [ ] Create examples for hello world, variables, branching, `hobe`/`jotokhun`, functions, recursion, arrays, errors, and cancellation.
- [ ] Add a concise language reference with copyable examples and a glossary of Bengali keywords.
- [ ] Document explicit limitations until implemented: no property access, incomplete object support, no modules/imports, no debugger, and execution safety constraints.
- [ ] Add contribution guidelines, architecture notes, coding conventions, and an issue/feature template.

## Priority 7 — Future capabilities (after stability)

- [ ] REPL with command history and multiline entry.
- [ ] Source debugger: breakpoints, stepping, scope inspection, call stack, and trace events from the interpreter/worker.
- [ ] Modules/imports with a browser-safe resolver and CLI file resolver.
- [ ] Formatter and language-server features: diagnostics, hover help, go-to definition, and completions generated from the language spec.
- [ ] Optional type annotations and static validation, introduced only with a written type-system proposal.
- [ ] Documentation website and interactive tutorial path.

## Suggested delivery order

1. Fix P0 defects and write regression tests.
2. Establish grammar/value semantics, test coverage, linting, and CI.
3. Isolate browser execution in a worker and finish core IDE accessibility/performance work.
4. Complete objects/arrays or trim them from the public language surface.
5. Improve CLI/package/docs/examples, then build advanced tooling.

## Definition of “optimized upgrade”

- All documented syntax works end-to-end and is covered by automated tests.
- Infinite or excessive programs cannot freeze the browser or exhaust output memory.
- Errors consistently include source location and useful explanation.
- The IDE works with keyboard navigation, narrow screens, and assistive technology.
- CI blocks regressions; examples, CLI, docs, and browser behavior stay aligned.
