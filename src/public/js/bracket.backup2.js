(()=> {
  const $  = sel => document.querySelector(sel);
  const api = (p)=> `/api${p}`;

  /** ---------- Utilidades visuales ---------- **/
  function el(tag, cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }
  const rectOf = el => el.getBoundingClientRect();

  function makeMatchNode(m, me){
    const div = el("div","match"+((m.a===me||m.b===me)?" you":"")+(m.status==="done"?" done":""));
    const t1 = el("div","team"+(m.a===me?" you":""));
    t1.innerHTML = `<span>${m.a ?? "—"}</span><span class="badge">${m.scoreA ?? ""}</span>`;
    const t2 = el("div","team"+(m.b===me?" you":""));
    t2.innerHTML = `<span>${m.b ?? "—"}</span><span class="badge">${m.scoreB ?? ""}</span>`;
    div.dataset.matchId = m.id;
    div.appendChild(t1); div.appendChild(t2);
    return div;
  }

  function renderColumn(parent, round, me){
    const col = el("div","round-col");
    const title = el("div","round-title"); title.textContent = round.name;
    col.appendChild(title);
    const holders = [];
    round.matches.forEach(m=>{
      const node = makeMatchNode(m, me);
      col.appendChild(node);
      holders.push(node);
    });
    parent.appendChild(col);
    return holders;
  }

  /** Dibuja conectores L-shape desde cada match de ronda r a su destino en r+1 */
  function drawConnectors(container, svg, columns){
    svg.innerHTML = "";
    if(columns.length < 2) return;
    const firstRect = container.getBoundingClientRect();
    const mkPath = (x1,y1,x2,y2)=>{
      // L shapey: horizontal 14px, vertical al destino, horizontal a x2
      const midX = x1 + 14;
      return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    };
    for(let r=0; r<columns.length-1; r++){
      const src = columns[r];
      const dst = columns[r+1];
      for(let i=0; i<dst.length; i++){
        const fromA = src[i*2];
        const fromB = src[i*2+1];
        const to    = dst[i];
        if(!fromA || !fromB || !to) continue;

        const aRect = rectOf(fromA), bRect = rectOf(fromB), tRect = rectOf(to);

        const x1a = aRect.right - firstRect.left;
        const y1a = aRect.top + aRect.height/2 - firstRect.top;
        const x1b = bRect.right - firstRect.left;
        const y1b = bRect.top + bRect.height/2 - firstRect.top;
        const x2  = tRect.left - firstRect.left;
        const y2  = tRect.top + tRect.height/2 - firstRect.top;

        const p1 = elNS("path"); p1.setAttribute("d", mkPath(x1a,y1a,x2,y2));
        const p2 = elNS("path"); p2.setAttribute("d", mkPath(x1b,y1b,x2,y2));
        svg.appendChild(p1); svg.appendChild(p2);
      }
    }
  }
  const elNS = (name)=> document.createElementNS("http://www.w3.org/2000/svg", name);

  /** ---------- Transformación de API a modelo UI ---------- **/
  function mapApiToUi(data){
    const status = (a,b)=> (Number.isFinite(a) && Number.isFinite(b)) ? "done" : "pending";
    const winners = (data.winners || []).map((round, idx)=>({
      name: `Ronda ${idx+1}`,
      matches: round.map(m => ({
        id: m.id,
        a: m.a ?? "—",
        b: m.b ?? "—",
        scoreA: m.scoreA ?? null,
        scoreB: m.scoreB ?? null,
        status: status(m.scoreA, m.scoreB)
      }))
    }));
    const gf = data.final || { id:"GF", a:null, b:null, scoreA:null, scoreB:null };
    const grandFinal = {
      id: gf.id,
      a: gf.a ?? "—",
      b: gf.b ?? "—",
      scoreA: gf.scoreA ?? null,
      scoreB: gf.scoreB ?? null,
      status: status(gf.scoreA, gf.scoreB)
    };
    return { winners, losers: [], grandFinal };
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
    return scan(bracket.winners) || scan(bracket.losers) ||
      (bracket.grandFinal.status==="pending" && (bracket.grandFinal.a===me || bracket.grandFinal.b===me)
        ? bracket.grandFinal : null);
  }

  function paint(br){
    const me = ($("#myteam")?.value || "").trim();
    const W = $("#winners"), L = $("#losers"), GF = $("#gf"), NEXT = $("#next");
    const svgW = $("#svg-winners"), svgL = $("#svg-losers");
    W.innerHTML = '<svg class="svg-layer" id="svg-winners"></svg>';
    L.innerHTML = '<svg class="svg-layer" id="svg-losers"></svg>';
    GF.innerHTML = "";

    // Render rounds (winners)
    const wCols = [];
    br.winners.forEach(r=>{
      const holders = renderColumn(W, r, me);
      wCols.push(holders);
    });

    // losers (si vacío, ocultar panel)
    const losersPanel = $("#panel-losers");
    if(!br.losers || br.losers.length===0){
      losersPanel.classList.add("hidden");
    }else{
      losersPanel.classList.remove("hidden");
      const lCols=[];
      br.losers.forEach(r=> lCols.push(renderColumn(L, r, me)));
      requestAnimationFrame(()=> drawConnectors(L, $("#svg-losers"), lCols));
    }

    // Gran final
    const gfNode = makeMatchNode(br.grandFinal, me);
    GF.appendChild(gfNode);

    // Next match
    const nm = findNextMatch(br, me);
    NEXT.textContent = nm ? `• ${nm.a ?? "—"} vs ${nm.b ?? "—"} (match ${nm.id})` : "—";

    // Conectores winners (tras layout)
    requestAnimationFrame(()=> drawConnectors(W, $("#svg-winners"), wCols));
  }

  function paramsFromURL(){
    const u = new URL(location.href);
    return {
      tid: u.searchParams.get("tournamentId") || "demo",
      team: u.searchParams.get("team") || ""
    }
  }
  function applyParams(){
    const p = paramsFromURL();
    $("#tid").value = p.tid;
    $("#myteam").value = p.team;
  }

  async function load(tid){
    try{
      const r = await fetch(api(`/tournaments/${encodeURIComponent(tid)}/bracket`), { headers:{ "Accept":"application/json" }});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const raw = await r.json();
      const br = mapApiToUi(raw);
      paint(br);
    }catch(e){
      console.error(e);
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

  // Recalcular conectores al cambiar tamaño
  let rafId=null;
  addEventListener("resize", ()=>{
    cancelAnimationFrame(rafId);
    rafId=requestAnimationFrame(()=> {
      // Re-cargar para re-pintar conectores con nuevas posiciones
      load($("#tid")?.value || "demo");
    });
  });
})();
