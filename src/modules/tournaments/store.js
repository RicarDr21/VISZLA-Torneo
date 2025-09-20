const tournaments = new Map();

module.exports = {
  get(id) { return tournaments.get(id); },
  set(id, data) { tournaments.set(id, data); },
  delete(id) { tournaments.delete(id); },
  has(id) { return tournaments.has(id); },
  all() { return Array.from(tournaments.values()); }
};
