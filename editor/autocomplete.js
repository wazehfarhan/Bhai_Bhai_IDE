const KEYWORDS = [
  "dhoro",
  "Bhai",
  "Nahole",
  "hobe",
  "Kotokhun",
  "jotokhun",
  "kaj",
  "ferot",
  "tham",
  "chol",
  "sotti",
  "mitha",
  "khali",
];

const BUILTINS = [
  "dekhaw",
  "naw",
  "input",
  "length",
  "push",
  "pop",
  "random",
  "sqrt",
  "abs",
  "min",
  "max",
  "time",
];

export function getAutocompleteItems(prefix) {
  if (!prefix || prefix.length < 1) return [];

  const pool = [...KEYWORDS, ...BUILTINS];
  return [...new Set(pool.filter((value) => value.startsWith(prefix) && value !== prefix))].slice(0, 8);
}

function getPrefixAtCaret(editor) {
  const upToCaret = editor.value.slice(0, editor.selectionStart);
  const match = upToCaret.match(
    /([A-Za-z_\u0980-\u09FF][A-Za-z0-9_\u0980-\u09FF]*)$/,
  );
  return match ? match[1] : "";
}

export function installAutocomplete({ editor, getSource, onRender }) {
  // Simple autocomplete popup.
  const box = document.createElement("div");
  box.style.position = "absolute";
  box.style.display = "none";
  box.style.zIndex = "50";
  box.style.background = "rgba(15,23,42,.95)";
  box.style.border = "1px solid rgba(148,163,184,.25)";
  box.style.borderRadius = "12px";
  box.style.padding = "8px";
  box.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";
  box.style.fontFamily =
    "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace";
  box.style.fontSize = "12px";
  box.style.color = "#e5e7eb";

  const list = document.createElement("div");
  box.appendChild(list);
  editor.parentElement.appendChild(box);

  const acceptedHint = document.getElementById("bracketHint");

  let items = [];
  let active = 0;
  let isComposing = false;

  function updateFromCaret() {
    const prefix = getPrefixAtCaret(editor);

    if (!prefix || prefix.length < 1) {
      hide();
      return;
    }

    items = getAutocompleteItems(prefix);

    if (items.length === 0) {
      hide();
      return;
    }

    active = 0;
    renderList(prefix);
    positionBox();
    show();
  }

  function renderList(prefix) {
    list.innerHTML = "";
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const row = document.createElement("div");
      row.style.padding = "6px 8px";
      row.style.borderRadius = "10px";
      row.style.cursor = "pointer";
      row.style.background =
        i === active ? "rgba(96,165,250,.15)" : "transparent";
      row.style.color = i === active ? "#e5e7eb" : "rgba(229,231,235,.9)";

      row.textContent = it;
      row.addEventListener("mouseover", () => {
        active = i;
        renderList(prefix);
      });
      row.addEventListener("mousedown", (e) => {
        e.preventDefault();
        apply(prefix, it);
      });
      list.appendChild(row);
    }
  }

  function positionBox() {
    // Keep the popup below and aligned to the caret. Placing it on the line
    // obscures the typed prefix (for example, the `d` before `dhoro`).
    const lineHeight = 20;
    const gutterWidth = 56;
    const before = editor.value.slice(0, editor.selectionStart);
    const currentLine = before.split("\n").pop() ?? "";
    const line = before.split("\n").length - 1;
    const tabSize = Number.parseInt(getComputedStyle(editor).tabSize, 10) || 2;
    const visualColumn = [...currentLine].reduce(
      (column, character) =>
        character === "\t" ? column + tabSize - (column % tabSize) : column + 1,
      0,
    );
    const characterWidth = parseFloat(getComputedStyle(editor).fontSize) * 0.602;
    const top = 12 + (line + 1) * lineHeight - editor.scrollTop;
    const left =
      gutterWidth + 14 + visualColumn * characterWidth - editor.scrollLeft;
    box.style.top = `${top}px`;
    box.style.left = `${left}px`;
  }

  function show() {
    box.style.display = "block";
  }
  function hide() {
    box.style.display = "none";
  }

  function apply(prefix, replacement) {
    const idx = editor.selectionStart;
    const start = idx - prefix.length;
    editor.value =
      editor.value.slice(0, start) + replacement + editor.value.slice(idx);
    editor.selectionStart = editor.selectionEnd = start + replacement.length;
    hide();
    clearAcceptedHint();
    onRender?.();
  }

  function clearAcceptedHint() {
    if (acceptedHint) {
      acceptedHint.textContent = "";
      acceptedHint.style.display = "none";
    }
  }

  editor.addEventListener("compositionstart", () => {
    isComposing = true;
    hide();
  });

  editor.addEventListener("compositionend", () => {
    isComposing = false;
    updateFromCaret();
  });

  editor.addEventListener("input", (e) => {
    if (isComposing) return;

    if (e.inputType.startsWith("delete")) {
      hide();
      clearAcceptedHint();
      return;
    }

    clearAcceptedHint();
    updateFromCaret();
  });

  // Some browsers and virtual keyboards insert a line break without a normal
  // keyboard event. Intercept it before the textarea changes so accepting a
  // suggestion always replaces the prefix instead of creating `he\nhello`.
  editor.addEventListener("beforeinput", (e) => {
    if (
      (e.inputType === "insertLineBreak" || e.inputType === "insertParagraph") &&
      box.style.display !== "none"
    ) {
      e.preventDefault();
      apply(getPrefixAtCaret(editor), items[active]);
    }
  });

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hide();
      return;
    }

    if (e.key === "ArrowDown" && box.style.display !== "none") {
      e.preventDefault();
      active = Math.min(items.length - 1, active + 1);
      renderList(getPrefixAtCaret(editor));
      return;
    }
    if (e.key === "ArrowUp" && box.style.display !== "none") {
      e.preventDefault();
      active = Math.max(0, active - 1);
      renderList(getPrefixAtCaret(editor));
      return;
    }
    if (e.key === "Enter" && box.style.display !== "none") {
      e.preventDefault();
      e.stopImmediatePropagation();
      apply(getPrefixAtCaret(editor), items[active]);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === " ") {
      e.preventDefault();
      updateFromCaret();
    }
    if (e.key === "Tab" && box.style.display !== "none") {
      e.preventDefault();
      apply(getPrefixAtCaret(editor), items[active]);
    }
  }, true);

  editor.addEventListener("cut", () => {
    hide();
    clearAcceptedHint();
  });
}
