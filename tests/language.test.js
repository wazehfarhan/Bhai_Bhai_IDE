import test from 'node:test';
import assert from 'node:assert/strict';

import { tokenize } from '../src/tokenizer.js';
import { parseProgram } from '../src/parser.js';
import { createRuntime } from '../src/runtime.js';
import { Interpreter } from '../src/interpreter.js';

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
