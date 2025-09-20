# VISZLA · Torneo · US-12  
**Registro de equipos (Nombre + Avatar) con validaciones**

Este módulo permite que un **jugador** cree un equipo con **nombre** y **avatar** cumpliendo políticas de uso:
- Nombre entre **3 y 30** caracteres, solo **letras/números/espacios/guiones**.
- Bloqueo de **lenguaje ofensivo** mediante una **blacklist configurable**.
- Avatar **PNG/JPG/WEBP** con límite **≤ 2 MB**.
- Rechazo de **duplicados** (sin distinguir mayúsculas).
- Persistencia con MongoDB si se configura, o modo en memoria si no.

---

## Requisitos
- **Node.js 18+** (recomendado 18 o 20).
- (Opcional) **MongoDB** local si deseas persistencia real.
- Windows PowerShell (comandos aquí) – también hay alternativas macOS/Linux abajo.

---

## Arranque rápido (UI de jugador)

> Ejecutar en la raíz del proyecto.

### Windows (PowerShell)

```powershell
# 1) Instalar dependencias
npm i

# 2) Levantar el servidor con recarga
npm run dev

# 3) Abrir la interfaz del jugador en el navegador
start http://localhost:3000/pages/team.html

# Ver la API en JSON
start http://localhost:3000/api/teams
Variables de entorno 

Crea un archivo .env (puedes copiar desde .env.example):

PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/viszla


Si el puerto 3000 está ocupado, cambia PORT en .env o cierra el otro proceso.
Si no configuras MONGO_URI, el servidor funciona en memoria (los equipos se pierden al reiniciar)
