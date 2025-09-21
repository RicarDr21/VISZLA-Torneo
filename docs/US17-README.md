# VISZLA  Torneo  US-17  Creación de nuevo Torneo (solo admin)

## Reglas y flujo
- **Solo administradores** pueden crear.
- **Máximo 1 torneo cada 91 días**.
- Campos: nombre, fechas (inicio/fin), condiciones, recompensas.
- **Publicar** abre inscripciones y genera anuncio visible a jugadores.

## Probar (dev)
npm i
npm run dev

# Admin:
Start-Process "http://localhost:3000/admin?demoAdmin=true"

# Público:
Start-Process "http://localhost:3000/pages/anuncios.html"
Start-Process "http://localhost:3000/pages/bracket.html"
Start-Process "http://localhost:3000/pages/team.html"

## API clave
- `GET  /api/tournaments`
- `POST /api/tournaments`                 (403 sin admin; 201 con admin; 409 si viola 91d)
- `POST /api/tournaments/:id/publish`     (idempotente; genera notifications.json)
