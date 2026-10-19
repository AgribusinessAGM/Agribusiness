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
- Apache. El `.htaccess` incluido protege las carpetas internas de la API.

**No hace falta Node.js para ejecutar la app**: la interfaz ya está compilada
dentro de `agribusiness/`. Node.js solo se necesita para modificar la interfaz
(ver "Modificar la interfaz").

## Instalar en XAMPP (local)

1. Arranca **Apache** y **MySQL** desde el panel de XAMPP.
2. Copia la carpeta `agribusiness/` de este repositorio dentro de
   `C:\xampp\htdocs\`, de forma que quede `C:\xampp\htdocs\agribusiness\index.html`.
3. Abre http://localhost/agribusiness/

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

Los valores por defecto están en `agribusiness/api/config.example.php`. Para
cambiar algo (contraseña de MySQL, correo SMTP, URL pública), copia ese archivo
como `agribusiness/api/config.php` y edita solo lo necesario. `config.php` no se
sube a git porque contiene contraseñas.

Sin SMTP configurado no se envían correos de invitación: el enlace para crear
la contraseña se muestra en la pantalla de administración.

## Estructura

- `agribusiness/` — **la app lista para copiar** a `htdocs` o a Plesk:
  - `index.html`, `assets/` — interfaz compilada (no editar a mano)
  - `api/index.php` — API (login, usuarios, invitaciones, permisos, modelos)
  - `api/lib/` — conexión a MySQL y envío de correo
  - `api/data/` — esquema de la base de datos y modelos de ejemplo
- `src/` — código fuente de la interfaz (React + TypeScript)
- `project/`, `chats/` — diseño original y transcripciones (referencia)

## Modificar la interfaz

La interfaz está escrita en React + TypeScript y hay que compilarla tras
cualquier cambio. Requiere Node.js 20 o superior:

```bash
npm install
npm run build   # compila y copia el resultado dentro de agribusiness/
```

Para desarrollar con recarga automática, con XAMPP arrancado y la app en
`htdocs/agribusiness`, ejecuta `npm run dev` y abre http://localhost:5173. Las
llamadas a la API se redirigen al PHP de XAMPP.
