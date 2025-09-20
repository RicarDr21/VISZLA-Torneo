(()=> {
  const $ = s => document.querySelector(s);
  const api = p => `/api${p}`;
  const el = (t,c)=>{const n=document.createElement(t); if(c) n.className=c; return n};
  const elNS = n => document.createElementNS("http://www.w3.org/2000/svg", n);

  let __UI_CACHE = null;  // caché para re-render sin pedir al servidor

  const roundLabel = (i, total) => {
    if(total===3) return ["Cuartos","Semifinales","Final"][i] || `Ronda ${i+1}`;
    if(total===2) return ["Semifinales","Final"][i] || `Ronda ${i+1}`;
    return `Ronda ${i+1}`;
  };

  function toUi(data){
    const done = (a,b)=> Number.isFinite(a)&&Number.isFinite(b);
    const winners = (data.winners||[]).map(arr=> arr.map(m=>({
      id:m.id, a:m.a??"—", b:m.b??"—",
      sa: m.scoreA ?? null, sb: m.scoreB ?? null,
      status: done(m.scoreA,m.scoreB) ? "done":"pend",
      win: done(m.scoreA,m.scoreB) ? (m.scoreA>m.scoreB?"A":"B") : null
    })));
    return { winners };
  }

  function row(name, score, me, cls){
    const r = el("div","row"+(cls?` ${cls}`:"")+(me?" me":""));
    r.innerHTML = `<span class="name">${name}</span><span class="badge">${score??""}</span>`;
    return r;
  }

  function matchBox(m, me){
    const box = el("div","match"+((m.a===me||m.b===me)?" you":"")+(m.status==="done"?" done":""));
    const ra = row(m.a, m.sa, m.a===me, m.status==="done" ? (m.win==="A"?"win":"pend") : "pend");
    const rb = row(m.b, m.sb, m.b===me, m.status==="done" ? (m.win==="B"?"win":"pend") : "pend");
    box.append(ra, rb);
    return box;
  }

  function line(svg, d, emph, arrow=false){
    const p = elNS("path");
    p.setAttribute("d", d);
    p.setAttribute("class", (arrow? "connector-arrow" : "connector-line") + (emph ? " emph" : ""));
    svg.appendChild(p);
  }

  // “Llave”: horizontales A/B -> xMid, vertical en xMid y flecha xMid -> T
  function drawBracketConnector(svg, baseEl, A, B, T, emph=false){
    if(!A || !B || !T) return;
    const base = baseEl.getBoundingClientRect();
    const a = A.getBoundingClientRect();
    const b = B.getBoundingClientRect();
    const t = T.getBoundingClientRect();

    const xA = a.right - base.left;
    const yA = (a.top + a.bottom)/2 - base.top;
    const xB = b.right - base.left;
    const yB = (b.top + b.bottom)/2 - base.top;

    const xT = t.left - base.left;
    const yT = (t.top + t.bottom)/2 - base.top;

    const xMid = Math.max(xA, xB) + 22;
    const yTop = Math.min(yA, yB);
    const yBot = Math.max(yA, yB);

    line(svg, `M${xA},${yA} L${xMid},${yA}`, emph, false);
    line(svg, `M${xB},${yB} L${xMid},${yB}`, emph, false);
    line(svg, `M${xMid},${yTop} L${xMid},${yBot}`, emph, false);
    line(svg, `M${xMid},${yT} L${xT},${yT}`, emph, true);
  }

  function render(UI){
    const me = ($("#myteam")?.value||"").trim();
    const highlight = false;
    const W = $("#winners");
    W.innerHTML = "";

    const cols=[];
    UI.winners.forEach((round,i)=>{
      const col = el("div","round");
      const title = el("div","rtitle"); title.textContent = roundLabel(i, UI.winners.length);
      col.appendChild(title);
      const nodes=[];
      round.forEach(m=>{ const node=matchBox(m,me); col.appendChild(node); nodes.push(node); });
      W.appendChild(col); cols.push(nodes);
    });

    const svg = elNS("svg"); svg.setAttribute("class","svg"); svg.setAttribute("id","svg-winners"); W.appendChild(svg);

    requestAnimationFrame(()=>{
      for(let r=0; r<cols.length-1; r++){
        const from = cols[r], to = cols[r+1];
        for(let i=0; i<to.length; i++){
          const A = from[i*2], B = from[i*2+1], T = to[i];
          if(!A||!B||!T) continue;
          const emph = highlight && (A.classList.contains("you") || B.classList.contains("you") || T.classList.contains("you"));
          drawBracketConnector(svg, W, A, B, T, emph);
        }
      }
    });
  }

  function nextForMe(UI){
    const me = ($("#myteam")?.value||"").trim();
    for(const round of UI.winners){
      for(const m of round){
        if(m.status!=="done" && (m.a===me || m.b===me)) return `${m.a} vs ${m.b} (${m.id})`;
      }
    }
    return "—";
  }

  async function load(tid){
    const r = await fetch(api(`/tournaments/${encodeURIComponent(tid)}/bracket`), {headers:{Accept:"application/json"}});
    const raw = await r.json();
    const UI = toUi(raw);
    __UI_CACHE = UI;          // guarda para re-render sin red
    render(UI);
    const nxt = $("#next"); if(nxt) nxt.textContent = nextForMe(UI);
  }

  $("#load")?.addEventListener("click", ()=>{
    const tid=$("#tid").value.trim(), team=$("#myteam").value.trim();
    const url=new URL(location.href);
    url.searchParams.set("tournamentId", tid);
    if(team) url.searchParams.set("team", team); else url.searchParams.delete("team");
    history.replaceState(null,"",url.toString());
    load(tid);
  });

  // Ahora sí: re-dibuja al instante cuando cambias el checkbox
  }
  });

  (function init(){
    const u=new URL(location.href);
    $("#tid").value = u.searchParams.get("tournamentId") || "demo";
    $("#myteam").value = u.searchParams.get("team") || "";
    load($("#tid").value);
  })();

  addEventListener("resize", ()=> { clearTimeout(window.__raf); window.__raf=setTimeout(()=>{ if(__UI_CACHE) render(__UI_CACHE); }, 120); });
})();

