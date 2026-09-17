export class Environment {
  constructor(parent = null) {
    this.parent = parent;
    this.values = new Map();
  }

  define(name, value) {
    this.values.set(name, value);
  }

  has(name) {
    if (this.values.has(name)) return true;
    return this.parent ? this.parent.has(name) : false;
  }

  get(name) {
    if (this.values.has(name)) return this.values.get(name);
    if (this.parent) return this.parent.get(name);
    return undefined;
  }

  assign(name, value) {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return true;
    }
    if (this.parent) return this.parent.assign(name, value);
    return false;
  }
}
