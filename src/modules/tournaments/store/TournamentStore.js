/**
 * src/modules/tournaments/store/TournamentStore.js
 * Store en memoria (singleton) con persistencia ligera en %TEMP%.
 */
const fs = require("fs");
const path = require("path");

class TournamentStore {
  constructor() {
    this.tournaments = new Map();
    this.file = getPersistFile();
    this._loadFromDisk();
  }

  static getInstance() {
    if (!global.__VISZLA_TOURNAMENT_STORE__) {
      global.__VISZLA_TOURNAMENT_STORE__ = new TournamentStore();
    }
    return global.__VISZLA_TOURNAMENT_STORE__;
  }

  _loadFromDisk(){
    try{
      if (fs.existsSync(this.file)) {
        const raw = fs.readFileSync(this.file, "utf8");
        const obj = JSON.parse(raw);
        this.tournaments = new Map(Object.entries(obj || {}));
      }
    }catch(_e){ /* noop */ }
  }

  _saveToDisk(){
    try{
      const obj = Object.fromEntries(this.tournaments);
      fs.writeFileSync(this.file, JSON.stringify(obj), "utf8");
    }catch(_e){ /* noop */ }
  }

  upsert(id, data) {
    this.tournaments.set(id, data);
    this._saveToDisk();
  }

  get(id) {
    return this.tournaments.get(id);
  }

  delete(id) {
    this.tournaments.delete(id);
    this._saveToDisk();
  }

  // Construye bracket single-elimination
  buildSingleElimination(id, name, teams, opts = {}) {
    const shuffle = !!opts.shuffle;
    const cleanTeams = Array.from(
      new Set(
        (teams || [])
          .map(t => (typeof t === "string" ? t.trim() : ""))
          .filter(Boolean)
      )
    );
    if (shuffle) {
      for (let i = cleanTeams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cleanTeams[i], cleanTeams[j]] = [cleanTeams[j], cleanTeams[i]];
      }
    }

    const nextPow2 = n => 1 << Math.ceil(Math.log2(Math.max(1, n)));
    const size = nextPow2(cleanTeams.length);
    const byes = size - cleanTeams.length;
    const padded = cleanTeams.slice();
    for (let i = 0; i < byes; i++) padded.push(null); // null = BYE

    // Round 1
    const rounds = [];
    const r1 = [];
    for (let i = 0; i < size; i += 2) {
      const a = padded[i] ?? "BYE";
      const b = padded[i + 1] ?? "BYE";
      r1.push(makeMatch(1, r1.length + 1, a, b));
    }
    rounds.push(r1);

    // Rondas siguientes
    let prev = r1;
    let roundNum = 2;
    while (prev.length > 1) {
      const thisRound = [];
      for (let i = 0; i < prev.length; i += 2) {
        thisRound.push(makeMatch(roundNum, thisRound.length + 1, null, null));
      }
      rounds.push(thisRound);
      prev = thisRound;
      roundNum++;
    }

    // Winners automáticos por BYE en R1
    for (const m of r1) {
      if (m.a === "BYE" && m.b !== "BYE") {
        m.winner = m.b;
      } else if (m.b === "BYE" && m.a !== "BYE") {
        m.winner = m.a;
      } else if (m.a === "BYE" && m.b === "BYE") {
        m.winner = "BYE";
      }
    }
    propagate(rounds);

    const finalMatch = rounds[rounds.length - 1][0];
    const payload = {
      id,
      name,
      type: "single",
      teams: cleanTeams,
      winners: rounds,
      final: toFinalShape(finalMatch),
    };
    this.upsert(id, payload);
    return payload;
  }

  // Guardar tras cambios de marcador
  saveAfterUpdate(){
    this._saveToDisk();
  }
}

function getPersistFile(){
  const f = process.env.VISZLA_STORE || path.join(require("os").tmpdir(), "viszla-tournaments.json");
  return f;
}

function makeMatch(roundNum, matchNum, a, b) {
  return {
    id: `R${roundNum}M${matchNum}`,
    a: a ?? null,
    b: b ?? null,
    scoreA: null,
    scoreB: null,
    winner: null,
  };
}

function toFinalShape(m) {
  return {
    id: m.id,
    a: m.a ?? null,
    b: m.b ?? null,
    scoreA: m.scoreA ?? null,
    scoreB: m.scoreB ?? null,
    winner: m.winner ?? null,
  };
}

function propagate(rounds) {
  // coloca winners de la ronda anterior como a/b de la siguiente
  for (let r = 0; r < rounds.length - 1; r++) {
    const curr = rounds[r];
    const next = rounds[r + 1];
    for (let i = 0; i < next.length; i++) {
      const mA = curr[i * 2];
      const mB = curr[i * 2 + 1];
      next[i].a = mA?.winner ?? next[i].a ?? null;
      next[i].b = mB?.winner ?? next[i].b ?? null;
    }
  }
}

function setScoreAndPropagate(rounds, matchId, scoreA, scoreB) {
  // set score y recalcular winners desde ese partido hacia adelante
  let found = null;
  for (const round of rounds) {
    for (const m of round) {
      if (m.id === matchId) {
        m.scoreA = Number.isFinite(scoreA) ? scoreA : null;
        m.scoreB = Number.isFinite(scoreB) ? scoreB : null;
        if (m.scoreA == null || m.scoreB == null) {
          m.winner = null;
        } else if (m.a === "BYE" && m.b !== "BYE") {
          m.winner = m.b;
        } else if (m.b === "BYE" && m.a !== "BYE") {
          m.winner = m.a;
        } else if (m.a === "BYE" && m.b === "BYE") {
          m.winner = "BYE";
        } else if (m.scoreA > m.scoreB) {
          m.winner = m.a;
        } else if (m.scoreB > m.scoreA) {
          m.winner = m.b;
        } else {
          m.winner = null; // empate no válido
        }
        found = m;
        break;
      }
    }
    if (found) break;
  }
  if (!found) return false;

  // limpiar desde la ronda del match en adelante y re-propagar
  let roundIndex = rounds.findIndex(r => r.some(m => m.id === matchId));
  for (let r = roundIndex + 1; r < rounds.length; r++) {
    for (const m of rounds[r]) {
      m.a = null;
      m.b = null;
      m.scoreA = null;
      m.scoreB = null;
      m.winner = null;
    }
  }
  propagate(rounds);
  return true;
}

module.exports = {
  TournamentStore,
  setScoreAndPropagate,
  toFinalShape,
};
