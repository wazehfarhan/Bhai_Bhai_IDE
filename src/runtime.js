import { Environment } from "./environment.js";
import { BhaiBhaiError } from "./errors.js";

export function createRuntime({ onOutput, isStopRequested }) {
  const global = new Environment(null);

  function checkStop() {
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
        onOutput(String(v) + "\n");
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
