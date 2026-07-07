# Plataforma de modelos financieros — Agromillora

Plataforma para crear, ajustar y compartir modelos financieros agrícolas
(CAPEX, OPEX, rentabilidad por capas — Agrícola / SPV / Fondo — y estructura
financiera), con gestión de usuarios y permisos por modelo.

Implementación en React + TypeScript (Vite) a partir del diseño en
`project/Plataforma Modelos.dc.html`, con un backend mínimo (Express +
`node:sqlite`) para usuarios reales, invitaciones por correo y permisos.

## Ejecutar en local

Requiere Node.js ≥ 22.5 (usa el módulo experimental `node:sqlite`).

```bash
npm install
npm run server   # backend en http://localhost:8787
npm run dev      # frontend en http://localhost:5173 (proxy /api -> :8787)
```

Usuarios de ejemplo (ver `server/db.js`): cualquiera de los correos ahí
listados con la contraseña `agromillora2026`.

## Compilar y ejecutar en producción

```bash
npm run build   # compila el frontend a dist/
npm start        # un solo proceso sirve la API y el frontend ya compilado
```

## Variables de entorno

Copia `.env.example` a `.env` y rellena lo necesario. Lo más relevante:

- `SMTP_USER` / `SMTP_PASS` — cuenta de Microsoft 365 que envía las
  invitaciones por correo (opcional: sin esto, el enlace de invitación se
  muestra en la interfaz en vez de enviarse).
- `APP_URL` — URL pública de la app, usada para construir el enlace de
  "crea tu contraseña".
- `DB_PATH` — ruta del fichero SQLite. En un host con filesystem efímero
  (Railway, etc.), apunta a un Volume persistente (ej. `/data/data.db`).

## Estructura

- `src/` — frontend (React + TypeScript)
- `server/` — backend (Express + SQLite)
- `project/` — bundle de diseño original (Claude Design) — referencia, no se ejecuta
- `chats/` — transcripciones del diseño original — referencia
