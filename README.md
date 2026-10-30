# Plataforma AGRIBUSINESS — Agromillora

Plataforma para crear, ajustar y compartir modelos financieros agrícolas
(CAPEX, OPEX, rentabilidad por capas — Agrícola / SPV / Fondo — y estructura
financiera), con gestión de usuarios y permisos por modelo.

Es la versión para **PHP + MySQL/MariaDB**, pensada para XAMPP en local y
Plesk en producción. Se trabaja solo en la rama `main`. La versión anterior en
Node.js se conserva en la etiqueta `archive/node-main`.

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
   XAMPP, de forma que quede `C:\xampp_marc\htdocs\Agribusiness\index.html`.
3. Abre http://localhost/Agribusiness/

La primera vez, la app crea sola la base de datos `agribusiness` con sus tablas
y los datos de ejemplo. Usa la configuración por defecto de XAMPP (usuario
`root` sin contraseña).

Usuarios de ejemplo, todos con la contraseña `agromillora2026`:

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

Sin SMTP configurado no se envían correos de invitación: el enlace para crear
la contraseña se muestra en la pantalla de administración.

## Estructura

La raíz del repositorio es la app:

- `index.html` — página de entrada (carga `app/main.js`)
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

El `.htaccess` de la raíz impide abrir desde el navegador `project/`,
`chats/`, `.git` y los `.md`, y hace que el navegador no use copias antiguas
de los `.js` y `.css`.

Para publicar en Plesk basta con subir `index.html`, `.htaccess`, `app/`,
`assets/` y `api/` (con su `config.php`).

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
