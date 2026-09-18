import test from 'node:test';
import assert from 'node:assert/strict';

import { tokenize } from '../src/tokenizer.js';
import { parseProgram } from '../src/parser.js';
import { createRuntime } from '../src/runtime.js';
import { Interpreter } from '../src/interpreter.js';
import { getAutocompleteItems } from '../editor/autocomplete.js';
import { SyntaxHighlighter, safeRenderTokens } from '../editor/syntax.js';

test('invalid partial code stays visible instead of crashing the editor highlighter', () => {
  const source = 'dekhaw("hello' + '\\';
  const highlighter = new SyntaxHighlighter();

  assert.doesNotThrow(() => {
    const rendered = safeRenderTokens(source, [], { highlighter, showUnknownAsPlain: true });
    assert.equal(rendered, 'dekhaw(&quot;hello\\');
  });
});

test('autocomplete avoids suggesting the exact prefix already typed', () => {
  assert.deepEqual(getAutocompleteItems('dho'), ['dhoro']);
  assert.deepEqual(getAutocompleteItems('dhoro'), []);
  assert.equal(getAutocompleteItems('dho').includes('dho'), false);
});

test('allows non-keyword input without forcing an autocomplete suggestion', () => {
  assert.deepEqual(getAutocompleteItems('neo'), []);
  assert.deepEqual(
    tokenize('neo').map((token) => [token.type, token.value]),
    [
      ['Identifier', 'neo'],
      ['EOF', ''],
    ],
  );
});

test('supports input() for both numbers and strings', async () => {
  const source = `
    dhoro age = input("Age: ")
    dhoro name = input("Name: ")
    dekhaw(age + 1)
    dekhaw(name)
  `;
  const runtime = createRuntime({
    onOutput: () => {},
    isStopRequested: () => false,
    readInput: (prompt) => {
      if (prompt === "Age: ") return "42";
      if (prompt === "Name: ") return "neo";
      return "";
    },
  });

  await new Interpreter({ runtime }).execute(parseProgram(tokenize(source)));
  assert.equal(runtime.global.get('age'), 42);
  assert.equal(runtime.global.get('name'), 'neo');
});

test('builtin function names are treated as identifiers and execute correctly', async () => {
  const source = `
    dhoro x = 10
    dekhaw("hello from bhai bhai")
    dhoro y = naw()
    Bhai (x > 5) {
      dekhaw("ok")
    }
  `;

  const tokens = tokenize(source);
  assert.equal(
    tokens.some((token) => token.type === 'Identifier' && token.value === 'dekhaw'),
    true,
  );
  assert.equal(
    tokens.some((token) => token.type === 'Keyword' && token.value === 'dekhaw'),
    false,
  );

  const ast = parseProgram(tokens);
  const runtime = createRuntime({
    onOutput: () => {},
    isStopRequested: () => false,
  });

  const interpreter = new Interpreter({ runtime });
  await interpreter.execute(ast);

  assert.equal(runtime.global.get('x'), 10);
  assert.equal(runtime.global.get('y'), 0);
});

test('supports the user sample with if/else and return null', () => {
  const source = `
    dhoro x = 10
    dekhaw("Hello from Bhai Bhai")

    if (x > 5) {
      dekhaw("x is greater than 5")
    } else {
      dekhaw("x is small")
    }

    ferot khali
  `;

  const tokens = tokenize(source);
  assert.equal(tokens.some((token) => token.type === 'Boolean' && token.value === true), false);
  assert.equal(tokens.some((token) => token.type === 'Null' && token.value === null), true);

  const ast = parseProgram(tokens);
  assert.equal(ast.body.length > 0, true);
});

test('supports comments in blocks and a variable declaration in a for loop', async () => {
  const source = `
    hobe (dhoro i = 0; i < 3; i = i + 1) {
      // This comment must be ignored by the parser.
      dekhaw(i)
    }
  `;
  const output = [];
  const runtime = createRuntime({
    onOutput: (value) => output.push(value),
    isStopRequested: () => false,
  });

  const interpreter = new Interpreter({ runtime });
  await interpreter.execute(parseProgram(tokenize(source, { includeComments: true })));

  assert.deepEqual(output, ['0\n', '1\n', '2\n']);
});

