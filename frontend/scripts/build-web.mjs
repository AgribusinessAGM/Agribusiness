// Copia el frontend compilado (dist/) a la raíz del repositorio, junto a la API
// PHP. La raíz del repositorio es la carpeta que se sirve en htdocs o en Plesk.
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';

const out = '..';

// Borra la compilación anterior sin tocar la API (api/).
rmSync(`${out}/index.html`, { force: true });
if (existsSync(`${out}/assets`)) rmSync(`${out}/assets`, { recursive: true });

for (const entry of readdirSync('dist')) {
  cpSync(`dist/${entry}`, `${out}/${entry}`, { recursive: true });
}
console.log('[build-web] Frontend copiado a la raíz del repositorio');
