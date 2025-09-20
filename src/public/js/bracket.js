(() => {
  const $ = sel => document.querySelector(sel);

  // Parámetros de URL
  function paramsFromURL(){
    const u = new URL(location.href);
    return {
      tid:  u.searchParams.get("tournamentId") || "demo",
      team: u.searchParams.get("team") || ""
    }
  }
  function applyParams(){
    const p = paramsFromURL();
    $("#tid").value    = p.tid;
    $("#myteam").value = p.team;
  }

  // Render helpers
  function matchCard(m, my){
    const a = m.a ?? "—";
    const b = m.b ?? "—";
    const sA = (m.scoreA ?? "–");
    const sB = (m.scoreB ?? "–");
    const done = (m.scoreA!=null && m.scoreB!=null);
    const isYou = (a===my || b===my);
    const cls = `match ${done?"done":"pending"} ${isYou?"you":""}`;
    return `
      <article class="${cls}" data-mid="${m.id}">
        <div class="team"><span>${a}</span><span class="badge">${sA}</span></div>
        <div class="team"><span class="badge">${sB}</span><span>${b}</span></div>
      </article>`;
  }

  function clearCols(){
    $("#col-q").innerHTML = "";
    $("#col-sf").innerHTML = "";
    $("#col-f").innerHTML = "";
    $("#br-arrows").innerHTML = "";
  }

  function paint(bracket){
    const my = $("#myteam").value.trim();
    clearCols();

    const rounds = Array.isArray(bracket.winners) ? bracket.winners : [];
    const q  = rounds[0] || [];         // Cuartos
    const sf = rounds[1] || [];         // Semis
    const finalFromRounds = rounds[2] && rounds[2][0] ? rounds[2][0] : null;
    const finalObj = finalFromRounds || bracket.final || null;

    // Pintar columnas
    $("#col-q").innerHTML  = q.map(m=>matchCard(m,my)).join("") || `<div class="match pending"><div class="team">—</div><div class="team">—</div></div>`;
    $("#col-sf").innerHTML = sf.map(m=>matchCard(m,my)).join("") || `<div class="match pending"><div class="team">—</div><div class="team">—</div></div>`;

    if(finalObj){
      $("#col-f").innerHTML = matchCard(finalObj,my);
    }else{
      $("#col-f").innerHTML = `<div class="match pending"><div class="team">—</div><div class="team">—</div></div>`;
    }

    // Siguiente de mi equipo
    updateNext(bracket, my);

    // Flechas
    requestAnimationFrame(drawArrows);
  }

  function updateNext(bracket, my){
    const nm = findNextMatch(bracket, my);
    $("#next-match").textContent = nm ? `Siguiente de mi equipo: ${nm.a ?? "—"} vs ${nm.b ?? "—"} (${nm.id})` : "Siguiente de mi equipo: —";
  }

  function findNextMatch(bracket, me){
    if(!me) return null;
    const scan=(rounds)=>{
      for(const r of rounds||[]){
        for(const m of r||[]){
          const pending = (m.scoreA==null && m.scoreB==null);
          if(!pending) continue;
          if(m.a===me || m.b===me) return m;
        }
      }
      return null;
    };
    return scan(bracket.winners) || ((bracket.final && (bracket.final.a===me || bracket.final.b===me) && bracket.final.scoreA==null) ? bracket.final : null);
  }

  // Dibujo de flechas (winners -> siguientes rondas y semis -> final)
  function drawArrows(){
    const svg = $("#br-arrows"); if(!svg) return;
    svg.innerHTML = "";

    const box = svg.getBoundingClientRect();
    const qs  = (sel)=>Array.from(document.querySelectorAll(sel));

    // Conexión Cuartos -> Semis
    const from = qs("#col-q .match");
    const to   = qs("#col-sf .match");
    for(let i=0;i<from.length;i++){
      const nextIndex = Math.floor(i/2);
      if(!to[nextIndex]) continue;
      drawConnector(svg, from[i], to[nextIndex]);
    }

    // Conexión Semis -> Final (dos flechas si existen)
    const semi = qs("#col-sf .match");
    const fin  = qs("#col-f .match")[0];
    if(fin){
      for(const s of semi) drawConnector(svg, s, fin);
    }
  }

  function drawConnector(svg, fromEl, toEl){
    if(!fromEl||!toEl) return;
    const f = fromEl.getBoundingClientRect();
    const t = toEl.getBoundingClientRect();
    const s = svg.getBoundingClientRect();

    const x1 = f.right - s.left;                          // lado derecho del partido origen
    const y1 = (f.top + f.bottom)/2 - s.top;
    const x2 = t.left - s.left;                           // lado izquierdo del partido destino
    const y2 = (t.top + t.bottom)/2 - s.top;

    const cx = (x1 + x2)/2;                               // control points para curva suave
    const d = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d", d);
    path.setAttribute("class", "connector-arrow");
    svg.appendChild(path);
  }

  // Cargar
  async function load(tid){
    try{
      const r = await fetch(`/api/tournaments/${encodeURIComponent(tid)}/bracket`, {cache:"no-store"});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      paint(json);
    }catch(e){
      console.error(e);
      clearCols();
      $("#col-q").innerHTML = `<div class="match pending"><div class="team">No se pudo cargar</div><div class="team">—</div></div>`;
    }
  }

  // UI wiring
  $("#load").addEventListener("click", ()=>{
    const tid=$("#tid").value.trim();
    const team=$("#myteam").value.trim();
    const url = new URL(location.href);
    url.searchParams.set("tournamentId", tid);
    if(team) url.searchParams.set("team", team); else url.searchParams.delete("team");
    history.replaceState(null,"",url.toString());
    load(tid);
  });

  // Poll (8s)
  setInterval(()=>{ const id=$("#tid").value.trim(); if(id) load(id); }, 8000);

  // init
  applyParams();
  load($("#tid").value);
})();
