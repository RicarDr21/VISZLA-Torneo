(()=> {
  const $ = s => document.querySelector(s);
  const api = p => `/api${p}`;
  const el = (t,c)=>{const n=document.createElement(t); if(c) n.className=c; return n};
  const elNS = n => document.createElementNS("http://www.w3.org/2000/svg", n);

  /* -------- API -> UI (marca ganador/derrotado) -------- */
  function mapApiToUi(data){
    const status=(a,b)=>(Number.isFinite(a)&&Number.isFinite(b))?"done":"pending";
    const winners=(data.winners||[]).map((round,i)=>({
      name:`Ronda ${i+1}`,
      matches: round.map(m=>{
        const st=status(m.scoreA,m.scoreB);
        let winSide=null;
        if(st==="done"){
          if(m.a==="BYE" && m.b!=="BYE") winSide="B";
          else if(m.b==="BYE" && m.a!=="BYE") winSide="A";
          else if(m.scoreA>m.scoreB) winSide="A";
          else if(m.scoreB>m.scoreA) winSide="B";
        }
        return {id:m.id,a:m.a??"—",b:m.b??"—",scoreA:m.scoreA??null,scoreB:m.scoreB??null,status:st,winSide};
      })
    }));
    const gf=data.final||{id:"GF",a:null,b:null,scoreA:null,scoreB:null};
    const gfStatus=status(gf.scoreA,gf.scoreB);
    let gfWin=null; if(gfStatus==="done"){ gfWin = (gf.scoreA>gf.scoreB)?"A":"B"; }
    const grandFinal={ id:gf.id, a:gf.a??"—", b:gf.b??"—", scoreA:gf.scoreA??null, scoreB:gf.scoreB??null, status:gfStatus, winSide:gfWin };
    return { winners, grandFinal };
  }

  /* -------- Render -------- */
  function teamRow(label, score, isMe, isWin, isLose){
    const row = el("div","team"+(isMe?" you":"")+(isWin?" win":"")+(isLose?" lose":""));
    row.innerHTML = `<span>${label}</span><span class="badge">${score ?? ""}</span>`;
    return row;
  }
  function matchNode(m, me){
    const div = el("div","match"+((m.a===me||m.b===me)?" you":"")+(m.status==="done"?" done":""));
    const winA=m.winSide==="A", winB=m.winSide==="B";
    div.title = `${m.id} · ${m.a} ${m.scoreA ?? ""} – ${m.b} ${m.scoreB ?? ""}`.trim();
    div.appendChild(teamRow(m.a, m.scoreA, m.a===me, winA, m.status==="done" && !winA));
    div.appendChild(teamRow(m.b, m.scoreB, m.b===me, winB, m.status==="done" && !winB));
    return div;
  }
  function renderCol(parent, round, me){
    const col = el("div","round-col");
    const t = el("div","round-title"); t.textContent = round.name;
    col.appendChild(t);
    const arr=[];
    round.matches.forEach(m=>{ const n=matchNode(m,me); col.appendChild(n); arr.push(n); });
    parent.appendChild(col);
    return arr;
  }

  /* -------- Conectores curvos con glow -------- */
  function drawConnectors(container, svg, columns){
    svg.innerHTML="";
    if(columns.length<2) return;
    const base = container.getBoundingClientRect();
    const cubic = (x1,y1,x2,y2) => {
      const mid = (x1+x2)/2;
      return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
    };
    for(let r=0;r<columns.length-1;r++){
      const from=columns[r], to=columns[r+1];
      for(let i=0;i<to.length;i++){
        const A=from[i*2], B=from[i*2+1], T=to[i];
        if(!A||!B||!T) continue;
        const a=A.getBoundingClientRect(), b=B.getBoundingClientRect(), t=T.getBoundingClientRect();
        const x1a=a.right-base.left, y1a=a.top+a.height/2-base.top;
        const x1b=b.right-base.left, y1b=b.top+b.height/2-base.top;
        const x2=t.left-base.left,  y2=t.top+t.height/2-base.top;

        const p1=elNS("path"); p1.setAttribute("class","connector"); p1.setAttribute("d",cubic(x1a,y1a,x2,y2));
        const p2=elNS("path"); p2.setAttribute("class","connector"); p2.setAttribute("d",cubic(x1b,y1b,x2,y2));
        // enfatiza si hay partido decidido (glow)
        if(T.classList.contains("done")){ p1.classList.add("emph"); p2.classList.add("emph"); }
        svg.appendChild(p1); svg.appendChild(p2);
      }
    }
  }

  function findNext(br, me){
    if(!me) return null;
    for(const r of br.winners){
      for(const m of r.matches){
        if(m.status==="pending" && (m.a===me || m.b===me)) return m;
      }
    }
    if(br.grandFinal.status==="pending" && (br.grandFinal.a===me || br.grandFinal.b===me)) return br.grandFinal;
    return null;
  }

  function paint(br){
    const me = ($("#myteam")?.value || "").trim();
    const W=$("#winners"), GF=$("#gf"), NEXT=$("#next");
    W.innerHTML='<svg class="svg-layer" id="svg-winners"></svg>';
    GF.innerHTML="";
    const cols=[];
    br.winners.forEach(r=> cols.push(renderCol(W,r,me)));
    GF.appendChild(matchNode(br.grandFinal, me));
    const nm = findNext(br, me);
    NEXT.textContent = nm ? `• ${nm.a} vs ${nm.b} (${nm.id})` : "—";
    requestAnimationFrame(()=> drawConnectors(W, $("#svg-winners"), cols));
  }

  async function load(tid){
    const r = await fetch(api(`/tournaments/${encodeURIComponent(tid)}/bracket`), { headers:{ "Accept":"application/json" }});
    const raw = await r.json(); paint(mapApiToUi(raw));
  }

  $("#load")?.addEventListener("click", ()=>{
    const tid=$("#tid").value.trim(), team=$("#myteam").value.trim();
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

  addEventListener("resize", ()=> { clearTimeout(window.__rAF); window.__rAF=setTimeout(()=>load($("#tid").value), 120); });
})();
