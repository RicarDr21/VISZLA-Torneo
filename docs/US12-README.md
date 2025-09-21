# VISZLA · Torneo · US-12 — Registro de equipos (Nombre + Avatar)

## Requisitos
- Node.js 18+ (recomendado 18–20).
- (Opcional) MongoDB local si deseas persistencia real.

## Arranque rápido (Windows PowerShell)
npm i
npm run dev
Start-Process "http://localhost:3000/pages/team.html"

### API útil
- `GET  /api/teams`
- `POST /api/teams` (form-data: `name`, `avatar`)
- Valida longitud, caracteres permitidos, duplicados y límite 2MB de avatar.

### Variables (.env)
PORT=3000
# MONGO_URI opcional; si no está, usa memoria.
