export class BhaiBhaiError extends Error {
  /**
   * @param {string} message
   * @param {{kind?:string, location?:{line:number,col:number,offset?:number}, details?:any}} opts
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "BhaiBhaiError";
    this.kind = opts.kind || "Error";
    this.location = opts.location;
    this.details = opts.details;
  }
}

export function locToText(location) {
  if (!location) return "";
  const { line, col } = location;
  return `লাইন ${line}, কলাম ${col}`;
}

function bengaliToken(kind) {
  const map = {
    SyntaxError: "Syntax Error",
    UnexpectedToken: "Unexpected token",
    UnknownKeyword: "Unknown keyword",
    UndefinedVariable: "Undefined variable",
    DivisionByZero: "Division by zero",
    RuntimeError: "Runtime error",
  };
  return map[kind] || kind;
}

export function formatBengaliError(err) {
  if (err instanceof BhaiBhaiError) {
    const loc = err.location ? `\n${locToText(err.location)}` : "";
    return `${bengaliToken(err.kind)}${loc}\n${err.message}`;
  }
  return String(err);
}
