(()=> {
  const $ = sel => document.querySelector(sel);
  const api = (p)=> `/api${p}`;
  let es; // EventSource (deshabilitado por ahora)

  function paramsFromURL(){
    const u = new URL(location.href);
    return {
      tid: u.searchParams.get("tournamentId") || "demo",
      team: u.searchParams.get("team") || ""
    }
  }

  function applyParams(){
    const p = paramsFromURL();
    const tid = $("#tid");
    const myteam = $("#myteam");
    if (tid) tid.value = p.tid;
    if (myteam) myteam.value = p.team;
  }

  function renderRound(container, round, me){
    const box = document.createElement("div");
    box.className = "round";
    box.innerHTML = `<h3>${round.name}</h3>`;
    round.matches.forEach(m=>{
      const you = (m.a===me || m.b===me) ? " you" : "";
      const done = (m.status==="done") ? " done" : "";
      const div = document.createElement("div");
      div.className = "match"+done+you;
      div.innerHTML = `
        <div class="team"><span>${m.a ?? "—"}</span><span class="badge">${m.scoreA ?? ""}</span></div>
        <div class="team"><span>${m.b ?? "—"}</span><span class="badge">${m.scoreB ?? ""}</span></div>
      `;
      box.appendChild(div);
    });
    container.appendChild(box);
  }

  function findNextMatch(bracket, me){
    if(!me) return null;
    const scan = (rounds)=>{
      for(const r of rounds){
        for(const m of r.matches){
          if(m.status!=="pending") continue;
          if(m.a===me || m.b===me) return m;
        }
      }
      return null;
    };
    return scan(bracket.winners)
        || scan(bracket.losers)
        || (bracket.grandFinal.status==="pending"
            && (bracket.grandFinal.a===me || bracket.grandFinal.b===me)
            ? bracket.grandFinal : null);
  }

  function paint(bracket){
    const me = ($("#myteam")?.value || "").trim();
    const W = $("#winners");
    const L = $("#losers");
    const GF = $("#gf");
    const NEXT = $("#next");
    if(!W || !L || !GF || !NEXT) return;

    W.innerHTML = ""; L.innerHTML=""; GF.innerHTML="";

    bracket.winners.forEach(r=>renderRound(W,r,me));
    bracket.losers.forEach(r=>renderRound(L,r,me));

    const gf = bracket.grandFinal;
    const you = (gf.a===me || gf.b===me) ? " you" : "";
    const done = (gf.status==="done") ? " done" : "";
    const gfBox = document.createElement("div");
    gfBox.className="match"+done+you;
    gfBox.innerHTML = `
      <div class="team"><span>${gf.a ?? "—"}</span><span class="badge">${gf.scoreA ?? ""}</span></div>
      <div class="team"><span>${gf.b ?? "—"}</span><span class="badge">${gf.scoreB ?? ""}</span></div>`;
    GF.appendChild(gfBox);

    const nm = findNextMatch(bracket, me);
    NEXT.textContent = nm ? `• ${nm.a ?? "—"} vs ${nm.b ?? "—"} (match ${nm.id})` : "—";
  }

  // Mapea la respuesta del API {winners, final} -> {winners, losers, grandFinal}
  function mapApiToUi(data){
    const toStatus = (a,b)=> (Number.isFinite(a) && Number.isFinite(b)) ? "done" : "pending";
    const winners = (data.winners || []).map((round, idx)=>({
      name: `Ronda ${idx+1}`,
      matches: round.map(m => ({
        id: m.id,
        a: m.a ?? "—",
        b: m.b ?? "—",
        scoreA: m.scoreA ?? null,
        scoreB: m.scoreB ?? null,
        status: toStatus(m.scoreA, m.scoreB)
      }))
    }));
    const gf = data.final || { id:"GF", a:null, b:null, scoreA:null, scoreB:null };
    const grandFinal = {
      id: gf.id,
      a: gf.a ?? "—",
      b: gf.b ?? "—",
      scoreA: gf.scoreA ?? null,
      scoreB: gf.scoreB ?? null,
      status: toStatus(gf.scoreA, gf.scoreB)
    };
    return { winners, losers: [], grandFinal };
  }

  async function load(tid){
    try{
      const r = await fetch(api(`/tournaments/${encodeURIComponent(tid)}/bracket`), {
        headers: { "Accept":"application/json" }
      });
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const raw = await r.json();
      const mapped = mapApiToUi(raw);
      paint(mapped);

      // SSE deshabilitado (no tenemos /bracket/stream)
      if (es) { es.close(); es = null; }
    } catch(err){
      console.error("Error cargando bracket:", err);
    }
  }

  $("#load")?.addEventListener("click", ()=>{
    const tid=$("#tid").value.trim();
    const team=$("#myteam").value.trim();
    const url = new URL(location.href);
    url.searchParams.set("tournamentId", tid);
    if(team) url.searchParams.set("team", team); else url.searchParams.delete("team");
    history.replaceState(null,"",url.toString());
    load(tid);
  });

  applyParams();
  load($("#tid")?.value || "demo");
})();
