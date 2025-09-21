(function(){
  const $ = s => document.querySelector(s);
  const API = "/api/tournaments";
  // Nota: en producción real, la sesión debe proveer req.user.role="admin".
  // Este header adicional es inocuo y ayuda en dev; no se muestra en UI.
  const ADMIN_HEADERS = { "Content-Type":"application/json", "X-Demo-Admin":"true" };

  const fmtDate = (d) => new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(d));
  const toast = $("#toast"); const msg = $("#msg"); const btn = $("#btnCreate");

  function toastMsg(m){ toast.textContent=m; toast.style.display="block"; setTimeout(()=>toast.style.display="none",2200); }
  function nextAllowedFrom(lastCreatedAt){
    if(!lastCreatedAt) return "Disponible hoy";
    const base = new Date(lastCreatedAt).getTime();
    const next = new Date(base + 91*24*60*60*1000);
    return fmtDate(next);
  }

  async function refresh(){
    const r = await fetch(API); const j = await r.json();
    const data = (j && j.ok && Array.isArray(j.data)) ? j.data : [];
    $("#kpi-total").textContent = data.length || 0;
    $("#kpi-open").textContent  = data.filter(t=>t.registrationOpen).length || 0;
    $("#kpi-next").textContent  = nextAllowedFrom(data[0]?.createdAt);

    $("#list").innerHTML = data.map(t => `
      <div class="item">
        <div>
          <div><strong>${t.name}</strong></div>
          <div class="meta">${fmtDate(t.startDate)} → ${fmtDate(t.endDate)} · <span class="pill ${t.status}">${t.status === "published" ? "Publicado" : "Borrador"}</span> ${t.registrationOpen ? "· inscripciones abiertas" : ""}</div>
        </div>
        <div>
          ${t.status === "published" ? "" : `<button class="btn" data-publish="${t._id}">Publicar</button>`}
        </div>
      </div>
    `).join("") || "<div class='muted'>Aún no hay torneos.</div>";
  }

  document.addEventListener("click", async (ev)=>{
    const btn = ev.target.closest("button[data-publish]");
    if(!btn) return;
    btn.disabled = true;
    const id = btn.getAttribute("data-publish");
    try{
      const r = await fetch(`${API}/${id}/publish`, { method:"POST", headers: ADMIN_HEADERS });
      const j = await r.json();
      if(!j.ok) throw new Error(j.message || "Error al publicar");
      toastMsg("Torneo publicado. Inscripciones abiertas.");
      await refresh();
    }catch(e){
      alert(e.message||"Error"); btn.disabled=false;
    }
  });

  $("#btnReset").addEventListener("click", (e)=>{ e.preventDefault(); $("#tForm").reset(); msg.textContent=""; });

  $("#tForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    msg.textContent = "Creando..."; msg.className="muted"; btn.disabled = true;

    const body = {
      name: $("#name").value.trim(),
      startDate: $("#startDate").value,
      endDate: $("#endDate").value,
      conditions: $("#conditions").value.trim(),
      rewards: $("#rewards").value.trim()
    };

    if(!body.name || !body.startDate || !body.endDate || !body.conditions || !body.rewards){
      msg.textContent="Completa todos los campos."; msg.className="err"; btn.disabled=false; return;
    }
    if(new Date(body.endDate) <= new Date(body.startDate)){
      msg.textContent="La fecha fin debe ser posterior a la de inicio."; msg.className="err"; btn.disabled=false; return;
    }

    try{
      const r = await fetch(API, { method:"POST", headers: ADMIN_HEADERS, body: JSON.stringify(body) });
      const j = await r.json();
      if(!j.ok){ msg.textContent = j.message || "No se pudo crear."; msg.className="err"; return; }

      if($("#publishNow").checked){
        const r2 = await fetch(`${API}/${j.data._id}/publish`, { method:"POST", headers: ADMIN_HEADERS });
        const j2 = await r2.json();
        if(!j2.ok) throw new Error(j2.message || "Creado, pero error al publicar");
        toastMsg("Creado y publicado.");
      } else {
        toastMsg("Torneo creado en borrador.");
      }
      msg.textContent="Listo"; msg.className="ok";
      e.target.reset();
      await refresh();
    }catch(e){
      msg.textContent = e.message || "Error de red"; msg.className="err";
    } finally {
      btn.disabled = false;
    }
  });

  // Prefill: hoy y +9 días
  const today = new Date(); const end = new Date(today.getTime()+9*24*60*60*1000);
  $("#startDate").valueAsDate = today; $("#endDate").valueAsDate = end;

  refresh();
})();
