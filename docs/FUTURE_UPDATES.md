# Future Updates

## Priority 1: language stability

- fix parser edge cases in loops, expressions, and assignment
- normalize keyword handling and syntax consistency
- improve error reporting with exact token locations and suggestions
- validate nested blocks and optional semicolon behavior

## Priority 2: runtime quality

- support object property access (`obj.key` and `obj["key"]`)
- support arrays and strings more consistently across built-ins
- add safe conversion functions and explicit runtime guards
- reduce accidental coercion in numeric operations

## Priority 3: developer tooling

- add a command-line runner for `.bb` files
- add a test suite for tokenizer, parser, and interpreter
- add examples for loops, recursion, and data structures
- create a small documentation site or docs index

## Priority 4: language features

- modules and imports
- richer control flow
- standard library
- user-defined data structures
- optional type annotations
- first-class functions and closures improvements

## Priority 5: experience improvements

- improve IDE autocomplete and inline suggestions
- add dark/light theme toggle
- add run-time profiling and memory insights
- improve output formatting and console behavior
- allow saving projects with named files

## Recommended roadmap

Phase 1:
- stabilize core syntax and fix parser gaps
- add tests and examples

Phase 2:
- build runtime features and standard library
- support object handling and file operations

Phase 3:
- CLI/packaging improvements
- docs and tutorials

Phase 4:
- expand features toward a more complete language experience

## Long-term vision

Bhai Bhai can evolve from a browser teaching project into a more complete educational language platform with a CLI, documentation, examples, and a robust standard library.
