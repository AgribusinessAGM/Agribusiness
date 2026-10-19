# Plataforma AGRIBUSINESS — Agromillora

Plataforma para crear, ajustar y compartir modelos financieros agrícolas
(CAPEX, OPEX, rentabilidad por capas — Agrícola / SPV / Fondo — y estructura
financiera), con gestión de usuarios y permisos por modelo.

Esta rama (`php`) es la versión para **PHP + MySQL/MariaDB**, pensada para
XAMPP en local y Plesk en producción. La rama `main` es la versión anterior en
Node.js.

## Qué se necesita

- PHP 8.0 o superior, con la extensión `pdo_mysql` (XAMPP ya la trae).
- MySQL o MariaDB.
- Apache. Los `.htaccess` incluidos protegen las carpetas internas.

**No hace falta Node.js para ejecutar la app**: la interfaz ya está compilada
en la raíz del repositorio. Node.js solo se necesita para modificar la interfaz
(ver "Modificar la interfaz").

## Instalar en XAMPP (local)

1. Arranca **Apache** y **MySQL** desde el panel de XAMPP.
2. Clona este repositorio (rama `php`) dentro de la carpeta `htdocs` de tu
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

- `index.html`, `assets/` — interfaz compilada (no editar a mano)
- `api/index.php` — API (login, usuarios, invitaciones, permisos, modelos)
- `api/lib/` — conexión a MySQL y envío de correo
- `api/data/` — esquema de la base de datos y modelos de ejemplo
- `frontend/` — código fuente de la interfaz (React + TypeScript, Vite)
- `project/`, `chats/` — diseño original y transcripciones (referencia)

El `.htaccess` de la raíz impide abrir desde el navegador `frontend/`,
`project/`, `chats/`, `.git` y los `.md`.

Para publicar en Plesk basta con subir `index.html`, `.htaccess`, `assets/` y
`api/` (con su `config.php`).

## Modificar la interfaz

La interfaz está escrita en React + TypeScript y hay que compilarla tras
cualquier cambio. Requiere Node.js 20 o superior:

```bash
cd frontend
npm install
npm run build   # compila y copia el resultado a la raíz del repositorio
```

Para desarrollar con recarga automática, con XAMPP arrancado y el repositorio
en `htdocs/Agribusiness`, ejecuta `npm run dev` dentro de `frontend/` y abre
http://localhost:5173. Las llamadas a la API se redirigen al PHP de XAMPP.
