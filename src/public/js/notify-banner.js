(function(){
  async function load(){
    try{
      const r = await fetch("/notifications.json", { cache: "no-store" });
      if(!r.ok) return;
      const list = await r.json();
      if(!Array.isArray(list) || !list.length) return;
      const n = list.find(x => x.type === "tournament_published");
      if(!n) return;

      // Mostrar hasta 14 días
      const days = (Date.now() - new Date(n.at).getTime()) / 86400000;
      if (days > 14) return;

      const bar = document.createElement("div");
      bar.setAttribute("role","status");
      bar.style.cssText = "position:sticky;top:0;z-index:9999;background:#0f172a;color:#e5e7eb;border-bottom:1px solid #374151;padding:10px 14px;font:14px system-ui,Segoe UI,Roboto,Arial,sans-serif;display:flex;gap:10px;align-items:center;justify-content:center";
      bar.innerHTML = `🎉 Nuevo torneo publicado: <b>${n.name}</b> — ¡inscripciones abiertas!`;
      document.body.prepend(bar);
    }catch(_e){}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
