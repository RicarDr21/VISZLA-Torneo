(()=> {
  const $ = sel => document.querySelector(sel);
  const api = (p)=> `/api${p}`;

  const el = (t,c)=>{const n=document.createElement(t);if(c)n.className=c;return n};
  const elNS = (n)=> document.createElementNS("http://www.w3.org/2000/svg", n);

  function makeMatchNode(m, me){
    const div = el("div","match"+((m.a===me||m.b===me)?" you":"")+(m.status==="done"?" done":""));
    div.innerHTML = `
      <div class="team${m.a===me?" you":""}"><span>${m.a ?? "—"}</span><span class="badge">${m.scoreA ?? ""}</span></div>
      <div class="team${m.b===me?" you":""}"><span>${m.b ?? "—"}</span><span class="badge">${m.scoreB ?? ""}</span></div>`;
    return div;
  }

  function renderColumn(parent, round, me){
    const col = el("div","round-col");
    const title = el("div","round-title"); title.textContent = round.name;
    col.appendChild(title);
    const nodes = [];
    round.matches.forEach(m=>{
      const node = makeMatchNode(m, me);
      col.appendChild(node);
      nodes.push(node);
    });
    parent.appendChild(col);
    return nodes;
  }

  function drawConnectors(container, svg, columns){
    svg.innerHTML="";
    if(columns.length<2) return;
    const firstRect = container.getBoundingClientRect();
    const mkPath=(x1,y1,x2,y2)=>{
      const midX=x1+20;
      return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    };
    for(let r=0;r<columns.length-1;r++){
      const src=columns[r], dst=columns[r+1];
      for(let i=0;i<dst.length;i++){
        const fromA=src[i*2], fromB=src[i*2+1], to=dst[i];
        if(!fromA||!fromB||!to) continue;
        const ra=fromA.getBoundingClientRect(), rb=fromB.getBoundingClientRect(), rt=to.getBoundingClientRect();
        const x1a=ra.right-firstRect.left, y1a=ra.top+ra.height/2-firstRect.top;
        const x1b=rb.right-firstRect.left, y1b=rb.top+rb.height/2-firstRect.top;
        const x2=rt.left-firstRect.left, y2=rt.top+rt.height/2-firstRect.top;
        const p1=elNS("path"); p1.setAttribute("class","connector"); p1.setAttribute("d",mkPath(x1a,y1a,x2,y2));
        const p2=elNS("path"); p2.setAttribute("class","connector"); p2.setAttribute("d",mkPath(x1b,y1b,x2,y2));
        svg.appendChild(p1); svg.appendChild(p2);
      }
    }
  }

  function mapApiToUi(data){
    const status=(a,b)=>(Number.isFinite(a)&&Number.isFinite(b))?"done":"pending";
    const winners=(data.winners||[]).map((round,i)=>({
      name:`Ronda ${i+1}`,
      matches:round.map(m=>({
        id:m.id,a:m.a??"—",b:m.b??"—",
        scoreA:m.scoreA??null,scoreB:m.scoreB??null,
        status:status(m.scoreA,m.scoreB)
      }))
    }));
    const gf=data.final||{id:"GF",a:null,b:null};
    const grandFinal={id:gf.id,a:gf.a??"—",b:gf.b??"—",scoreA:gf.scoreA??null,scoreB:gf.scoreB??null,status:status(gf.scoreA,gf.scoreB)};
    return {winners, losers:[], grandFinal};
  }

  function findNextMatch(br, me){
    if(!me) return null;
    const scan=(rounds)=>{for(const r of rounds){for(const m of r.matches){if(m.status==="pending"&&(m.a===me||m.b===me)) return m;}};return null};
    return scan(br.winners)||scan(br.losers)||(br.grandFinal.status==="pending"&&(br.grandFinal.a===me||br.grandFinal.b===me)?br.grandFinal:null);
  }

  function paint(br){
    const me=$("#myteam").value.trim();
    const W=$("#winners"), L=$("#losers"), GF=$("#gf"), NEXT=$("#next");
    W.innerHTML='<svg class="svg-layer" id="svg-winners"></svg>';
    L.innerHTML='<svg class="svg-layer" id="svg-losers"></svg>';
    GF.innerHTML="";
    const wCols=[]; br.winners.forEach(r=>wCols.push(renderColumn(W,r,me)));
    const gfNode=makeMatchNode(br.grandFinal, me); GF.appendChild(gfNode);
    const nm=findNextMatch(br, me); NEXT.textContent=nm?`• ${nm.a} vs ${nm.b} (${nm.id})`:"—";
    requestAnimationFrame(()=> drawConnectors(W,$("#svg-winners"),wCols));
  }

  async function load(tid){
    try{
      const r=await fetch(api(`/tournaments/${encodeURIComponent(tid)}/bracket`));
      const raw=await r.json(); paint(mapApiToUi(raw));
    }catch(e){console.error(e)}
  }

  $("#load").addEventListener("click",()=>{
    const tid=$("#tid").value.trim(), team=$("#myteam").value.trim();
    const url=new URL(location.href); url.searchParams.set("tournamentId",tid);
    if(team) url.searchParams.set("team",team); else url.searchParams.delete("team");
    history.replaceState(null,"",url.toString()); load(tid);
  });

  (function init(){
    const u=new URL(location.href); $("#tid").value=u.searchParams.get("tournamentId")||"demo"; $("#myteam").value=u.searchParams.get("team")||"";
    load($("#tid").value);
  })();
})();
