#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { tokenize } from './tokenizer.js';
import { parseProgram } from './parser.js';
import { Interpreter } from './interpreter.js';
import { createRuntime } from './runtime.js';

function printUsage() {
  console.log('Usage: node src/cli.js <file.bb>');
}

async function main() {
  const fileArg = process.argv[2];

  if (!fileArg) {
    printUsage();
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);

  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const tokens = tokenize(source, { includeComments: true });
    const ast = parseProgram(tokens);
    const runtime = createRuntime({
      onOutput: (value) => process.stdout.write(String(value)),
      isStopRequested: () => false,
    });

    const interpreter = new Interpreter({ runtime });
    await interpreter.execute(ast);
  } catch (error) {
    console.error(error?.message || String(error));
    process.exit(1);
  }
}

main();