test('supports object literals and strict equality', async () => {
  const source = `
    dhoro item = {name: "Bhai", count: 2}
    Bhai (1 === 1) {
      dekhaw(length(item))
    }
  `;
  const output = [];
  const runtime = createRuntime({
    onOutput: (value) => output.push(value),
    isStopRequested: () => false,
  });

  await new Interpreter({ runtime }).execute(parseProgram(tokenize(source)));
  assert.deepEqual(output, ['2\n']);
});

test('short-circuits logical operators', async () => {
  const source = `
    sotti || dekhaw("should not print")
    mitha && dekhaw("should not print")
  `;
  const output = [];
  const runtime = createRuntime({
    onOutput: (value) => output.push(value),
    isStopRequested: () => false,
  });

  await new Interpreter({ runtime }).execute(parseProgram(tokenize(source)));
  assert.deepEqual(output, []);
});

test('stops runaway execution at the configured step limit', async () => {
  const source = `jotokhun (sotti) { dekhaw("loop") }`;
  const runtime = createRuntime({
    onOutput: () => {},
    isStopRequested: () => false,
    maxSteps: 10,
  });

  await assert.rejects(
    () => new Interpreter({ runtime }).execute(parseProgram(tokenize(source))),
    /Execution step limit exceeded/,
  );
});

test('limits empty infinite loops too', async () => {
  const runtime = createRuntime({
    onOutput: () => {},
    isStopRequested: () => false,
    maxSteps: 5,
  });

  await assert.rejects(
    () =>
      new Interpreter({ runtime }).execute(
        parseProgram(tokenize('jotokhun (sotti) {}')),
      ),
    /Execution step limit exceeded/,
  );
});

test('rejects return, break, and continue outside their valid context', async () => {
  for (const source of ['ferot 1', 'tham', 'chol']) {
    const runtime = createRuntime({
      onOutput: () => {},
      isStopRequested: () => false,
    });

    await assert.rejects(
      () => new Interpreter({ runtime }).execute(parseProgram(tokenize(source))),
      /can only be used inside/,
    );
  }
});

test('rejects break from a function called by a loop', async () => {
  const source = `
    kaj invalid() { tham }
    hobe (dhoro i = 0; i < 1; i = i + 1) {
      invalid()
    }
  `;
  const runtime = createRuntime({
    onOutput: () => {},
    isStopRequested: () => false,
  });

  await assert.rejects(
    () => new Interpreter({ runtime }).execute(parseProgram(tokenize(source))),
    /tham can only be used inside a loop/,
  );
});

test('validates builtin argument counts', async () => {
  const runtime = createRuntime({
    onOutput: () => {},
    isStopRequested: () => false,
  });

  await assert.rejects(
    () => new Interpreter({ runtime }).execute(parseProgram(tokenize('dekhaw()'))),
    /Expected 1 argument, received 0/,
  );
});

test('supports prefix and postfix increment and decrement', async () => {
  const source = `
    dhoro i = 1
    dekhaw(i++)
    dekhaw(++i)
    hobe (; i > 0; i--) {}
    dekhaw(i)
  `;
  const output = [];
  const runtime = createRuntime({
    onOutput: (value) => output.push(value),
    isStopRequested: () => false,
  });

  await new Interpreter({ runtime }).execute(parseProgram(tokenize(source)));
  assert.deepEqual(output, ['1\n', '3\n', '0\n']);
});

test('preserves object keys that overlap JavaScript internals', async () => {
  const output = [];
  const runtime = createRuntime({
    onOutput: (value) => output.push(value),
    isStopRequested: () => false,
  });

  await new Interpreter({ runtime }).execute(
    parseProgram(tokenize('dhoro item = {"__proto__": 1}\ndekhaw(length(item))')),
  );

  assert.deepEqual(output, ['1\n']);
});
