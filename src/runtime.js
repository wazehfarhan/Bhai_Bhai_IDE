import { Environment } from "./environment.js";
import { BhaiBhaiError } from "./errors.js";

function readStdinFallback() {
  if (typeof process === "undefined" || !process.versions?.node) {
    return null;
  }

  try {
    const nodeFs = typeof require === "function" ? require("node:fs") : null;
    if (!nodeFs || typeof nodeFs.readFileSync !== "function") {
      return null;
    }

    const incoming = nodeFs.readFileSync(0, "utf8");
    const line = incoming.split(/\r?\n/).find((value) => value.trim() !== "");
    return line ?? "";
  } catch {
    return null;
  }
}

function defaultReadInput(promptText = "") {
  if (typeof window !== "undefined" && typeof window.prompt === "function") {
    return window.prompt(promptText || "Enter a value:");
  }

  return readStdinFallback();
}

function normalizeInputValue(raw) {
  if (raw === null || raw === undefined) return "";
  const text = String(raw).trim();
  if (text === "") return "";

  const asNumber = Number(text);
  if (Number.isFinite(asNumber) && !/[A-Za-z]/.test(text)) {
    return asNumber;
  }

  return text;
}

function formatOutputValue(value) {
  if (value === true) return "sotti";
  if (value === false) return "mittha";
  return String(value);
}

export function createRuntime({ onOutput, isStopRequested, maxSteps = 100000, readInput = defaultReadInput }) {
  const global = new Environment(null);
  let steps = 0;
  const inputBuiltin = {
    type: "builtin",
    minArgs: 0,
    maxArgs: 1,
    call: ([promptText = ""]) => {
      const answer = readInput?.(typeof promptText === "string" ? promptText : "");
      return normalizeInputValue(answer);
    },
  };

  function checkStop() {
    steps++;
    if (steps > maxSteps) {
      throw new BhaiBhaiError("Execution step limit exceeded", {
        kind: "RuntimeError",
      });
    }
    if (isStopRequested?.()) {
      throw new BhaiBhaiError("Execution stopped by user", {
        kind: "RuntimeError",
      });
    }
  }

  const builtins = {
    // dekhaw(x) -> output
    dekhaw: {
      type: "builtin",
      arity: 1,
      call: (args) => {
        const v = args[0];
        onOutput(formatOutputValue(v) + "\n");
        return null;
      },
    },
    naw: {
      type: "builtin",
      arity: 0,
      call: () => {
        return 0;
      },
    },
    input: inputBuiltin,
    neo: inputBuiltin,
    length: {
      type: "builtin",
      arity: 1,
      call: ([v]) => {
        if (v == null) return 0;
        if (typeof v === "string" || Array.isArray(v)) return v.length;
        if (typeof v === "object") return Object.keys(v).length;
        return 0;
      },
    },
    push: {
      type: "builtin",
      arity: 2,
      call: ([arr, x]) => {
        if (!Array.isArray(arr))
          throw new BhaiBhaiError("push expects Array", {
            kind: "RuntimeError",
          });
        arr.push(x);
        return arr.length;
      },
    },
    pop: {
      type: "builtin",
      arity: 1,
      call: ([arr]) => {
        if (!Array.isArray(arr))
          throw new BhaiBhaiError("pop expects Array", {
            kind: "RuntimeError",
          });
        return arr.pop();
      },
    },
    random: {
      type: "builtin",
      arity: 0,
      call: () => Math.random(),
    },
    sqrt: { type: "builtin", arity: 1, call: ([x]) => Math.sqrt(Number(x)) },
    abs: { type: "builtin", arity: 1, call: ([x]) => Math.abs(Number(x)) },
    min: {
      type: "builtin",
      arity: 2,
      call: ([a, b]) => Math.min(Number(a), Number(b)),
    },
    max: {
      type: "builtin",
      arity: 2,
      call: ([a, b]) => Math.max(Number(a), Number(b)),
    },
    time: { type: "builtin", arity: 0, call: () => Date.now() },
  };

  for (const [name, fn] of Object.entries(builtins)) {
    global.define(name, fn);
  }

  return {
    global,
    checkStop,
    builtins,
  };
}
