# Apps de Agromillora

Repositorio de aplicaciones web pequeñas de Agromillora (PHP + MySQL, sin
compilación). La raíz es un **catálogo**: `index.php` muestra un cuadro por cada
app y, al pulsarlo, la abre.

| App | Carpeta | Qué es |
| --- | --- | --- |
| AgriBusiness | [`agribusiness/`](agribusiness/README.md) | Modelos financieros agrícolas (CAPEX, OPEX, rentabilidad, estructura financiera) |

## Ejecutar en local

Clona el repositorio dentro de `htdocs` (XAMPP) o `www` (Laragon) con el nombre
`apps`, para no confundir la raíz (el catálogo) con la carpeta de cada app:

```bash
git clone https://github.com/AgribusinessAGM/Agribusiness.git apps
```

Y abre http://localhost/apps/.
Cada app tiene sus propios requisitos e instrucciones en su README.

## Añadir una app

1. Crea una carpeta en la raíz, por ejemplo `mi-app/`, con su `index.html` o
   `index.php`.
2. Añade `mi-app/app.json`:

   ```json
   {
     "name": "Mi app",
     "description": "Qué hace, en una línea.",
     "icon": "icon.svg"
   }
   ```

   `icon` es relativo a la carpeta de la app (SVG o PNG cuadrado). Sin icono,
   el cuadro muestra la inicial del nombre.
3. Recarga el catálogo: la app aparece sola, ordenada por nombre.

Si la app tiene datos o archivos internos, protégelos con su propio
`.htaccess` (mira `agribusiness/.htaccess`).

## Publicar en Plesk

Sube `index.php`, `.htaccess`, `assets/` y la carpeta de cada app (siguiendo las
instrucciones de su README). La raíz del dominio es el catálogo. No subas
`.git`, `.claude/`, `.codex/` ni los `.md`.

Plesk sirve los archivos estáticos con nginx, que **no lee los `.htaccess`**. En
*Configuración de Apache y nginx → Directivas adicionales de nginx* añade:

```nginx
location ~ /(\.git|\.claude|\.codex|chats|project|api/lib|api/data)(/|$) { deny all; }
location ~ /api/config(\.example)?\.php$ { deny all; }
location ~ \.md$ { deny all; }
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "same-origin" always;
```
