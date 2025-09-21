/**
 * src/modules/tournaments/controllers/tournamentController.js
 */
const { TournamentStore, setScoreAndPropagate, toFinalShape } = require("../store/TournamentStore");
const store = TournamentStore.getInstance();

/** ===== Seed/Bracket (existente) ===== */
exports.deleteSeed = (req, res) => {
  const { id } = req.params;
  store.delete(id);
  return res.status(200).json({ ok: true, id });
};

exports.postSeed = (req, res) => {
  const { id } = req.params;
  const { name = id, type = "single", shuffle = false, teams = [] } = req.body || {};
  if (type !== "single") return res.status(400).json({ error: "Solo se soporta type: 'single' por ahora." });
  if (!Array.isArray(teams) || teams.length < 2) return res.status(400).json({ error: "teams debe ser un arreglo con al menos 2 nombres." });
  const payload = store.buildSingleElimination(id, name, teams, { shuffle });
  return res.status(201).json({ ok: true, id, name: payload.name, type: payload.type, teams: payload.teams, pid: process.pid });
};

exports.getBracket = (req, res) => {
  const { id } = req.params;
  const t = store.get(id);
  if (!t) return res.status(404).json({ error: "Torneo no encontrado", pid: process.pid, keys: Array.from(store.tournaments.keys()) });
  const final = toFinalShape(t.winners[t.winners.length - 1][0]);
  return res.status(200).json({ winners: t.winners, final, pid: process.pid });
};

exports.postMatch = (req, res) => {
  const { id, matchId } = req.params;
  const { scoreA, scoreB } = req.body || {};
  const t = store.get(id);
  if (!t) return res.status(404).json({ error: "Torneo no encontrado" });
  const ok = setScoreAndPropagate(t.winners, matchId, Number(scoreA), Number(scoreB));
  if (!ok) return res.status(404).json({ error: "Match no encontrado" });
  store.upsert(id, t); // persistir
  const final = toFinalShape(t.winners[t.winners.length - 1][0]);
  return res.status(200).json({ ok: true, winners: t.winners, final });
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

/** ===== US-17: creación/publicación y listado de torneos (config en Mongo) ===== */
const Tournament = require("../models/Tournament");
const { notifyTournamentPublished } = require("../../../services/notifier");

async function _canCreateTournamentConfig() {
  const last = await Tournament.findOne({}).sort({ createdAt: -1 }).lean();
  if (!last) return { allowed: true, nextDate: null };
  const diffDays = (Date.now() - new Date(last.createdAt).getTime()) / (1000*60*60*24);
  const nextDate = new Date(new Date(last.createdAt).getTime() + 91*24*60*60*1000);
  return { allowed: diffDays >= 91, nextDate };
}

exports.listConfigs = async (_req, res) => {
  try {
    const list = await Tournament.find({}).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: list });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
};

exports.createConfig = async (req, res) => {
  try {
    const { allowed, nextDate } = await _canCreateTournamentConfig();
    if (!allowed) {
      return res.status(409).json({
        ok: false,
        message: `No se puede crear un nuevo torneo aún. Intente después de ${nextDate.toISOString().slice(0,10)} (regla 91 días).`
      });
    }

    const { name, startDate, endDate, conditions, rewards } = req.body || {};
    if (!name || !startDate || !endDate || !conditions || !rewards) {
      return res.status(400).json({ ok:false, message:"Faltan campos: name, startDate, endDate, conditions, rewards." });
    }
    const s = new Date(startDate), e = new Date(endDate);
    if (isNaN(s) || isNaN(e) || e <= s) {
      return res.status(400).json({ ok:false, message:"Rango de fechas inválido: endDate > startDate." });
    }

    const createdBy = (req.user && req.user.id) || "admin-demo";
    const doc = await Tournament.create({
      name: String(name).trim(),
      startDate: s, endDate: e,
      conditions: String(conditions).trim(),
      rewards: String(rewards).trim(),
      createdBy,
      status: "draft",
      registrationOpen: false
    });

    res.status(201).json({ ok:true, data: doc });
  } catch (e) {
    res.status(400).json({ ok:false, message: e.message });
  }
};

exports.publishConfig = async (req, res) => {
  try {
    const { mongoId } = req.params;
    const doc = await Tournament.findById(mongoId);
    if (!doc) return res.status(404).json({ ok:false, message:"Torneo no encontrado." });

    // Si no estaba publicado, publícalo; si ya estaba, deja los flags tal cual.
    if (doc.status !== "published") {
      doc.status = "published";
      doc.registrationOpen = true;
      await doc.save();
    }

    // 🔔 Notificar SIEMPRE (también en re-publicación) para generar/actualizar notifications.json
    await notifyTournamentPublished(doc);

    res.json({ ok:true, data: doc });
  } catch (e) {
    res.status(400).json({ ok:false, message: e.message });
  }
};

