import { tokenizeForIDE } from "./src/tokenizer.js";
import { parseProgram } from "./src/parser.js";
import { Interpreter } from "./src/interpreter.js";
import { createRuntime } from "./src/runtime.js";
import { SyntaxHighlighter } from "./editor/syntax.js";
import { installAutocomplete } from "./editor/autocomplete.js";
import { getAutoIndentInsert, applyTabIndent } from "./editor/typing.js";

const codeInput = document.getElementById("codeInput");
const gutter = document.getElementById("gutter");
const syntaxLayer = document.getElementById("syntaxLayer");
const runBtn = document.getElementById("runBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const uploadInput = document.getElementById("uploadInput");

const statusLeft = document.getElementById("statusLeft");
const statusRight = document.getElementById("statusRight");

const panes = {
  runtime: document.getElementById("runtime"),
  errors: document.getElementById("errors"),
  tokens: document.getElementById("tokens"),
  ast: document.getElementById("ast"),
  docs: document.getElementById("docs"),
};

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const key = tab.dataset.tab;
    document
      .querySelectorAll(".content-pane")
      .forEach((p) => p.classList.remove("active"));
    panes[key].classList.add("active");
  });
});

function setPane(key, text) {
  panes[key].textContent = text;
}

function clearOutput() {
  setPane("runtime", "");
  setPane("errors", "");
  setPane("tokens", "");
  setPane("ast", "");
}

function renderDocumentation() {
  if (!panes.docs) return;
  const sections = [
    {
      title: "1. Variables",
      body: `
        <p>Use the keyword <code>dhoro</code> to declare variables.</p>
        <pre>dhoro x = 10
dhoro name = "Bhai"</pre>
        <p class="output">Output: x stores 10 and name stores "Bhai".</p>
      `,
    },
    {
      title: "2. Conditionals",
      body: `
        <p>Use <code>Bhai</code> and optional <code>Nahole</code> for branching.</p>
        <pre>Bhai (x > 5) {
  dekhaw("x is greater")
} Nahole {
  dekhaw("x is smaller")
}</pre>
        <p class="output">Output: one branch runs depending on the condition.</p>
      `,
    },
    {
      title: "3. Loops",
      body: `
        <p>Use <code>hobe</code> for loops and <code>jotokhun</code> for while loops.</p>
        <pre>dhoro i = 0
hobe (i < 3) {
  dekhaw(i)
  i = i + 1
}</pre>
        <p class="output">Output: 0, 1, 2</p>
      `,
    },
    {
      title: "4. Functions",
      body: `
        <p>Use <code>kaj</code> to define a function and <code>ferot</code> to return a value.</p>
        <pre>kaj add(a, b) {
  ferot a + b
}

dekhaw(add(2, 3))</pre>
        <p class="output">Output: 5</p>
      `,
    },
    {
      title: "5. Built-in functions",
      body: `
        <p>Common built-ins include <code>dekhaw</code>, <code>neo</code>, <code>input</code>, <code>naw</code>, <code>length</code>, <code>push</code>, <code>pop</code>, and math helpers.</p>
        <pre>dekhaw("Hello from Bhai Bhai")
      dhoro y = neo("Enter a value: ")
      dekhaw(y)</pre>
        <p class="output">Output: Hello from Bhai Bhai and the entered value</p>
      `,
    },
    {
      title: "6. Exact keyword guide",
      body: `
        <ul>
          <li><code>dhoro</code> = variable declaration</li>
          <li><code>Bhai</code> = if</li>
          <li><code>Nahole</code> = else</li>
          <li><code>hobe</code> = for loop</li>
          <li><code>jotokhun</code> = while loop</li>
          <li><code>kaj</code> = function</li>
          <li><code>ferot</code> = return</li>
          <li><code>tham</code> = break</li>
          <li><code>chol</code> = continue</li>
          <li><code>sotti</code> / <code>mittha</code> = true / false</li>
          <li><code>khali</code> = null</li>
        </ul>
        <p>Important: use the exact keyword spellings above. If the word is not recognized, check the spelling and use the exact form shown here.</p>
      `,
    },
  ];

  panes.docs.innerHTML = sections
    .map(
      (section) => `
        <div class="doc-section">
          <h3>${section.title}</h3>
          ${section.body}
        </div>
      `,
    )
    .join("");
}

function syncGutter() {
  const lines = codeInput.value.split("\n").length;
  gutter.innerHTML = Array.from(
    { length: lines },
    (_, i) => `<div>${i + 1}</div>`,
  ).join("");
}

function syncScroll() {
  syntaxLayer.scrollTop = codeInput.scrollTop;
  syntaxLayer.scrollLeft = codeInput.scrollLeft;
}

const highlighter = new SyntaxHighlighter();
function renderSyntax() {
  const source = codeInput.value;
  try {
    const tokens = tokenizeForIDE(source);
    syntaxLayer.innerHTML = highlighter.renderTokens(tokens, {
      source,
      showUnknownAsPlain: true,
    });
  } catch (error) {
    syntaxLayer.textContent = source;
  }
}

codeInput.addEventListener("input", () => {
  syncGutter();
  renderSyntax();
});
codeInput.addEventListener("scroll", syncScroll);

// Tab to spaces
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const { value, selectionStart, selectionEnd } = applyTabIndent(
      codeInput.value,
      codeInput.selectionStart,
      codeInput.selectionEnd,
      "  ",
    );
    codeInput.value = value;
    codeInput.selectionStart = selectionStart;
    codeInput.selectionEnd = selectionEnd;
    syncGutter();
    renderSyntax();
    return;
  }
});

