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

  function drawConnector(svg, fromEl, toEl, emph=false){
    if(!fromEl || !toEl) return;
    const f = fromEl.getBoundingClientRect();
    const t = toEl.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    const x1 = f.right - s.left;
    const y1 = (f.top + f.bottom)/2 - s.top;
    const x2 = t.left - s.left;
    const y2 = (t.top + t.bottom)/2 - s.top;
    const mid = (x1+x2)/2;
    const d = `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
    const path = elNS("path");
    path.setAttribute("d", d);
    path.setAttribute("class", emph ? "connector-arrow emph" : "connector-arrow");
    svg.appendChild(path);
  }

  function render(UI){
    const me = ($("#myteam")?.value||"").trim();
    const highlight = $("#hlToggle")?.checked ?? true;
    const W = $("#winners");

    // Construye columnas
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

    // Crea SVG (encima de columnas)
    const svg = elNS("svg");
    svg.setAttribute("class","svg");
    svg.setAttribute("id","svg-winners");
    W.appendChild(svg);

    // Conectores con flechas
    for(let r=0; r<cols.length-1; r++){
      const from = cols[r];
      const to = cols[r+1];
      for(let i=0; i<to.length; i++){
        const A = from[i*2], B = from[i*2+1], T = to[i];
        if(!A || !B || !T) continue;
        const emph = highlight && (A.classList.contains("you") || B.classList.contains("you") || T.classList.contains("you"));
        drawConnector(svg, A, T, emph);
        drawConnector(svg, B, T, emph);
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
    $("#next")?.textContent = nextForMe(UI);
  }

  // eventos
  $("#load")?.addEventListener("click", ()=>{
    const tid=$("#tid").value.trim(), team=$("#myteam").value.trim();
    const url=new URL(location.href); url.searchParams.set("tournamentId", tid);
    if(team) url.searchParams.set("team", team); else url.searchParams.delete("team");
    history.replaceState(null,"",url.toString()); load(tid);
  });
  $("#hlToggle")?.addEventListener("change", ()=> load($("#tid").value));

  // Tema: aplica clase y persiste en URL
  const select = $("#theme");
  select?.addEventListener("change", ()=>{
    const th = select.value;
    const url = new URL(location.href);
    url.searchParams.set("theme", th);
    history.replaceState(null, "", url.toString());
    document.body.classList.toggle("theme-sunset", th === "Atardecer" || th === "sunset");
  });

  (function init(){
    const u=new URL(location.href);
    $("#tid").value = u.searchParams.get("tournamentId") || "demo";
    $("#myteam").value = u.searchParams.get("team") || "";
    const th = u.searchParams.get("theme") || "ocean";
    if(select){ select.value = (th==="sunset") ? "Atardecer" : "Océano"; }
    document.body.classList.toggle("theme-sunset", th === "sunset" || (select && select.value==="Atardecer"));
    load($("#tid").value);
  })();

  addEventListener("resize", ()=> { clearTimeout(window.__raf); window.__raf=setTimeout(()=>load($("#tid").value), 120); });
})();
