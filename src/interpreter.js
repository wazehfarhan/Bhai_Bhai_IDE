import { BhaiBhaiError } from "./errors.js";
import { Environment } from "./environment.js";

function truthy(v) {
  return !!v;
}

class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

export class Interpreter {
  constructor({ runtime, onError }) {
    this.runtime = runtime;
    this.onError = onError || (() => {});
    this.loopDepth = 0;
    this.functionDepth = 0;
  }

  async execute(ast) {
    const env = this.runtime.global;
    try {
      const res = this.execBlock(ast.body, env);
      return res;
    } catch (e) {
      this.onError(e);
      throw e;
    }
  }

  execBlock(statements, env) {
    let last = null;
    for (const st of statements) {
      this.runtime.checkStop?.();
      const r = this.execStatement(st, env);
      if (r instanceof ReturnSignal) return r;
      last = r;
      // break/continue are handled via signals
      if (r && r.kind === "break") return r;
      if (r && r.kind === "continue") return r;
    }
    return last;
  }

  execStatement(node, env) {
    switch (node.type) {
      case "BlockStatement": {
        const blockEnv = new Environment(env);
        return this.execBlock(node.body, blockEnv);
      }
      case "VariableDeclaration": {
        const init = node.initializer
          ? this.evalExpr(node.initializer, env)
          : null;
        env.define(node.identifier.name, init);
        return init;
      }
      case "ExpressionStatement": {
        return this.evalExpr(node.expression, env);
      }
      case "IfStatement": {
        const cond = this.evalExpr(node.condition, env);
        if (truthy(cond)) {
          return this.execStatement(node.thenBranch, env);
        }
        if (node.elseBranch) return this.execStatement(node.elseBranch, env);
        return null;
      }
      case "WhileStatement": {
        while (truthy(this.evalExpr(node.condition, env))) {
          this.runtime.checkStop?.();
          this.loopDepth++;
          let r;
          try {
            r = this.execStatement(node.body, env);
          } finally {
            this.loopDepth--;
          }
          if (r instanceof ReturnSignal) return r;
          if (r && r.kind === "break") break;
          if (r && r.kind === "continue") continue;
        }
        return null;
      }
      case "ForStatement": {
        const forEnv = new Environment(env);
        if (node.init) {
          // init is either VariableDeclaration or ExpressionStatement
          if (node.init.type === "VariableDeclaration")
            this.execStatement(node.init, forEnv);
          else this.execStatement(node.init, forEnv);
        }
        while (truthy(this.evalExpr(node.condition, forEnv))) {
          this.runtime.checkStop?.();
          this.loopDepth++;
          let r;
          try {
            r = this.execStatement(node.body, forEnv);
          } finally {
            this.loopDepth--;
          }
          if (r instanceof ReturnSignal) return r;
          if (r && r.kind === "break") break;
          if (r && r.kind === "continue") {
            if (node.update) this.evalExpr(node.update, forEnv);
            continue;
          }
          if (node.update) this.evalExpr(node.update, forEnv);
        }
        return null;
      }
      case "FunctionDeclaration": {
        const fn = {
          type: "function",
          name: node.name.name,
          params: node.params,
          body: node.body,
          closure: env,
        };
        env.define(fn.name, fn);
        return fn;
      }
      case "ReturnStatement": {
        if (this.functionDepth === 0) {
          throw new BhaiBhaiError("ferot can only be used inside a function", {
            kind: "RuntimeError",
          });
        }
        const val = node.argument ? this.evalExpr(node.argument, env) : null;
        return new ReturnSignal(val);
      }
      case "BreakStatement":
        if (this.loopDepth === 0) {
          throw new BhaiBhaiError("tham can only be used inside a loop", {
            kind: "RuntimeError",
          });
        }
        return { kind: "break" };
      case "ContinueStatement":
        if (this.loopDepth === 0) {
          throw new BhaiBhaiError("chol can only be used inside a loop", {
            kind: "RuntimeError",
          });
        }
        return { kind: "continue" };
      default:
        throw new BhaiBhaiError(`Unknown statement: ${node.type}`, {
          kind: "RuntimeError",
        });
    }
  }

