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
          const r = this.execStatement(node.body, env);
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
          const r = this.execStatement(node.body, forEnv);
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
        const val = node.argument ? this.evalExpr(node.argument, env) : null;
        return new ReturnSignal(val);
      }
      case "BreakStatement":
        return { kind: "break" };
      case "ContinueStatement":
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
      default:
        throw new BhaiBhaiError(`Unknown expression: ${node.type}`, {
          kind: "RuntimeError",
        });
    }
  }

  callFunction(fn, args) {
    if (fn.type === "builtin") {
      return fn.call(args);
    }
    if (fn.type === "function") {
      const callEnv = new Environment(fn.closure);
      for (let i = 0; i < fn.params.length; i++) {
        callEnv.define(fn.params[i], args[i] ?? null);
      }
      const r = this.execStatement(fn.body, callEnv);
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
