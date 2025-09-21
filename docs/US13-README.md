# VISZLA · Torneo · US-13 — Bracket (seed + actualización)

## Qué incluye
- Generación de cuadro **single-elimination** desde lista de equipos.
- Endpoints para setear marcador y propagar ganadores.

## Probar rápido (servidor corriendo)
# 1) Crear seed (ID "demo") con 8 equipos
$body = @{
  name="Demo Bracket"; type="single"; shuffle=$true
  teams=@("Viszla Phoenix","Lobos Azules","Tigres Dorados","Águilas Rojas","Koalas","Samuráis","Piratas","Leones")
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/tournaments/demo/seed -Method Post -ContentType "application/json" -Body $body

# 2) Ver el bracket en JSON
Invoke-RestMethod -Uri http://localhost:3000/api/tournaments/demo/bracket -Method Get

# 3) Abrir la UI pública
Start-Process "http://localhost:3000/pages/bracket.html"

# 4) (Opcional) Actualizar un match
Invoke-RestMethod -Uri http://localhost:3000/api/tournaments/demo/matches/R1M1 -Method Post -ContentType "application/json" -Body (@{scoreA=5;scoreB=2} | ConvertTo-Json)

## Notas
- BYEs automáticos si no hay potencia de 2.
- Propagación de ganadores hacia rondas siguientes.
