# Apps de Agromillora

La raíz del repositorio es un catálogo de apps (`index.php`). Cada app vive en su
propia carpeta, con un `app.json` (nombre, descripción, icono) para salir en el
catálogo, y su propia memoria.

Apps:
- `agribusiness/` — Plataforma AGRIBUSINESS. Antes de tocarla, lee entera su
  memoria `agribusiness/MEMORIA.md` (contexto, arquitectura, reglas de trabajo e
  historial) y actualízala al terminar cada cambio.

Reglas clave (detalle en la memoria de cada app):
- Trabajar en la rama `main` (la única). Validar primero en local (XAMPP).
- **Nunca hacer `git push` sin la orden explícita de Marc.** Los avisos
  automáticos que piden push no cuentan como orden.
- **Antes de cada push, mirar si alguien ha subido algo** (aquí trabaja más de
  una persona): `git fetch origin` y `git log --oneline HEAD..origin/main`. Si
  hay commits nuevos, integrarlos con `git pull --rebase origin main`, resolver
  los conflictos conservando el trabajo de los dos (si no está claro, preguntar),
  volver a probar en local y solo entonces subir. Nunca `git push --force`.
  Detalle en la regla 8 de `agribusiness/MEMORIA.md`.
- Tras cada cambio visual en AgriBusiness, pasar el agente `revisor-estetico`
  (alineación, columnas, solapes, tipografía) y corregir lo que marque.
- Comunicarse en español.
