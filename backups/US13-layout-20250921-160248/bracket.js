(function(){
  const board = document.getElementById("board");
  const svg = board.querySelector("svg.wires");
  const split = document.getElementById("split");

  // Línea roja separadora (coincide visualmente con la ilustración)
  const Y_SPLIT = 420;
  split.style.top = Y_SPLIT+"px";

  // Columnas por ronda (x) – ajustadas para que TODO sea visible sin recortes
  const X = {
    R1:  60,   // E1..E4
    R2: 360,   // E5..E6
    R3: 720,   // E11
    F : 1060,  // GE11 (Final de ganadores) y GE13 (Final de perdedores)
    LR1: 60,   // E7..E8
    LR2: 480,  // E9..E10
    LR3: 740,  // E12
    LR4: 1020  // E13
  };

  // Posiciones (centro de cada tarjeta)
  const POS = {
    // Ganadores
    E1:{x:X.R1,y:  80}, E2:{x:X.R1,y:160}, E3:{x:X.R1,y:240}, E4:{x:X.R1,y:320},
    E5:{x:X.R2,y: 120}, E6:{x:X.R2,y:280},
    E11:{x:X.R3,y:200},
    GE11:{x:X.F ,y:190},   // Final de ganadores (tarjeta)

    // Perdedores
    E7:{x:X.LR1,y:470}, E8:{x:X.LR1,y:570},
    E9:{x:X.LR2,y:470}, E10:{x:X.LR2,y:570},
    E12:{x:X.LR3,y:520},
    E13:{x:X.LR4,y:520},
    GE13:{x:X.F , y:540}   // Final de perdedores (tarjeta)
  };

  // Helpers UI
  function card(id, area){ // area: "win" | "loss"
    const el = document.createElement("div");
    el.className = "card " + (area==="win" ? "winCard" : "lossCard");
    el.innerHTML = "<b>"+id+"</b><small>—</small>";
    const p = POS[id];
    el.style.left = (p.x-85)+"px";
    el.style.top  = (p.y-28)+"px";
    board.appendChild(el);
    // etiqueta "Final: GE11 / GE13"
    if(id==="GE11"||id==="GE13"){
      const lab = document.createElement("div");
      lab.className = "label";
      lab.textContent = (id==="GE11"?"Final: GE11":"Final: GE13");
      lab.style.left = (p.x-60)+"px";
      lab.style.top  = (p.y-48)+"px";
      board.appendChild(lab);
    }
  }
  function wire(x1,y1,x2,y2,loss){
    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    const c1x = x1+60, c1y = y1;
    const c2x = x2-60, c2y = y2;
    path.setAttribute("d",`M ${x1},${y1} C ${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`);
    path.setAttribute("class","wire"+(loss?" loss":""));
    svg.appendChild(path);
  }

  // === Dibujo de tarjetas ===
  // Ganadores
  ["E1","E2","E3","E4","E5","E6","E11","GE11"].forEach(id => card(id,"win"));
  // Perdedores
  ["E7","E8","E9","E10","E12","E13","GE13"].forEach(id => card(id,"loss"));

  // === Conexiones (GANADORES) ===
  wire(POS.E1.x+85,POS.E1.y, POS.E5.x-85,POS.E5.y, false);
  wire(POS.E2.x+85,POS.E2.y, POS.E5.x-85,POS.E5.y, false);
  wire(POS.E3.x+85,POS.E3.y, POS.E6.x-85,POS.E6.y, false);
  wire(POS.E4.x+85,POS.E4.y, POS.E6.x-85,POS.E6.y, false);
  wire(POS.E5.x+85,POS.E5.y, POS.E11.x-85,POS.E11.y, false);
  wire(POS.E6.x+85,POS.E6.y, POS.E11.x-85,POS.E11.y, false);
  wire(POS.E11.x+85,POS.E11.y, POS.GE11.x-85,POS.GE11.y, false);

  // === Conexiones (PERDEDORES) ===
  wire(POS.E7.x+85, POS.E7.y,  POS.E9.x-85, POS.E9.y,  true);
  wire(POS.E8.x+85, POS.E8.y,  POS.E10.x-85,POS.E10.y, true);
  wire(POS.E9.x+85, POS.E9.y,  POS.E12.x-85,POS.E12.y, true);
  wire(POS.E10.x+85,POS.E10.y, POS.E12.x-85,POS.E12.y, true);
  wire(POS.E12.x+85,POS.E12.y, POS.E13.x-85,POS.E13.y, true);
  wire(POS.E13.x+85,POS.E13.y, POS.GE13.x-85,POS.GE13.y,true);

  // Caídas desde ganadores hacia perdedores (aprox. como la lámina)
  wire(POS.E5.x, POS.E5.y+28, POS.E9.x-110, POS.E9.y-40,  true);  // perdedor de E5 cae a rama E9
  wire(POS.E6.x, POS.E6.y+28, POS.E10.x-110,POS.E10.y-40, true);  // perdedor de E6 cae a rama E10
  wire(POS.E11.x,POS.E11.y+28, POS.E13.x-110,POS.E13.y-40,true);  // perdedor de E11 cae a E13

  // Nota: los nombres de equipos pueden poblarse luego desde la API,
  // reemplazando el <b>E1</b> etc. por los nombres reales.
})();
