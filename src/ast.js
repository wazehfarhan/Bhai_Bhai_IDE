export function Program(body) {
  return { type: "Program", body };
}

export function BlockStatement(body) {
  return { type: "BlockStatement", body };
}

export function VariableDeclaration(identifier, initializer) {
  return { type: "VariableDeclaration", identifier, initializer };
}

export function AssignmentExpression(target, value) {
  return { type: "AssignmentExpression", target, value };
}

export function IfStatement(condition, thenBranch, elseBranch) {
  return { type: "IfStatement", condition, thenBranch, elseBranch };
}

export function ForStatement(init, condition, update, body) {
  return { type: "ForStatement", init, condition, update, body };
}

export function WhileStatement(condition, body) {
  return { type: "WhileStatement", condition, body };
}

export function FunctionDeclaration(name, params, body) {
  return { type: "FunctionDeclaration", name, params, body };
}

export function CallExpression(callee, args) {
  return { type: "CallExpression", callee, args };
}

export function ReturnStatement(argument) {
  return { type: "ReturnStatement", argument };
}

export function BreakStatement() {
  return { type: "BreakStatement" };
}

export function ContinueStatement() {
  return { type: "ContinueStatement" };
}

export function BinaryExpression(left, operator, right) {
  return { type: "BinaryExpression", left, operator, right };
}

export function UnaryExpression(operator, argument) {
  return { type: "UnaryExpression", operator, argument };
}

export function Identifier(name) {
  return { type: "Identifier", name };
}

export function Literal(value) {
  return { type: "Literal", value };
}

export function ExpressionStatement(expression) {
  return { type: "ExpressionStatement", expression };
}

export function ArrayLiteral(elements) {
  return { type: "ArrayLiteral", elements };
}

export function ObjectLiteral(pairs) {
  return { type: "ObjectLiteral", pairs };
}
