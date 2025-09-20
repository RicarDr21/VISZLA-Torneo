(() => {
  const $ = (q, d=document) => d.querySelector(q);
  const $$ = (q, d=document) => Array.from(d.querySelectorAll(q));

  const nameInput = $("#teamName");
  const fileInput = $("#file");
  const drop = $("#drop");
  const pick = $("#pick");
  const submitBtn = $("#submit");
  const clearBtn = $("#clear");
  const countEl = $("#count");
  const listEl = $("#list");
  const emptyEl = $("#empty");
  const qInput = $("#q");
  const refreshBtn = $("#refresh");
  const toast = $("#toast");

  const API = "/api/teams";
  let selectedFile = null;

  // ------- helpers -------
  const showToast = (msg, type="ok") => {
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = "block";
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.style.display="none", 2800);
  };

  const setCount = () => { countEl.textContent = (nameInput.value || "").length; };

  const validName = (name) => /^[A-Za-z0-9\s-]{3,30}$/.test(name);

  const validateImage = (file) => {
    if (!file) return { ok:false, err:"Seleccione una imagen." };
    const okType = ["image/png","image/jpeg","image/webp"].includes(file.type);
    if (!okType) return { ok:false, err:"Formato inválido. Use PNG/JPG/WEBP." };
    if (file.size > 2*1024*1024) return { ok:false, err:"Archivo demasiado grande (máx 2MB)." };
    return { ok:true };
  };

  const clearForm = () => {
    nameInput.value = "";
    setCount();
    fileInput.value = "";
    selectedFile = null;
    drop.classList.remove("drag");
    drop.querySelector("div > div").innerHTML = 'Arrastra tu imagen aquí o <u id="pick">haz clic para seleccionar</u>';
    // re-vincula el pick (porque lo reescribimos)
    $("#pick").addEventListener("click", () => fileInput.click());
  };

  // ------- drag & drop -------
  ["dragenter","dragover"].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); e.stopPropagation(); drop.classList.add("drag");
  }));
  ["dragleave","drop"].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); e.stopPropagation(); drop.classList.remove("drag");
  }));
  drop.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    const v = validateImage(f);
    if (!v.ok) { showToast(v.err, "err"); return; }
    selectedFile = f;
    drop.querySelector("small").textContent = `${f.name} · ${(f.size/1024).toFixed(0)}KB`;
  });
  pick.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const v = validateImage(f);
    if (!v.ok) { showToast(v.err, "err"); fileInput.value=""; return; }
    selectedFile = f;
    drop.querySelector("small").textContent = `${f.name} · ${(f.size/1024).toFixed(0)}KB`;
  });

  // ------- contador y búsqueda -------
  nameInput.addEventListener("input", setCount);
  qInput.addEventListener("input", () => renderTeams(_teams)); // filtra en vivo

  // ------- cargar equipos -------
  let _teams = [];
  const loadTeams = async () => {
    try{
      const res = await fetch(API);
      if (!res.ok) throw new Error("No se pudo obtener la lista");
      _teams = await res.json();
      renderTeams(_teams);
    }catch(err){
      console.error(err);
      showToast("Error cargando equipos", "err");
    }
  };

  const renderTeams = (teams) => {
    const term = (qInput.value || "").trim().toLowerCase();
    const filtered = term ? teams.filter(t => t.name.toLowerCase().includes(term)) : teams;
    listEl.innerHTML = "";
    if (!filtered.length){
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";
    for (const t of filtered){
      const el = document.createElement("div");
      el.className = "team";
      const img = document.createElement("img");
      img.src = t.avatarUrl || "/pages/placeholder-avatar.png";
      img.alt = `Avatar de ${t.name}`;
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = t.name;
      const meta = document.createElement("div");
      meta.className = "meta";
      const dt = new Date(t.createdAt || Date.now());
      meta.textContent = `Creado: ${dt.toLocaleString()}`;
      el.append(img, name, meta);
      listEl.appendChild(el);
    }
  };

  refreshBtn.addEventListener("click", loadTeams);

  // ------- submit -------
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const name = (nameInput.value || "").trim();
    if (!validName(name)) { showToast("Nombre inválido. 3–30 y sin símbolos.", "err"); return; }
    const iv = validateImage(selectedFile);
    if (!iv.ok) { showToast(iv.err, "err"); return; }

    const fd = new FormData();
    fd.append("name", name);
    fd.append("avatar", selectedFile);

    submitBtn.disabled = true; submitBtn.style.opacity = .7;
    try{
      const res = await fetch(API, { method:"POST", body: fd });
      const data = await res.json().catch(()=> ({}));
      if (res.status === 201){
        showToast("Equipo creado ✅", "ok");
        clearForm();
        await loadTeams();
      }else{
        showToast(data?.error || "No se pudo crear el equipo", "err");
      }
    }catch(err){
      console.error(err);
      showToast("Error de red", "err");
    }finally{
      submitBtn.disabled = false; submitBtn.style.opacity = 1;
    }
  });

  clearBtn.addEventListener("click", (e)=>{ e.preventDefault(); clearForm(); });

  // init
  clearForm();
  loadTeams();
})();