// Auto-indent on Enter. A new block gains one indentation level, so typing
// inside Bhai/ Nahole/ hobe/ jotokhun blocks does not start at column zero.
codeInput.addEventListener("keydown", (e) => {
  // Autocomplete owns Enter while its suggestion list is open. Respect its
  // cancelled event so this handler cannot add a newline after acceptance.
  if (e.key !== "Enter" || e.defaultPrevented || e.shiftKey) return;
  e.preventDefault();

  const start = codeInput.selectionStart;
  const end = codeInput.selectionEnd;
  const value = codeInput.value;
  const insert = getAutoIndentInsert(value, start);

  codeInput.value = value.slice(0, start) + insert + value.slice(end);
  codeInput.selectionStart = codeInput.selectionEnd = start + insert.length;
  syncGutter();
  renderSyntax();
});

// Align a closing brace with its opening block when it is typed on an
// otherwise blank indented line.
codeInput.addEventListener("keydown", (e) => {
  if (e.key !== "}" || e.ctrlKey || e.metaKey || e.altKey) return;

  const start = codeInput.selectionStart;
  const end = codeInput.selectionEnd;
  const value = codeInput.value;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const beforeCaret = value.slice(lineStart, start);
  if (!/^\s*$/.test(beforeCaret)) return;

  const indent = beforeCaret.slice(0, Math.max(0, beforeCaret.length - 2));
  e.preventDefault();
  codeInput.value =
    value.slice(0, lineStart) + indent + "}" + value.slice(end);
  codeInput.selectionStart = codeInput.selectionEnd = lineStart + indent.length + 1;
  syncGutter();
  renderSyntax();
});

installAutocomplete({
  editor: codeInput,
  getSource: () => codeInput.value,
  onRender: () => renderSyntax(),
});

let runToken = 0;
let stopRequested = false;

function formatError(err) {
  if (!err || typeof err !== "object") return String(err);
  const kind = err.kind ? `(${err.kind})` : "";
  const loc = err.location
    ? ` line ${err.location.line}, column ${err.location.col}`
    : "";
  const msg = err.message ?? String(err);
  return `${kind}${loc}\n${msg}`.trim();
}

async function runProgram() {
  runToken++;
  stopRequested = false;
  const myToken = runToken;
  clearOutput();

  statusLeft.textContent = "Compiling...";
  statusRight.textContent = "";

  const start = performance.now();

  try {
    const tokens = tokenizeForIDE(codeInput.value, { includeComments: true });
    panes.tokens.textContent = JSON.stringify(tokens, null, 2);

    const ast = parseProgram(tokens);
    panes.ast.textContent = JSON.stringify(ast, null, 2);

    const runtime = createRuntime({
      onOutput: (s) => {
        panes.runtime.textContent += String(s);
      },
      isStopRequested: () => stopRequested,
      readInput: (promptText) => {
        const label = typeof promptText === "string" && promptText.trim() ? promptText : "Enter a value:";
        return window.prompt(label);
      },
    });

    statusLeft.textContent = "Running...";
    const interpreter = new Interpreter({
      runtime,
      onError: (e) => {
        throw e;
      },
    });

    await interpreter.execute(ast);

    const end = performance.now();
    statusLeft.textContent = "Done";
    statusRight.textContent = "ok";

    const mem = performance.memory?.usedJSHeapSize
      ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + " MB"
      : "-";

    document.getElementById("timeMetric").textContent =
      `${Math.round((end - start) * 10) / 10} ms`;
    document.getElementById("memMetric").textContent = mem;
  } catch (e) {
    if (myToken !== runToken) return;
    statusLeft.textContent = "Error";
    statusRight.textContent = "failed";
    setPane("errors", formatError(e));
    document.getElementById("timeMetric").textContent = "—";
    document.getElementById("memMetric").textContent = "—";

    document.querySelector('.tab[data-tab="errors"]')?.click();
  }
}

runBtn.addEventListener("click", runProgram);
codeInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || !e.shiftKey || e.defaultPrevented) return;
  e.preventDefault();
  runProgram();
});
stopBtn.addEventListener("click", () => {
  stopRequested = true;
  statusLeft.textContent = "Stopping...";
});

clearBtn.addEventListener("click", () => {
  clearOutput();
  panes.runtime.textContent = "";
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([codeInput.value], {
    type: "text/plain;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bhai-bhai.bb";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
});

uploadInput.addEventListener("change", async () => {
  const file = uploadInput.files?.[0];
  if (!file) return;
  codeInput.value = await file.text();
  syncGutter();
  renderSyntax();
  statusLeft.textContent = "Loaded";
});

// A guide example can be opened in the IDE through session storage.
const guideSource = sessionStorage.getItem("bhai-bhai:guide-source");
if (guideSource) {
  codeInput.value = guideSource;
  sessionStorage.removeItem("bhai-bhai:guide-source");
} else {
  codeInput.value = `// Bhai Bhai Suru kor\n\ndhoro x = 10\n\ndekhaw("Hello from Bhai Bhai")\n\nBhai (x > 5) {\n  dekhaw("x is greater than 5")\n} Nahole {\n  dekhaw("x is small")\n}\n`;
}

syncGutter();
renderSyntax();
