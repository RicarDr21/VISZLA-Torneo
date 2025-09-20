# US-13  Visualización del árbol del torneo (Bracket)

## 1) Arranque rápido
- Inicia el servidor del proyecto (por ejemplo: \
pm run dev\ o \
pm start\).
- Abre el navegador en:

\\\
http://localhost:3000/pages/bracket.html?tournamentId=demo&team=Koalas
\\\

> \	ournamentId\ es el **ID** del torneo (slug que usa la API).
> \	eam\ es el **nombre de tu equipo** para resaltarlo en la UI.

## 2) ¿Qué hace la pantalla?
- Muestra las rondas **Cuartos → Semifinales → Final**.
- Conectores curvos indican el flujo hacia la derecha.
- Debajo verás una leyenda:
  - **Azul**: tu equipo.
  - **Verde**: partido ganado.
  - **Gris**: partido pendiente.
- A la derecha: “**Siguiente de mi equipo**” muestra tu próximo partido.

## 3) Tabla de endpoints (para referencia)
- \GET  /api/tournaments/{id}/bracket\ : obtiene el bracket.
- \POST /api/tournaments/{id}/seed\     : crea/siembra el torneo.
- \POST /api/tournaments/{id}/matches/{matchId}\ : reporta resultado.
- \SSE  /api/bracket/stream/{id}\       : actualizaciones en vivo (UI se refresca sola).

## 4) Sembrar y simular (opcional, desde PowerShell)
\\\powershell
# Sembrar 'demo'
curl.exe -s -X DELETE "http://localhost:3000/api/tournaments/demo/seed"
 = @{
  id = "demo"
  name = "Torneo Demo"
  type = "single"
  teams = @(
    "Viszla Phoenix","Lobos Azules","Tigres Dorados","Águilas Rojas",
    "Koalas","Samuráis","Piratas","Leones"
  )
}
 =  | ConvertTo-Json -Depth 5 -Compress
 = Join-Path C:\Users\DAVIDH~1\AppData\Local\Temp "seed-demo.json"
Set-Content -Path  -Value  -Encoding UTF8
curl.exe -s -X POST "http://localhost:3000/api/tournaments/demo/seed" 
  -H "Content-Type: application/json" --data-binary "@"

# (Opcional) Reportar resultados rápidos
function Set-Result([string],[int],[int]){
     = "http://localhost:3000/api/tournaments/demo/matches/"
   = '{"scoreA":'++',"scoreB":'++'}'
  curl.exe -s -X POST  -H "Content-Type: application/json" -d  | Out-Null
  Start-Sleep -Milliseconds 120
}

Set-Result R1M1 2 1
Set-Result R1M2 0 2
Set-Result R1M3 2 0
Set-Result R1M4 1 2
Set-Result R2M1 2 0
Set-Result R2M2 2 1
Set-Result R3M1 3 2
\\\

## 5) Registro de equipos (US-12)
- Pantalla: \http://localhost:3000/pages/teams.html\
- Permite crear equipos con nombre y avatar. (La etiqueta US-12 fue retirada del header para vista pública.)
