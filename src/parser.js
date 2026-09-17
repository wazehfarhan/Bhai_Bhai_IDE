import { BhaiBhaiError } from "./errors.js";
import {
  Program,
  BlockStatement,
  VariableDeclaration,
  AssignmentExpression,
  IfStatement,
  ForStatement,
  WhileStatement,
  FunctionDeclaration,
  CallExpression,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  BinaryExpression,
  UnaryExpression,
  Identifier,
  Literal,
  ExpressionStatement,
  ArrayLiteral,
  ObjectLiteral,
} from "./ast.js";

function tokenToLoc(tok) {
  return tok?.location;
}

const PRECEDENCE = {
  "||": 1,
  "&&": 2,
  "==": 3,
  "!=": 3,
  ">": 4,
  "<": 4,
  ">=": 4,
  "<=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
  "^": 7,
};

function isAssignmentOperator(op) {
  return op === "=";
}

export function parseProgram(tokens) {
  const p = new Parser(tokens);
  return p.parse();
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.i = 0;
  }

  peek(n = 0) {
    return this.tokens[this.i + n] ?? this.tokens[this.tokens.length - 1];
  }

  at(type, value = undefined, n = 0) {
    const t = this.peek(n);
    if (!t) return false;
    if (t.type !== type) return false;
    if (value !== undefined && t.value !== value) return false;
    return true;
  }

  consume(type, value = undefined, message = "Unexpected token") {
    const t = this.peek();
    if (!t || t.type !== type || (value !== undefined && t.value !== value)) {
      throw new BhaiBhaiError(message, {
        kind: "UnexpectedToken",
        location: tokenToLoc(t),
      });
    }
    this.i++;
    return t;
  }

  match(type, value = undefined) {
    const t = this.peek();
    if (!t || t.type !== type) return null;
    if (value !== undefined && t.value !== value) return null;
    this.i++;
    return t;
  }

  parse() {
    const body = [];
    while (!this.at("EOF")) {
      if (this.at("Comment")) {
        this.i++;
        continue;
      }
      body.push(this.parseStatement());
    }
    return Program(body);
  }

  parseStatement() {
    if (this.at("Comment")) {
      this.i++;
      return null;
    }

    // block
    if (this.at("Punctuation", "{")) {
      return this.parseBlock();
    }

    // keywords
    const t = this.peek();
    if (this.at("Keyword", "dhoro")) return this.parseVariableDeclaration();
    if (this.at("Keyword", "Bhai")) return this.parseIf();
    if (this.at("Keyword", "Nahole")) return this.parseElseStandalone();
    if (this.at("Keyword", "hobe")) return this.parseFor();
    if (this.at("Keyword", "jotokhun")) return this.parseWhile();
    if (this.at("Keyword", "kaj")) return this.parseFunctionDeclaration();
    if (this.at("Keyword", "ferot")) return this.parseReturn();
    if (this.at("Keyword", "tham")) return this.parseBreak();
    if (this.at("Keyword", "chol")) return this.parseContinue();

    // expression statement
    const expr = this.parseExpression();
    // optional semicolon
    this.match("Punctuation", ";");
    return ExpressionStatement(expr);
  }

  parseElseStandalone() {
    throw new BhaiBhaiError("Nahole Bhai without matching Bhai", {
      kind: "SyntaxError",
      location: tokenToLoc(this.peek()),
    });
  }

  parseBlock() {
    this.consume("Punctuation", "{", "Expected {");
    const body = [];
    while (!this.at("Punctuation", "}") && !this.at("EOF")) {
      if (this.at("Comment")) {
        this.i++;
        continue;
      }
      body.push(this.parseStatement());
    }
    this.consume("Punctuation", "}", "Expected }");
    return BlockStatement(body);
  }

  parseVariableDeclaration() {
    this.consume("Keyword", "dhoro");
    const id = this.consume(
      "Identifier",
      undefined,
      "Expected identifier",
    ).value;
    let initializer = null;
    if (this.match("Operator", "=")) {
      initializer = this.parseExpression();
    }
    this.match("Punctuation", ";");
    return VariableDeclaration(Identifier(id), initializer);
  }

  parseIf() {
    this.consume("Keyword", "Bhai");
    // condition in parentheses or directly
    let condition;
    if (this.match("Punctuation", "(")) {
      condition = this.parseExpression();
      this.consume("Punctuation", ")", "Expected )");
    } else {
      condition = this.parseExpression();
    }
    const thenBranch = this.parseBlockOrSingle();

    let elseBranch = null;
    if (this.at("Keyword", "Nahole")) {
      this.consume("Keyword", "Nahole");
      elseBranch = this.parseBlockOrSingle();
    }
    return IfStatement(condition, thenBranch, elseBranch);
  }

  parseBlockOrSingle() {
    if (this.at("Punctuation", "{")) return this.parseBlock();
    // allow single statement without braces
    return this.parseStatement();
  }

  parseWhile() {
    this.consume("Keyword", "jotokhun");
    let condition;
    if (this.match("Punctuation", "(")) {
      condition = this.parseExpression();
      this.consume("Punctuation", ")", "Expected )");
    } else {
      condition = this.parseExpression();
    }
    const body = this.parseBlockOrSingle();
    return WhileStatement(condition, body);
  }

  parseFor() {
    this.consume("Keyword", "hobe");
    // support: hobe Kotokhun Bhai ( init ; cond ; update ) {body}
    if (this.at("Keyword", "Kotokhun")) this.consume("Keyword", "Kotokhun");
    if (this.at("Keyword", "Bhai")) this.consume("Keyword", "Bhai");

    this.consume("Punctuation", "(", "Expected ( after for");
    let init = null;
    if (!this.at("Punctuation", ";")) init = this.parseForInit();
    this.consume("Punctuation", ";", "Expected ; in for");
    const condition = this.at("Punctuation", ";")
      ? Literal(true)
      : this.parseExpression();
    this.consume("Punctuation", ";", "Expected ; in for");
    const update = this.at("Punctuation", ")") ? null : this.parseExpression();
    this.consume("Punctuation", ")", "Expected )");

    const body = this.parseBlockOrSingle();
    return ForStatement(init, condition, update, body);
  }

  parseForInit() {
    if (this.at("Keyword", "dhoro")) {
      // The semicolon belongs to the enclosing for-loop grammar, not the
      // declaration. parseVariableDeclaration() would consume it optionally.
      this.consume("Keyword", "dhoro");
      const id = this.consume(
        "Identifier",
        undefined,
        "Expected identifier",
      ).value;
      let initializer = null;
      if (this.match("Operator", "=")) initializer = this.parseExpression();
      return VariableDeclaration(Identifier(id), initializer);
    }
    const expr = this.parseExpression();
    return ExpressionStatement(expr);
  }

  parseFunctionDeclaration() {
    this.consume("Keyword", "kaj");
    const name = this.consume(
      "Identifier",
      undefined,
      "Expected function name",
    ).value;
    const params = [];
    this.consume("Punctuation", "(", "Expected ( after function name");
    if (!this.at("Punctuation", ")")) {
      do {
        const p = this.consume("Identifier").value;
        params.push(p);
      } while (this.match("Punctuation", ","));
    }
    this.consume("Punctuation", ")", "Expected ) after params");

    const body = this.parseBlock();
    return FunctionDeclaration(Identifier(name), params, body);
  }

  parseReturn() {
    this.consume("Keyword", "ferot");
    // allow ferot dao
    let argument = null;
    if (
      this.at("Punctuation", ";") ||
      this.at("Punctuation", "}") ||
      this.at("EOF")
    ) {
      argument = null;
    } else {
      argument = this.parseExpression();
    }
    this.match("Punctuation", ";");
    return ReturnStatement(argument);
  }

  parseBreak() {
    this.consume("Keyword", "tham");
    this.match("Punctuation", ";");
    return BreakStatement();
  }

  parseContinue() {
    this.consume("Keyword", "chol");
    this.match("Punctuation", ";");
    return ContinueStatement();
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const expr = this.parseLogicalOr();
    if (this.at("Operator", "=")) {
      const op = this.consume("Operator", "=").value;
      // only identifier assignment for now
      if (expr.type !== "Identifier") {
        throw new BhaiBhaiError("Invalid assignment target", {
          kind: "SyntaxError",
          location: tokenToLoc(this.peek()),
        });
      }
      const value = this.parseExpression();
      return AssignmentExpression(expr, value);
    }
    return expr;
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.at("Operator", "||")) {
      const op = this.consume("Operator", "||").value;
      const right = this.parseLogicalAnd();
      left = BinaryExpression(left, op, right);
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();
    while (this.at("Operator", "&&")) {
      const op = this.consume("Operator", "&&").value;
      const right = this.parseEquality();
      left = BinaryExpression(left, op, right);
    }
    return left;
  }

  parseEquality() {
    let left = this.parseComparison();
    while (
      this.at("Operator", "==") ||
      this.at("Operator", "!=") ||
      this.at("Operator", "===") ||
      this.at("Operator", "!==")
    ) {
      const op = this.peek().value;
      this.i++;
      const right = this.parseComparison();
      left = BinaryExpression(left, op, right);
    }
    return left;
  }

  parseComparison() {
    let left = this.parseTerm();
    while ([">", "<", ">=", "<="].includes(this.peek().value)) {
      const op = this.peek().value;
      this.i++;
      const right = this.parseTerm();
      left = BinaryExpression(left, op, right);
    }
    return left;
  }

  parseTerm() {
    let left = this.parseFactor();
    while (this.at("Operator", "+") || this.at("Operator", "-")) {
      const op = this.peek().value;
      this.i++;
      const right = this.parseFactor();
      left = BinaryExpression(left, op, right);
    }
    return left;
  }

  parseFactor() {
    let left = this.parsePower();
    while (
      this.at("Operator", "*") ||
      this.at("Operator", "/") ||
      this.at("Operator", "%")
    ) {
      const op = this.peek().value;
      this.i++;
      const right = this.parsePower();
      left = BinaryExpression(left, op, right);
    }
    return left;
  }

  parsePower() {
    let left = this.parseUnary();
    // right associative for ^
    if (this.at("Operator", "^")) {
      const op = this.consume("Operator", "^").value;
      const right = this.parsePower();
      left = BinaryExpression(left, op, right);
    }
    return left;
  }

  parseUnary() {
    if (this.at("Operator", "!") || this.at("Operator", "-")) {
      const op = this.peek().value;
      this.i++;
      const arg = this.parseUnary();
      return UnaryExpression(op, arg);
    }
    return this.parseCall();
  }

  parseCall() {
    let expr = this.parsePrimary();
    while (this.at("Punctuation", "(")) {
      this.consume("Punctuation", "(");
      const args = [];
      if (!this.at("Punctuation", ")")) {
        do {
          args.push(this.parseExpression());
        } while (this.match("Punctuation", ","));
      }
      this.consume("Punctuation", ")", "Expected ) after call args");
      expr = CallExpression(expr, args);
    }
    return expr;
  }

  parseArray() {
    this.consume("Punctuation", "[");
    const elements = [];
    if (!this.at("Punctuation", "]")) {
      do {
        elements.push(this.parseExpression());
      } while (this.match("Punctuation", ","));
    }
    this.consume("Punctuation", "]");
    return ArrayLiteral(elements);
  }

  parseObject() {
    this.consume("Punctuation", "{");
    const pairs = [];
    if (!this.at("Punctuation", "}")) {
      do {
        const keyTok = this.peek();
        let key;
        if (keyTok.type === "Identifier") {
          key = this.consume("Identifier").value;
        } else if (keyTok.type === "String") {
          key = this.consume("String").value;
        } else {
          throw new BhaiBhaiError("Expected object key", {
            kind: "SyntaxError",
            location: tokenToLoc(keyTok),
          });
        }
        this.consume("Operator", ":", "Expected : after key");
        const value = this.parseExpression();
        pairs.push({ key, value });
      } while (this.match("Punctuation", ","));
    }
    this.consume("Punctuation", "}");
    return ObjectLiteral(pairs);
  }

  parsePrimary() {
    const t = this.peek();

    if (this.match("Punctuation", "(")) {
      const expr = this.parseExpression();
      this.consume("Punctuation", ")", "Expected )");
      return expr;
    }

    if (this.at("Number")) {
      const tok = this.consume("Number");
      return Literal(tok.value);
    }
    if (this.at("String")) {
      const tok = this.consume("String");
      return Literal(tok.value);
    }
    if (this.at("Boolean")) {
      const tok = this.consume("Boolean");
      return Literal(tok.value);
    }
    if (this.at("Null")) {
      this.i++;
      return Literal(null);
    }

    if (this.at("Keyword", "true") || this.at("Keyword", "false") || this.at("Keyword", "null")) {
      const tok = this.consume("Keyword");
      if (tok.value === "true") return Literal(true);
      if (tok.value === "false") return Literal(false);
      return Literal(null);
    }

    if (this.at("Identifier")) {
      const tok = this.consume("Identifier");
      return Identifier(tok.value);
    }

    if (this.at("Punctuation", "[")) return this.parseArray();
    if (this.at("Punctuation", "{")) return this.parseObject();

    throw new BhaiBhaiError("Unexpected token in expression", {
      kind: "SyntaxError",
      location: tokenToLoc(t),
    });
  }
}
