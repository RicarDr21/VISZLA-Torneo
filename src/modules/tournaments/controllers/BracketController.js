const clientsByTournament = new Map();  // SSE clients
const TOURNAMENTS = new Map();          // In-memory demo

function seedTournament(id = "sample") {
  if (TOURNAMENTS.has(id)) return;

  const T = (name)=>({name});
  const teams = [
    T("Viszla Phoenix"), T("Daily Dragons"),
    T("Viszla Tigers"),  T("Viszla Warriors"),
    T("Raptors"),        T("Knights"),
    T("Wolves"),         T("Sharks")
  ];

  const match = (id, a, b, next=null, slot=null, loserNext=null, loserSlot=null)=>({
    id, a, b, scoreA:null, scoreB:null, winner:null, status:"pending",
    next, slot, loserNext, loserSlot
  });

  const winners = [
    { name:"Cuartos", matches:[
      match("w1m1", teams[0].name, teams[1].name, "w2m1","a", "l1m1","a"),
      match("w1m2", teams[2].name, teams[3].name, "w2m1","b", "l1m1","b"),
      match("w1m3", teams[4].name, teams[5].name, "w2m2","a", "l1m2","a"),
      match("w1m4", teams[6].name, teams[7].name, "w2m2","b", "l1m2","b"),
    ]},
    { name:"Semifinales", matches:[
      match("w2m1", null, null, "wf","a", "l2m1","a"),
      match("w2m2", null, null, "wf","b", "l2m1","b"),
    ]},
    { name:"Final de ganadores", matches:[
      match("wf", null, null, "gf","a")
    ]}
  ];

  const losers = [
    { name:"Perdedores R1", matches:[ match("l1m1", null, null, "l2m1","a"), match("l1m2", null, null, "l2m1","b") ]},
    { name:"Final de perdedores", matches:[ match("l2m1", null, null, "gf","b") ]}
  ];

  const grandFinal = match("gf", null, null, null, null);

  const tournament = { id, name:"Copa VISZLA", winners, losers, grandFinal };
  TOURNAMENTS.set(id, tournament);
}

function findMatch(t, matchId) {
  const scan = (rounds)=> {
    for (const r of rounds) {
      for (const m of r.matches) if (m.id === matchId) return m;
    }
  };
  return scan(t.winners) || scan(t.losers) || (t.grandFinal.id === matchId ? t.grandFinal : null);
}

function propagate(t, fromMatch) {
  const put = (targetId, slot, value)=>{
    if (!targetId || !slot) return;
    const m = findMatch(t, targetId);
    if (!m) return;
    if (slot === "a") m.a = value;
    if (slot === "b") m.b = value;
  };
  if (fromMatch.next && fromMatch.slot && fromMatch.winner) {
    put(fromMatch.next, fromMatch.slot, fromMatch.winner);
  }
  const loser = (fromMatch.scoreA ?? 0) > (fromMatch.scoreB ?? 0) ? fromMatch.b : fromMatch.a;
  if (fromMatch.loserNext && fromMatch.loserSlot && loser) {
    put(fromMatch.loserNext, fromMatch.loserSlot, loser);
  }
}

function serialize(t) {
  return {
    id: t.id, name: t.name,
    winners: t.winners.map(r=>({name:r.name,matches:r.matches})),
    losers:  t.losers.map(r=>({name:r.name,matches:r.matches})),
    grandFinal: t.grandFinal
  };
}

function broadcast(tid) {
  const clients = clientsByTournament.get(tid) || [];
  const t = TOURNAMENTS.get(tid);
  const data = `data: ${JSON.stringify({type:"update", bracket: serialize(t)})}\n\n`;
  clients.forEach(res => res.write(data));
}

exports.getBracket = (req,res)=>{
  const { id } = req.params;
  seedTournament(id);
  const t = TOURNAMENTS.get(id);
  res.json(serialize(t));
};

exports.streamBracket = (req,res)=>{
  const { id } = req.params;
  seedTournament(id);
  res.setHeader("Content-Type","text/event-stream");
  res.setHeader("Cache-Control","no-cache");
  res.setHeader("Connection","keep-alive");
  res.flushHeaders();
  const list = clientsByTournament.get(id) || [];
  list.push(res);
  clientsByTournament.set(id, list);
  // envío inicial
  const t = TOURNAMENTS.get(id);
  res.write(`data: ${JSON.stringify({type:"hello", bracket: serialize(t)})}\n\n`);
  req.on("close", ()=>{
    const now = (clientsByTournament.get(id) || []).filter(r=>r!==res);
    clientsByTournament.set(id, now);
  });
};

exports.reportResult = (req,res)=>{
  const { id } = req.params; // matchId
  const { tournamentId = "sample", scoreA, scoreB } = req.body || {};
  seedTournament(tournamentId);
  const t = TOURNAMENTS.get(tournamentId);
  const m = findMatch(t, id);
  if (!m) return res.status(404).json({error:"Match no encontrado"});
  if (m.status === "done") return res.status(409).json({error:"Match ya finalizado"});

  m.scoreA = Number(scoreA);
  m.scoreB = Number(scoreB);
  if (Number.isNaN(m.scoreA) || Number.isNaN(m.scoreB)) {
    return res.status(400).json({error:"Scores inválidos"});
  }
  m.winner = (m.scoreA > m.scoreB) ? m.a : m.b;
  m.status = "done";

  propagate(t, m);
  broadcast(tournamentId);
  res.json({ok:true, match:m});
};
