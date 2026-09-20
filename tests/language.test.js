import test from 'node:test';
import assert from 'node:assert/strict';

import { tokenize } from '../src/tokenizer.js';
import { parseProgram } from '../src/parser.js';
import { createRuntime } from '../src/runtime.js';
import { Interpreter } from '../src/interpreter.js';
import {
  getAutocompleteItems,
  getPrefixAtCaret,
  applyAutocompleteReplacement,
} from '../editor/autocomplete.js';
import {
  getAutoIndentInsert,
  applyTabIndent,
} from '../editor/typing.js';
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

test('autocomplete tracks the current word before the cursor and replaces only that prefix', () => {
  const editor = { value: 'dh', selectionStart: 2, selectionEnd: 2 };
  assert.equal(getPrefixAtCaret(editor), 'dh');

  editor.value = 'dhoro';
  editor.selectionStart = 2;
  editor.selectionEnd = 2;
  applyAutocompleteReplacement(editor, 'dh', 'dekhaw');
  assert.equal(editor.value, 'dekhaworo');
  assert.equal(editor.selectionStart, 6);
  assert.equal(editor.selectionEnd, 6);

  const emptyEditor = { value: '  ', selectionStart: 1, selectionEnd: 1 };
  assert.equal(getPrefixAtCaret(emptyEditor), '');
});

test('preserves indentation and block depth on Enter and Tab', () => {
  const start = 'Bhai (x > 5) {\n    dekhaw("hi")\n';
  assert.equal(
    getAutoIndentInsert(start, start.length),
    '\n    ',
  );

  const afterTab = applyTabIndent('dekhaw(1)', 0, 0, '  ');
  assert.equal(afterTab.value, '  dekhaw(1)');
  assert.equal(afterTab.selectionStart, 2);
  assert.equal(afterTab.selectionEnd, 2);

  const selected = applyTabIndent('dhoro x = 1', 0, 2, '  ');
  assert.equal(selected.value, '  oro x = 1');
});

test('supports input() and neo() for both numbers and strings', async () => {
  const source = `
    dhoro neo = neo("Age: ")
    dhoro name = input("Name: ")
    dekhaw(neo + 1)
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
  assert.equal(runtime.global.get('neo'), 42);
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

test('maps Bangla boolean literals and output names correctly', async () => {
  const tokens = tokenize('dekhaw(sotti)\ndekhaw(mittha)');
  const booleans = tokens
    .filter((token) => token.type === 'Boolean')
    .map((token) => token.value);

  assert.deepEqual(booleans, [true, false]);

  const output = [];
  const runtime = createRuntime({
    onOutput: (value) => output.push(value),
    isStopRequested: () => false,
  });
  await new Interpreter({ runtime }).execute(parseProgram(tokens));
  assert.deepEqual(output, ['sotti\n', 'mittha\n']);
});

test('supports indexing arrays with literal and variable indexes', async () => {
  const source = `
    dhoro numbers = [12, 7, 25]
    dhoro index = 1
    dekhaw(numbers[0])
    dekhaw(numbers[index])
  `;
  const output = [];
  const runtime = createRuntime({
    onOutput: (value) => output.push(value),
    isStopRequested: () => false,
  });

  await new Interpreter({ runtime }).execute(parseProgram(tokenize(source)));
  assert.deepEqual(output, ['12\n', '7\n']);
});

test('short-circuits logical operators', async () => {
  const source = `
    sotti || dekhaw("should not print")
    mittha && dekhaw("should not print")
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
