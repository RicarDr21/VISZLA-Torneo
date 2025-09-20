(()=> {
  const $ = s => document.querySelector(s);
  const api = p => `/api${p}`;
  const el = (t,c)=>{const n=document.createElement(t); if(c) n.className=c; return n};
  const elNS = n => document.createElementNS("http://www.w3.org/2000/svg", n);

  const roundLabel = (i, total) => {
    if(total===3) return ["Cuartos","Semifinales","Final"][i] || `Ronda ${i+1}`;
    if(total===2) return ["Semifinales","Final"][i] || `Ronda ${i+1}`;
    return `Ronda ${i+1}`;
  };

  function toUi(data){
    const done = (a,b)=> Number.isFinite(a)&&Number.isFinite(b);
    const winners = (data.winners||[]).map(arr=> arr.map(m=>({
      id:m.id, a:m.a??"—", b:m.b??"—",
      sa:m.scoreA??null, sb:m.scoreB??null,
      status: done(m.scoreA,m.scoreB) ? "done":"pend",
      win: done(m.scoreA,m.scoreB) ? (m.scoreA>m.scoreB?"A":"B") : null
    })));
    // Si la API ya trae la final como última ronda (1 match), la dejamos tal cual.
    // Si no, igualmente dibujaremos lo recibido.
    return { winners };
  }

  function row(name, score, me, cls){
    const r = el("div", "row"+(cls?` ${cls}`:"")+(me?" me":""));
    r.innerHTML = `<span class="name">${name}</span><span class="badge">${score??""}</span>`;
    return r;
  }

  function matchBox(m, me){
    const box = el("div","match"+((m.a===me||m.b===me)?" you":"")+(m.status==="done"?" done":""));
    const rowA = row(m.a, m.sa, m.a===me, m.status==="done" ? (m.win==="A"?"win":"pend") : "pend");
    const rowB = row(m.b, m.sb, m.b===me, m.status==="done" ? (m.win==="B"?"win":"pend") : "pend");
    box.append(rowA, rowB);
    return box;
  }

  function render(UI){
    const me = ($("#myteam")?.value||"").trim();
    const highlight = $("#hlToggle")?.checked ?? true;
    const W = $("#winners");

    // 1) Vaciar y reconstruir columnas
    W.innerHTML = "";
    const cols = [];
    UI.winners.forEach((round,i)=>{
      const col = el("div","round");
      const title = el("div","rtitle"); title.textContent = roundLabel(i, UI.winners.length);
      col.appendChild(title);
      const nodes=[];
      round.forEach(m=>{ const node = matchBox(m, me); col.appendChild(node); nodes.push(node); });
      W.appendChild(col); cols.push(nodes);
    });

    // 2) Crear el SVG NUEVO después de vaciar el contenedor
    const svg = elNS("svg");
    svg.setAttribute("class","svg");
    svg.setAttribute("id","svg-winners");
    W.appendChild(svg);

    // 3) Dibujar conectores
    drawLines(W, svg, cols, highlight);
  }

  function drawLines(container, svg, cols, highlight){
    svg.innerHTML="";
    // Definir marker (flecha)
    const defs = elNS("defs");
    const marker = elNS("marker");
    marker.setAttribute("id","arrow");
    marker.setAttribute("markerWidth","8");
    marker.setAttribute("markerHeight","8");
    marker.setAttribute("refX","7");
    marker.setAttribute("refY","4");
    marker.setAttribute("orient","auto");
    const tip = elNS("path");
    tip.setAttribute("d","M0,0 L8,4 L0,8 Z");
    tip.setAttribute("fill","#3a4b6e");
    marker.appendChild(tip);
    defs.appendChild(marker);
    svg.appendChild(defs);

    if(cols.length<2) return;
    const base = container.getBoundingClientRect();
    const path = (x1,y1,x2,y2)=> {
      const mid=(x1+x2)/2;
      return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
    };

    for(let r=0; r<cols.length-1; r++){
      const a = cols[r], b = cols[r+1];
      for(let i=0; i<b.length; i++){
        const from1 = a[i*2], from2 = a[i*2+1], to = b[i];
        if(!from1 || !from2 || !to) continue;

        const ra = from1.getBoundingClientRect(), rb = from2.getBoundingClientRect(), rt = to.getBoundingClientRect();
        const x1a = ra.right - base.left, y1a = ra.top + ra.height/2 - base.top;
        const x1b = rb.right - base.left, y1b = rb.top + rb.height/2 - base.top;
        const x2  = rt.left  - base.left, y2  = rt.top + rt.height/2  - base.top;

        const p1 = elNS("path"); p1.setAttribute("class","connector"); p1.setAttribute("d", path(x1a,y1a,x2,y2));
        const p2 = elNS("path"); p2.setAttribute("class","connector"); p2.setAttribute("d", path(x1b,y1b,x2,y2));
        p1.setAttribute("marker-end","url(#arrow)"); p2.setAttribute("marker-end","url(#arrow)");

        if(highlight && (from1.classList.contains("you") || from2.classList.contains("you") || to.classList.contains("you"))){
          p1.classList.add("emph"); p2.classList.add("emph");
        }
        svg.append(p1,p2);
      }
    }
  }

  function nextForMe(UI){
    const me = ($("#myteam")?.value||"").trim();
    for(const round of UI.winners){
      for(const m of round){
        if(m.status!=="done" && (m.a===me || m.b===me)){
          return `${m.a} vs ${m.b} (${m.id})`;
        }
      }
    }
    return "—";
  }

  async function load(tid){
    const r = await fetch(api(`/tournaments/${encodeURIComponent(tid)}/bracket`), {headers:{Accept:"application/json"}});
    const raw = await r.json();
    const UI = toUi(raw);
    render(UI);
    $("#next").textContent = nextForMe(UI);
  }

  $("#load")?.addEventListener("click", ()=>{
    const tid=$("#tid").value.trim(), team=$("#myteam").value.trim();
    const url=new URL(location.href); url.searchParams.set("tournamentId", tid);
    if(team) url.searchParams.set("team", team); else url.searchParams.delete("team");
    history.replaceState(null,"",url.toString()); load(tid);
  });
  $("#hlToggle")?.addEventListener("change", ()=> load($("#tid").value));

  (function init(){
    const u=new URL(location.href);
    $("#tid").value = u.searchParams.get("tournamentId") || "demo";
    $("#myteam").value = u.searchParams.get("team") || "";
    load($("#tid").value);
  })();

  addEventListener("resize", ()=> { clearTimeout(window.__raf); window.__raf=setTimeout(()=>load($("#tid").value), 120); });
})();
