(()=> {
  const $ = s => document.querySelector(s);
  const api = p => `/api${p}`;
  const el = (t,c)=>{const n=document.createElement(t); if(c) n.className=c; return n};
  const elNS = n => document.createElementNS("http://www.w3.org/2000/svg", n);

  /** ----- Mapeo API -> UI con ganador/derrotado ----- */
  function mapApiToUi(data){
    const status=(a,b)=>(Number.isFinite(a)&&Number.isFinite(b))?"done":"pending";
    const winners=(data.winners||[]).map((round,i)=>({
      name:`Ronda ${i+1}`,
      matches: round.map(m=>{
        const st = status(m.scoreA, m.scoreB);
        let winSide=null;
        if(st==="done"){
          if(m.a==="BYE" && m.b!=="BYE") winSide="B";
          else if(m.b==="BYE" && m.a!=="BYE") winSide="A";
          else if(m.scoreA>m.scoreB) winSide="A";
          else if(m.scoreB>m.scoreA) winSide="B";
        }
        return {
          id:m.id, a:m.a??"—", b:m.b??"—",
          scoreA: m.scoreA ?? null, scoreB: m.scoreB ?? null,
          status: st, winSide
        };
      })
    }));
    const gf = data.final || { id:"GF", a:null, b:null, scoreA:null, scoreB:null };
    const gfSt = status(gf.scoreA, gf.scoreB);
    let gfWin=null;
    if(gfSt==="done"){
      if(gf.scoreA>gf.scoreB) gfWin="A";
      else if(gf.scoreB>gf.scoreA) gfWin="B";
    }
    const grandFinal = {
      id: gf.id, a: gf.a ?? "—", b: gf.b ?? "—",
      scoreA: gf.scoreA ?? null, scoreB: gf.scoreB ?? null,
      status: gfSt, winSide: gfWin
    };
    return { winners, losers: [], grandFinal };
  }

  /** ----- Render helpers ----- */
  function makeTeamRow(label, score, isMe, isWin, isLose){
    const row = el("div", "team"+(isMe?" you":"")+(isWin?" win":"")+(isLose?" lose":""));
    row.innerHTML = `<span>${label}</span><span class="badge">${score ?? ""}</span>`;
    return row;
  }
  function makeMatchNode(m, me){
    const div = el("div","match"+((m.a===me||m.b===me)?" you":"")+(m.status==="done"?" done":""));
    const winA = m.winSide==="A", winB = m.winSide==="B";
    const t1 = makeTeamRow(m.a, m.scoreA, m.a===me, winA, m.status==="done" && !winA);
    const t2 = makeTeamRow(m.b, m.scoreB, m.b===me, winB, m.status==="done" && !winB);
    div.title = `${m.id} · ${m.a} ${m.scoreA ?? ""} – ${m.b} ${m.scoreB ?? ""}`.trim();
    div.appendChild(t1); div.appendChild(t2);
    return div;
  }
  function renderColumn(parent, round, me){
    const col = el("div","round-col");
    const title = el("div","round-title"); title.textContent = round.name;
    col.appendChild(title);
    const nodes = [];
    round.matches.forEach(m=>{ const node=makeMatchNode(m,me); col.appendChild(node); nodes.push(node); });
    parent.appendChild(col);
    return nodes;
  }

  /** ----- Conectores curvos (Bezier) ----- */
  function drawConnectors(container, svg, columns){
    svg.innerHTML="";
    if(columns.length<2) return;
    const first = container.getBoundingClientRect();
    const pathCubic = (x1,y1,x2,y2)=>{
      const midX = (x1 + x2) / 2;
      return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
    };
    for(let r=0;r<columns.length-1;r++){
      const src=columns[r], dst=columns[r+1];
      for(let i=0;i<dst.length;i++){
        const fromA=src[i*2], fromB=src[i*2+1], to=dst[i];
        if(!fromA||!fromB||!to) continue;
        const ra=fromA.getBoundingClientRect(), rb=fromB.getBoundingClientRect(), rt=to.getBoundingClientRect();
        const x1a=ra.right-first.left, y1a=ra.top+ra.height/2-first.top;
        const x1b=rb.right-first.left, y1b=rb.top+rb.height/2-first.top;
        const x2=rt.left-first.left,  y2=rt.top+rt.height/2-first.top;
        const p1=elNS("path"); p1.setAttribute("class","connector"); p1.setAttribute("d",pathCubic(x1a,y1a,x2,y2));
        const p2=elNS("path"); p2.setAttribute("class","connector"); p2.setAttribute("d",pathCubic(x1b,y1b,x2,y2));
        svg.appendChild(p1); svg.appendChild(p2);
      }
    }
  }

  /** ----- Paint ----- */
  function findNextMatch(br, me){
    if(!me) return null;
    const scan = (rounds)=>{ for(const r of rounds){ for(const m of r.matches){ if(m.status==="pending" && (m.a===me||m.b===me)) return m; } } return null; };
    return scan(br.winners)||scan(br.losers)||(br.grandFinal.status==="pending"&&(br.grandFinal.a===me||br.grandFinal.b===me)?br.grandFinal:null);
  }

  function paint(br){
    const me = ($("#myteam")?.value || "").trim();
    const W=$("#winners"), L=$("#losers"), GF=$("#gf"), NEXT=$("#next");
    W.innerHTML='<svg class="svg-layer" id="svg-winners"></svg>';
    L.innerHTML='<svg class="svg-layer" id="svg-losers"></svg>';
    GF.innerHTML="";
    const wCols=[]; br.winners.forEach(r=>wCols.push(renderColumn(W,r,me)));
    const gfNode = makeMatchNode(br.grandFinal, me); GF.appendChild(gfNode);
    const nm = findNextMatch(br, me);
    NEXT.innerHTML = nm ? `<span class="tooltip">• ${nm.a} vs ${nm.b} (${nm.id})</span>` : "—";
    requestAnimationFrame(()=> drawConnectors(W, $("#svg-winners"), wCols));
  }

  /** ----- Load & init ----- */
  async function load(tid){
    try{
      const r = await fetch(api(`/tournaments/${encodeURIComponent(tid)}/bracket`), { headers:{ "Accept":"application/json" }});
      const raw = await r.json();
      paint(mapApiToUi(raw));
    }catch(e){ console.error(e) }
  }

  $("#load")?.addEventListener("click",()=>{
    const tid=$("#tid").value.trim(); const team=$("#myteam").value.trim();
    const url=new URL(location.href); url.searchParams.set("tournamentId", tid);
    if(team) url.searchParams.set("team", team); else url.searchParams.delete("team");
    history.replaceState(null,"",url.toString()); load(tid);
  });

  (function init(){
    const u=new URL(location.href);
    $("#tid").value = u.searchParams.get("tournamentId") || "demo";
    $("#myteam").value = u.searchParams.get("team") || "";
    load($("#tid").value);
  })();

  addEventListener("resize", ()=> { clearTimeout(window.__br_r); window.__br_r=setTimeout(()=>load($("#tid").value), 120); });
})();
