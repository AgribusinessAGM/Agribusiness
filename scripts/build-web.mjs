// Copia el frontend compilado (dist/) dentro de agribusiness/, junto a la API
// PHP. agribusiness/ es la carpeta que se copia tal cual a htdocs o a Plesk.
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';

const out = 'agribusiness';

// Borra la compilación anterior sin tocar la API (api/).
rmSync(`${out}/index.html`, { force: true });
if (existsSync(`${out}/assets`)) rmSync(`${out}/assets`, { recursive: true });

for (const entry of readdirSync('dist')) {
  cpSync(`dist/${entry}`, `${out}/${entry}`, { recursive: true });
}
console.log(`[build-web] Frontend copiado a ${out}/`);
