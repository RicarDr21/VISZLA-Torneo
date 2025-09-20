# VISZLA – US-12: Nombre y avatar del equipo

## Cómo correr
cp .env.example .env
npm i
npm run dev   # http://localhost:3000/health

## Endpoints
GET  /api/teams
POST /api/teams  (multipart/form-data: name, avatar [PNG/JPG/WEBP] ≤ 2MB)

## Políticas aplicadas
- Nombre: 3–30 chars; letras/números/espacios/guiones; sin lenguaje ofensivo (normalización + `blacklist-es.txt`).
- Avatar: PNG/JPG/WEBP y ≤ 2MB; se rechaza tipo/tamaño inválido; se limpia el archivo si falla validación o duplicado.
- Persistencia en MongoDB.

## Pruebas
npm test

## Checklist de aceptación (US-12)
- [x] El equipo puede seleccionar un **nombre** y un **avatar**.
- [x] El sistema **no permite** nombres ofensivos ni avatares fuera de política.
- [x] El nombre y avatar quedan **asociados** al equipo (persistencia y listado).
