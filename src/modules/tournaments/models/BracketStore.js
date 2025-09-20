class BracketStore {
  constructor() { this.map = new Map(); }
  set(id, data) { this.map.set(id, data); }
  get(id) { return this.map.get(id); }
  has(id) { return this.map.has(id); }
  delete(id) { this.map.delete(id); }
}
module.exports = new BracketStore();
