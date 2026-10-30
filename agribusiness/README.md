# Plataforma AGRIBUSINESS — Agromillora

Plataforma para crear, ajustar y compartir modelos financieros agrícolas
(CAPEX, OPEX, rentabilidad por capas — Agrícola / SPV / Fondo — y estructura
financiera), con gestión de usuarios y permisos por modelo.

Es la versión para **PHP + MySQL/MariaDB**, pensada para XAMPP en local y
Plesk en producción. Vive en la carpeta `agribusiness/` del repositorio de apps
(la raíz es el catálogo, ver el [README de la raíz](../README.md)). Se trabaja
solo en la rama `main`. La versión anterior en Node.js se conserva en la
etiqueta `archive/node-main`.

## Qué se necesita

- PHP 8.0 o superior, con la extensión `pdo_mysql` (XAMPP ya la trae).
- MySQL o MariaDB.
- Apache. Los `.htaccess` incluidos protegen las carpetas internas.

**No hace falta Node.js ni ninguna compilación**, ni para ejecutar la app ni
para modificarla: la interfaz son archivos JavaScript que el navegador carga
tal cual (ver "Modificar la interfaz").

## Instalar en XAMPP (local)

1. Arranca **Apache** y **MySQL** desde el panel de XAMPP.
2. Clona este repositorio (rama `main`) dentro de la carpeta `htdocs` de tu
   XAMPP, de forma que quede
   `C:\xampp_marc\htdocs\Agribusiness\agribusiness\index.html`.
3. Crea `agribusiness/api/config.php` para pruebas en local:

   ```php
   <?php
   return [
       'demo_users' => true,     // usuarios de ejemplo (solo en local)
       'dev_show_links' => true, // enlaces de alta en pantalla, sin correo
   ];
   ```

4. Abre http://localhost/Agribusiness/agribusiness/ (o el catálogo,
   http://localhost/Agribusiness/, y pulsa el cuadro de AgriBusiness).

La primera vez, la app crea sola la base de datos `agribusiness` con sus tablas
y los datos de ejemplo. Usa la configuración por defecto de XAMPP (usuario
`root` sin contraseña).

Usuarios de ejemplo (solo con `demo_users`), todos con la contraseña
`agromillora2026`:

| Correo | Rol |
| --- | --- |
| c.ruiz@agromillora.com | administrador |
| m.ferrer@iberocrops.com | usuario |
| j.whitfield@greenfund.eu | usuario |
| a.costa@alentejofarms.pt | usuario |

Para empezar de cero, borra la base de datos `agribusiness` desde phpMyAdmin
(http://localhost/phpmyadmin): se volverá a crear al recargar la app.

## Configuración

Los valores por defecto están en `api/config.example.php`. Para cambiar algo
(contraseña de MySQL, correo SMTP, URL pública), copia ese archivo como
`api/config.php` y edita solo lo necesario. `config.php` no se sube a git
porque contiene contraseñas.

Sin SMTP configurado no se envían correos de invitación. Solo con
`dev_show_links` (en local) el enlace para crear la contraseña se muestra en la
pantalla de administración.

## Estructura

Todo dentro de `agribusiness/` (las rutas son relativas a esa carpeta):

- `index.html` — página de entrada (carga `app/main.js`)
- `app.json`, `icon.svg` — nombre, descripción e icono para el catálogo
- `app/` — **código de la interfaz** (React en JavaScript, sin compilar)
  - `components/` — pantallas y piezas de la interfaz
  - `engine/` — motor de cálculo (`compute.js`, réplica del Excel; y
    `computeIAG.js`, el del modelo Torrimpietra)
  - `state/store.js` — estado de la app y acciones
  - `data/` — estructura base de CAPEX y OPEX (`iag.js`: modelo Torrimpietra)
  - `i18n/` — traducción español / inglés (`dict.js` es el diccionario)
  - `components/report/` — informe PDF (se imprime desde el navegador)
  - `styles.css` — estilos globales
- `assets/` — imágenes y `vendor/` (React, React DOM y htm, copiados aquí
  para no depender de internet)
- `api/index.php` — API (login, usuarios, invitaciones, permisos, modelos)
- `api/lib/` — conexión a MySQL y envío de correo
- `api/data/` — esquema de la base de datos y modelos de ejemplo
- `project/`, `chats/` — diseño original y transcripciones (referencia)

El `.htaccess` de `agribusiness/` impide abrir desde el navegador `project/`,
`chats/` y los `.md`, añade cabeceras de seguridad y hace que el navegador no
use copias antiguas de los `.js` y `.css`. El `.htaccess` de la raíz protege
`.git`, `.claude/` y `.codex/`.

## Publicar en Plesk

1. Requisitos: PHP 8.0 o superior con `pdo_mysql`, `mbstring` y `openssl`.
2. Crea la base de datos y su usuario desde el panel.
3. En la carpeta `agribusiness/` del dominio sube **solo** `index.html`,
   `.htaccess`, `app.json`, `icon.svg`, `app/`, `assets/` y `api/`. No subas
   `project/` (tiene Excel de clientes), `chats/` ni los `.md`. El catálogo
   (`index.php`, `.htaccess` y `assets/` de la raíz) va en la raíz del dominio.
4. Crea `agribusiness/api/config.php` con, al menos:

   ```php
   <?php
   return [
       'db_name' => '...', 'db_user' => '...', 'db_pass' => '...',
       'db_autocreate' => false,
       'app_url' => 'https://tu-dominio/agribusiness',
       'admin_email' => 'tu-correo@agromillora.com',
       'smtp_user' => '...', 'smtp_pass' => '...',
   ];
   ```

   **Nunca** pongas `demo_users` ni `dev_show_links` a `true` en producción.
5. Abre la app y pulsa "He olvidado mi contraseña" con el correo de
   `admin_email`: llega el enlace para crear la contraseña del primer
   administrador. Desde ahí se invita al resto.

Plesk sirve los archivos estáticos con nginx, que **no lee los `.htaccess`**:
añade las directivas de nginx del [README de la raíz](../README.md#publicar-en-plesk)
(bloquean `chats/`, `project/`, `api/lib/`, `api/data/` y los `.md`).

Comprueba también que los `.js` se sirven como `text/javascript` (los módulos
del navegador lo exigen).

## Modificar la interfaz

Edita el archivo que toque dentro de `app/` y recarga el navegador. No hay
que instalar ni compilar nada.

Los componentes usan React con plantillas `html` en lugar de JSX (librería
[htm](https://github.com/developit/htm)). Se escribe casi igual que HTML:

```js
html`<button onClick=${guardar} style=${{ color: 'red' }}>Guardar</button>`
html`<${NumberField} id="sup:superficie" value=${a.superficie} />`
```

Los textos se escriben en español. Si añades uno nuevo, añade también su
traducción al inglés en `app/i18n/dict.js` (el selector de idioma de la barra
superior la usa para traducir la pantalla).

Si algo no se ve, abre la consola del navegador (F12): ahí aparecen los
errores con el archivo y la línea.
