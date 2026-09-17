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

  let items = [];
  let active = 0;

  function updateFromCaret() {
    const idx = editor.selectionStart;
    const upTo = editor.value.slice(0, idx);
    const m = upTo.match(/([A-Za-z_\u0980-\u09FF][A-Za-z0-9_\u0980-\u09FF]*)$/);
    const prefix = m ? m[1] : "";

    if (!prefix || prefix.length < 1) {
      hide();
      return;
    }

    const pool = [...KEYWORDS, ...BUILTINS];
    items = pool.filter((x) => x.startsWith(prefix)).slice(0, 8);

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
      row.textContent = it;
      row.style.padding = "6px 8px";
      row.style.borderRadius = "10px";
      row.style.cursor = "pointer";
      row.style.background =
        i === active ? "rgba(96,165,250,.15)" : "transparent";
      row.style.color = i === active ? "#e5e7eb" : "rgba(229,231,235,.9)";
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
    // Approx placement: based on scroll + caret line height.
    const lineHeight = 20;
    const gutterWidth = 56;
    const before = editor.value.slice(0, editor.selectionStart);
    const line = before.split("\n").length - 1;
    const top = 12 + line * lineHeight - editor.scrollTop;
    const left = gutterWidth + 14 - editor.scrollLeft;
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
    box.style.display = "none";
    onRender?.();
  }

  editor.addEventListener("keyup", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === " ") return;
    // show on letters / backspace
    if (e.key.length === 1 || e.key === "Backspace") updateFromCaret();
    if (e.key === "Escape") hide();
    if (e.key === "ArrowDown" && box.style.display !== "none") {
      active = Math.min(items.length - 1, active + 1);
      renderList(items[active]);
    }
    if (e.key === "ArrowUp" && box.style.display !== "none") {
      active = Math.max(0, active - 1);
      renderList(items[active]);
    }
    if (e.key === "Enter" && box.style.display !== "none") {
      // apply current
      const idx = editor.selectionStart;
      const upTo = editor.value.slice(0, idx);
      const m = upTo.match(
        /([A-Za-z_\u0980-\u09FF][A-Za-z0-9_\u0980-\u09FF]*)$/,
      );
      const prefix = m ? m[1] : "";
      apply(prefix, items[active]);
    }
  });

  editor.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === " ") {
      e.preventDefault();
      updateFromCaret();
    }
    if (e.key === "Tab" && box.style.display !== "none") {
      e.preventDefault();
      const idx = editor.selectionStart;
      const upTo = editor.value.slice(0, idx);
      const m = upTo.match(
        /([A-Za-z_\u0980-\u09FF][A-Za-z0-9_\u0980-\u09FF]*)$/,
      );
      const prefix = m ? m[1] : "";
      apply(prefix, items[active]);
    }
  });
}