  evalExpr(node, env) {
    switch (node.type) {
      case "Literal":
        return node.value;
      case "Identifier": {
        const v = env.get(node.name);
        if (v === undefined) {
          throw new BhaiBhaiError(`Undefined variable ${node.name}`, {
            kind: "UndefinedVariable",
          });
        }
        return v;
      }
      case "AssignmentExpression": {
        const value = this.evalExpr(node.value, env);
        if (!env.assign(node.target.name, value)) {
          throw new BhaiBhaiError(`Undefined variable ${node.target.name}`, {
            kind: "UndefinedVariable",
          });
        }
        return value;
      }
      case "BinaryExpression": {
        const left = this.evalExpr(node.left, env);
        if (node.operator === "&&" && !truthy(left)) return false;
        if (node.operator === "||" && truthy(left)) return true;
        const right = this.evalExpr(node.right, env);
        return this.applyBinary(node.operator, left, right, node);
      }
      case "UnaryExpression": {
        const arg = this.evalExpr(node.argument, env);
        if (node.operator === "!") return !truthy(arg);
        if (node.operator === "-") return -Number(arg);
        throw new BhaiBhaiError("Unknown unary operator", {
          kind: "RuntimeError",
        });
      }
      case "UpdateExpression": {
        const name = node.argument.name;
        const previous = env.get(name);
        if (previous === undefined) {
          throw new BhaiBhaiError(`Undefined variable ${name}`, {
            kind: "UndefinedVariable",
          });
        }
        const next = Number(previous) + (node.operator === "++" ? 1 : -1);
        if (!env.assign(name, next)) {
          throw new BhaiBhaiError(`Undefined variable ${name}`, {
            kind: "UndefinedVariable",
          });
        }
        return node.prefix ? next : previous;
      }
      case "CallExpression": {
        const callee = this.evalExpr(node.callee, env);
        if (!callee)
          throw new BhaiBhaiError("Call target not found", {
            kind: "RuntimeError",
          });
        const args = node.args.map((a) => this.evalExpr(a, env));
        return this.callFunction(callee, args, node);
      }
      case "ArrayLiteral":
        return node.elements.map((e) => this.evalExpr(e, env));
      case "ObjectLiteral": {
        const object = {};
        for (const pair of node.pairs) {
          // Defining an own property avoids JavaScript's special `__proto__`
          // setter and preserves every valid language-level object key.
          Object.defineProperty(object, pair.key, {
            value: this.evalExpr(pair.value, env),
            enumerable: true,
            configurable: true,
            writable: true,
          });
        }
        return object;
      }
      default:
        throw new BhaiBhaiError(`Unknown expression: ${node.type}`, {
          kind: "RuntimeError",
        });
    }
  }

  callFunction(fn, args) {
    if (fn.type === "builtin") {
      const minArgs = fn.minArgs ?? fn.arity ?? 0;
      const maxArgs = fn.maxArgs ?? fn.arity ?? minArgs;
      if (args.length < minArgs || args.length > maxArgs) {
        const expected = minArgs === maxArgs
          ? `Expected ${minArgs} argument${minArgs === 1 ? "" : "s"}`
          : `Expected between ${minArgs} and ${maxArgs} arguments`;
        throw new BhaiBhaiError(`${expected}, received ${args.length}`, {
          kind: "RuntimeError",
        });
      }
      return fn.call(args);
    }
    if (fn.type === "function") {
      const callEnv = new Environment(fn.closure);
      for (let i = 0; i < fn.params.length; i++) {
        callEnv.define(fn.params[i], args[i] ?? null);
      }
      const parentLoopDepth = this.loopDepth;
      this.functionDepth++;
      this.loopDepth = 0;
      let r;
      try {
        r = this.execStatement(fn.body, callEnv);
      } finally {
        this.loopDepth = parentLoopDepth;
        this.functionDepth--;
      }
      if (r instanceof ReturnSignal) return r.value;
      return null;
    }
    throw new BhaiBhaiError("Not callable", { kind: "RuntimeError" });
  }

  applyBinary(op, a, b) {
    switch (op) {
      case "+":
        // allow string concat
        if (typeof a === "string" || typeof b === "string")
          return String(a) + String(b);
        return Number(a) + Number(b);
      case "-":
        return Number(a) - Number(b);
      case "*":
        return Number(a) * Number(b);
      case "/": {
        const denom = Number(b);
        if (denom === 0)
          throw new BhaiBhaiError("Division by zero", {
            kind: "DivisionByZero",
          });
        return Number(a) / denom;
      }
      case "%":
        return Number(a) % Number(b);
      case "^":
        return Math.pow(Number(a), Number(b));
      case "==":
        return a === b;
      case "!=":
        return a !== b;
      case "===":
        return a === b;
      case "!==":
        return a !== b;
      case ">":
        return Number(a) > Number(b);
      case "<":
        return Number(a) < Number(b);
      case ">=":
        return Number(a) >= Number(b);
      case "<=":
        return Number(a) <= Number(b);
      case "&&":
        return truthy(a) && truthy(b);
      case "||":
        return truthy(a) || truthy(b);
      default:
        throw new BhaiBhaiError(`Unknown operator ${op}`, {
          kind: "RuntimeError",
        });
    }
  }
}
