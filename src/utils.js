export function isAlpha(ch) {
  return /[A-Za-z_]/.test(ch);
}

export function isAlphaNumeric(ch) {
  return /[A-Za-z0-9_]/.test(ch);
}

export function isDigit(ch) {
  return /[0-9]/.test(ch);
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
