/**
 * src/modules/tournaments/controllers/tournamentController.js
 */
const { TournamentStore, setScoreAndPropagate, toFinalShape } = require("../store/TournamentStore");
const store = TournamentStore.getInstance();

exports.deleteSeed = (req, res) => {
  const { id } = req.params;
  store.delete(id);
  return res.status(200).json({ ok: true, id });
};

exports.postSeed = (req, res) => {
  const { id } = req.params;
  const { name = id, type = "single", shuffle = false, teams = [] } = req.body || {};

  if (type !== "single") {
    return res.status(400).json({ error: "Solo se soporta type: 'single' por ahora." });
  }
  if (!Array.isArray(teams) || teams.length < 2) {
    return res.status(400).json({ error: "teams debe ser un arreglo con al menos 2 nombres." });
  }

  const payload = store.buildSingleElimination(id, name, teams, { shuffle });
  return res.status(201).json({ ok: true, id, name: payload.name, type: payload.type, teams: payload.teams, pid: process.pid });
};

exports.getBracket = (req, res) => {
  const { id } = req.params;
  const t = store.get(id);
  if (!t) return res.status(404).json({ error: "Torneo no encontrado", pid: process.pid, keys: Array.from(store.tournaments.keys()) });

  const final = toFinalShape(t.winners[t.winners.length - 1][0]);
  return res.status(200).json({
    winners: t.winners,
    final,
    pid: process.pid
  });
};

exports.postMatch = (req, res) => {
  const { id, matchId } = req.params;
  const { scoreA, scoreB } = req.body || {};
  const t = store.get(id);
  if (!t) return res.status(404).json({ error: "Torneo no encontrado" });

  const ok = setScoreAndPropagate(t.winners, matchId, Number(scoreA), Number(scoreB));
  if (!ok) return res.status(404).json({ error: "Match no encontrado" });

  // Persistir
  store.upsert(id, t);

  const final = toFinalShape(t.winners[t.winners.length - 1][0]);
  return res.status(200).json({
    ok: true,
    winners: t.winners,
    final,
  });
};

// DEBUG
exports.debug = (req, res) => {
  const keys = Array.from(store.tournaments.keys());
  const t = store.get(req.params.id);
  res.status(200).json({
    pid: process.pid,
    keys,
    hasId: store.tournaments.has(req.params.id),
    snapshot: t ? { id: t.id, name: t.name, type: t.type, teams: t.teams.length, rounds: t.winners.length } : null
  });
};
