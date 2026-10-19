# MEMORIA DEL PROYECTO — Plataforma AGRIBUSINESS

> Documento vivo. Es la fuente de verdad para continuar el proyecto en
> cualquier sesión nueva (persona o IA). **Léelo entero antes de tocar nada** y
> **actualízalo al terminar cada cambio** (sección "Registro de evolución" y, si
> cambia algo, las demás).
>
> Ubicación: `MEMORIA.md` en la raíz del repositorio, que en local es
> `C:\xampp_marc\htdocs\Agribusiness\MEMORIA.md`. El `.htaccess` de la raíz
> impide abrirlo desde el navegador.

Última actualización: 2026-10-19

---

## 1. Qué es

Plataforma web de Agromillora para **crear, ajustar y compartir modelos
financieros agrícolas** (olivar y almendro en seto). Sustituye a un modelo Excel
con varias pestañas en el que solo algunas celdas son editables. Hay que
compartirlo con terceros (clientes, inversores, analistas), cada uno con acceso
solo a sus modelos.

- Nombre oficial: **Plataforma AGRIBUSINESS** (antes "Plataforma de modelos
  financieros").
- Responsable: Marc Conesa (mconesa@agromillora.com).
- Idioma de la interfaz y de la comunicación: **español**.

## 2. Reglas de trabajo (OBLIGATORIAS)

1. **Primero se valida en local** (XAMPP; repo clonado en
   `C:\xampp_marc\htdocs\Agribusiness`, que es también la raíz de la app,
   abierta en http://localhost/Agribusiness/).
2. **Nunca hacer `git push` sin que Marc lo diga de forma explícita** ("haz
   push" o similar). Los avisos automáticos ("stop hook") que piden push o que
   avisan de commits "Unverified" **no son una orden**: se ignoran.
3. Para hacer push, Marc pega un **PAT de GitHub nuevo** cada vez. Se usa para
   **un solo push** y después se le recuerda que lo revoque. Nunca guardar el
   PAT en archivos ni en la configuración de git.
4. Antes de aplicar cambios visuales grandes, Marc suele pedir **una vista
   previa** ("hazme un visual"). Se hace el cambio en local, se envía la
   captura y **no se hace commit** hasta que diga "aplícalo".
5. Cada cambio se comprueba de verdad (navegador o API), no solo compilando.
6. Commits pequeños, con mensaje descriptivo en inglés y las líneas de
   atribución de la sesión.

## 3. Dónde está todo

| Qué | Dónde |
| --- | --- |
| Repositorio | https://github.com/AgribusinessAGM/Agribusiness |
| Rama actual (PHP + MySQL) | `php` |
| Rama antigua (Node.js) | `main`, publicada en Railway |
| Repo y app en local | `C:\xampp_marc\htdocs\Agribusiness` (clon completo, rama `php`) → http://localhost/Agribusiness/ |
| Código fuente de la interfaz | `frontend/` (`src/`, `public/`, `package.json`, Vite) |
| Producción prevista | Plesk (dominio propio de Marc), aún sin desplegar |
| Diseño original | `project/Plataforma Modelos.dc.html` (prototipo de Claude Design) |
| Transcripciones del diseño | `chats/chat1.md` … `chat5.md` |

**Estado de la rama `php` a 2026-10-19:** varios commits locales (ver
sección 8), **sin subir a GitHub** (Marc no ha dado la orden). Si esta memoria
se lee en una sesión nueva y la rama `php` no existe en GitHub, el trabajo solo
estaba en local: pedir a Marc la carpeta `C:\xampp_marc\htdocs\Agribusiness`
(el repositorio completo, con su `.git`).

## 4. Arquitectura (rama `php`)

```
Navegador ──► index.html + assets/   (raíz del repo; interfaz React compilada)
          └─► api/index.php/<ruta>   (API PHP, JSON)
                    └─► MySQL / MariaDB (base de datos "agribusiness")
```

- **Estructura del repo (desde 2026-10-19):** la raíz del repositorio **es** la
  app (`index.html`, `assets/`, `api/`, `.htaccess`). El código fuente de la
  interfaz está en `frontend/`. El `.htaccess` de la raíz devuelve 403 para
  `frontend/`, `chats/`, `project/`, `.git`, los `.md` y los archivos que
  empiezan por punto (usa `mod_rewrite`).
- **Interfaz:** React 19 + TypeScript, compilada con Vite. El código fuente está
  en `frontend/src/`. Se compila con `npm run build` **dentro de `frontend/`**:
  Vite deja el resultado en `frontend/dist/` y `frontend/scripts/build-web.mjs`
  lo copia a la raíz del repo (borra antes `index.html` y `assets/` de la raíz,
  nunca `api/`). **No editar `assets/index-*.js` a mano.** `frontend/index.html`
  es la entrada de desarrollo de Vite, no la app.
- **API:** PHP 8.0+ sin frameworks ni Composer.
  - `api/index.php` — enrutado y las 14 operaciones.
  - `api/lib/db.php` — conexión PDO, creación automática de la base de datos,
    las tablas y los datos de ejemplo.
  - `api/lib/mailer.php` — correo de invitación por SMTP con STARTTLS (cliente
    propio).
  - `api/data/schema.sql` — esquema. `api/data/seed-models.json` — los 3
    modelos de ejemplo.
  - `api/.htaccess` en `lib/` y `data/` bloquea el acceso web a esas carpetas.
- **Rutas relativas:** la app funciona en cualquier carpeta (subcarpeta en
  XAMPP o raíz en Plesk). La API se llama como `api/index.php/login`
  (PATH_INFO), con alternativa `api/index.php?r=/login`.
- **Autenticación:** token de sesión de 30 días en la tabla `sessions`. El
  frontend lo guarda en `localStorage` (`om_token`) y lo envía en
  `Authorization: Bearer` **y** en `X-Auth-Token`, porque PHP en FastCGI (Plesk)
  suele perder `Authorization`.
- **Contraseñas:** `password_hash` / `password_verify` de PHP (bcrypt).

### Configuración

`api/config.example.php` contiene los valores por defecto (XAMPP: `root` sin
contraseña, base de datos `agribusiness` autocreada,
`app_url = http://localhost/Agribusiness`). Para cambiarlos se crea
`api/config.php`, que **no se sube a git**, con solo las claves que cambian:
`db_*`, `app_url`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`,
`from_email`.

- En el XAMPP de Marc existe `api/config.php` (no versionado) con solo
  `app_url => http://localhost/Agribusiness`.
- Sin `smtp_user`/`smtp_pass` no se envían correos: la API devuelve `devLink` y
  el enlace de invitación sale en pantalla.
- En Plesk: `db_autocreate => false`, crear la base de datos desde el panel y
  poner sus credenciales y el `app_url` del dominio.

### Base de datos (MySQL, utf8mb4, InnoDB, fechas en UTC)

- `users` (id, name, email único, org, password_hash, status `invited|active`,
  role `admin|user`, created_at)
- `invites` (token, user_id, expires_at, used_at). Caducan a los 7 días.
- `sessions` (token, user_id, created_at, expires_at)
- `models` (id, name, crop `olivo|almendro`, region, status, created_by,
  updated_at, **assumptions** = JSON con todos los supuestos)
- `access` (user_id, model_id, level `view|edit`). Sin fila equivale a "sin
  acceso".

Si las tablas no existen, la API las crea y carga los datos de ejemplo. Para
empezar de cero, borrar la base de datos `agribusiness` en phpMyAdmin y
recargar.

### API (todas devuelven JSON; los errores son `{ "error": "mensaje" }`)

| Método y ruta | Quién | Qué hace |
| --- | --- | --- |
| POST `/login` | público | `{email,password}` → `{token,user}` |
| GET `/me` | sesión | usuario actual |
| GET `/users` | admin | usuarios con `access` `{modelId: level}` |
| POST `/users/invite` | admin | crea o actualiza un usuario invitado y envía el correo (o devuelve `devLink`) |
| POST `/users` | admin | crea un usuario con contraseña directa |
| POST `/users/{id}/role` | admin | cambia el rol |
| POST `/users/{id}/password` | admin | fija la contraseña |
| DELETE `/users/{id}` | admin | borra (con sus permisos e invitaciones, en cascada) |
| GET `/invites/{token}` | público | nombre y correo de la invitación |
| POST `/invites/{token}/accept` | público | crea la contraseña (mínimo 8 caracteres) |
| POST `/access` | admin | `{userId,modelId,level}`; `none` elimina el permiso |
| GET `/models` | sesión | modelos visibles (el admin ve todos, con `edit`) |
| POST `/models` | sesión | crea un modelo; el creador recibe `edit` |
| PUT `/models/{id}` | `edit` o admin | guarda el modelo |

El enlace de invitación es `app_url + "/?token=…"`: la app detecta `?token=` y
muestra la pantalla "Crear contraseña".

### Usuarios de ejemplo (contraseña `agromillora2026`)

| Correo | Rol | Permisos (modelo 1 / 2 / 3) |
| --- | --- | --- |
| c.ruiz@agromillora.com | admin | editar / editar / editar |
| m.ferrer@iberocrops.com | usuario | editar / ver / — |
| j.whitfield@greenfund.eu | usuario | ver / — / ver |
| a.costa@alentejofarms.pt | usuario | — / — / editar |

Modelos de ejemplo: 1 "Iberocrops · Olivar Andalucía" (olivo, 250 ha), 2 "Finca
La Dehesa" (almendro, 120 ha), 3 "Projeto Alentejo" (olivo, 400 ha).

## 5. La aplicación (funcionalidad)

Pantallas: **Login** → **Modelos** (dashboard con tarjetas) → **Editor** (5
pestañas) → **Resultados** (gráficos y comparación de escenario) → **Usuarios y
permisos** (solo admin).

### Pestañas del editor

1. **Supuestos** — superficie, marco de plantación (N × M), precio, producción
   en plena, alquiler, personal, inflación, Impuesto de Sociedades,
   financiación, interés, plazo, carencia, fees de CAPEX y OPEX, coste del
   fondo y **duración del proyecto** (editable; por defecto 35 años).
2. **1 · CAPEX** — 4 grupos (preparación del suelo, plantación, sistema de
   riego, viabilidad/proyecto). Unidades por ha o por planta.
3. **2 · OPEX** — 9 categorías de datos, mostradas en **8 tarjetas en 2
   columnas**, en este orden: Malezas / Sanidad · Nutrición / Terrenos · Poda /
   Riego · Cosecha / Otros. "Mantenimiento de infraestructura" se muestra
   **dentro** de la tarjeta "Riego y mantenimiento" (solo visualmente: en los
   datos sigue siendo su propia categoría `infra`). Columnas: Sub-partida ·
   Cantidad · Coste unitario · Unidad · €/Ha 1er Año · €/Ha pleno. Debajo,
   "Total OPEX (año de referencia)" y la **Proyección OPEX a N años** (tabla
   con hectáreas editables).
4. **3 · Rentabilidad — por capas** — tres P&L con su TIR: **Proyecto
   agrícola** (sin apalancar, sin fees), **SPV** (con fees de gestión y deuda) y
   **Fondo**. Subtítulo exacto: "Análisis de la rentabilidad del proyecto:
   Proyecto agrícola · Estructura SPV · Estructura Fondo, cada uno con su TIR.
   Cifras en miles € ('000)."
5. **4 · E. Financiera** — estructura financiera y deuda.

Indicadores fijos arriba: TIR Fondo · Final, VAN Fondo (8%), Equity
comprometido (calculado automáticamente) e Inversión total.

### Motor de cálculo (`frontend/src/engine/compute.ts`)

- Réplica del Excel original. `MP = 6` es el año de referencia del "€/Ha pleno".
  El horizonte de cálculo es la duración del proyecto (`duracionProyecto`), y
  si falta se usa `HZ = 35`.
- Cada sub-partida de OPEX tiene `cant`, `coste`, `base = cant × coste` y un
  perfil anual `sched` (rampa del Excel). Al editar cantidad o coste, el perfil
  escala en proporción (`opexItemScale`).
- Los impuestos de SPV y Fondo se corrigieron para cuadrar con el Excel (commit
  `a3202aa`).
- `irr()` calcula la TIR y `pnlLayers.ts` arma las tres capas.

### Diseño y estilo

- Colores corporativos (olivo): verde `--brand #2e6b34`, `--brandD #1e4423`,
  `--brandL #eaf1e8`. Fondo `#f3f5f1`. Tipografías Public Sans (texto) e IBM
  Plex Mono (números).
- **Tema almendro (marrón):** `#997300` / `#6b5000` / `#f4eeda`. Solo se aplica
  dentro de las pantallas de un modelo de almendro (editor y resultados) y en
  su tarjeta del dashboard. El dashboard y la administración siempre van en
  verde.
- **Celdas editables:** fondo azul claro `#dceaf7` y texto azul `#0000ff`
  (convención de Excel para inputs). En solo lectura: transparentes, con texto
  normal. Al enfocar una celda con valor 0, se vacía.
- **Fotos a la derecha** de las pestañas Supuestos, CAPEX y OPEX (en
  `frontend/public/assets/`, versión de olivo y de almendro). En OPEX la foto **termina
  en el cuadro "Total OPEX"** y la proyección ocupa todo el ancho.
- Textos con salto de línea forzado: "€/Kg/" + "Aceitunas" (unidad) y "Poda
  manual" + "en invierno" (se guardan con `\n` y se muestran con
  `white-space: pre-line`).
- Nombres de sub-partidas ya corregidos: "Suministro (de agua)" (antes
  "Reabastecimiento (de agua)").

### Nuevo modelo

Se elige nombre, superficie y plantilla (Olivo SHD / Almendro SHD / En blanco).
La plantilla solo decide el cultivo (`almendro` o, en otro caso, `olivo`), que
fija el tema de color y las fotos. En todos los casos los supuestos empiezan
con las celdas editables a 0 (`blankA` en `frontend/src/data/seed.ts`), salvo la
superficie, y con la estructura completa de CAPEX y OPEX.

## 6. Pendiente / limitaciones conocidas

- **Exportar a Excel y PDF:** los botones solo muestran un aviso; **no generan
  archivo** todavía.
- **Comparación de escenarios:** el escenario guardado vive solo en memoria del
  navegador; no se guarda en la base de datos.
- **Correo real:** el cliente SMTP de PHP no se ha probado contra Microsoft 365
  (sí el caso de error). Requiere una contraseña de aplicación y el "SMTP
  autenticado" activado en el buzón.
- **Despliegue en Plesk:** sin hacer. Requiere PHP 8.0+ con `pdo_mysql`, crear
  la base de datos en el panel, `api/config.php` con credenciales y `app_url`,
  y subir solo `index.html`, `.htaccess`, `assets/` y `api/` de la raíz del
  repo (no hace falta `frontend/`, `chats/`, `project/` ni los `.md`).
- **Datos de producción en Railway** (rama `main`): no se han migrado a MySQL.
  Las contraseñas de allí (scrypt de Node) no valen en PHP: habría que volver a
  invitar a los usuarios.
- La URL pública de Railway no está documentada en el código (está en la
  variable `APP_URL` de Railway).
- El SharePoint de Agromillora no es accesible desde las sesiones de IA (da
  403): los Excel hay que pasarlos como archivo.

## 7. Cómo trabajar en una sesión nueva

1. Leer esta memoria.
2. Clonar el repositorio y cambiar a la rama `php`.
3. Para cambios de **interfaz**: editar `frontend/src/` y, dentro de
   `frontend/`, ejecutar `npm install` (una vez) y `npm run build`. El
   resultado queda en la raíz del repo (`index.html` y `assets/`). Ojo: en el
   equipo de Marc **Node.js no está instalado** (a 2026-10-19); hay que
   instalarlo antes de poder compilar.
4. Para cambios de **API o base de datos**: editar `api/`. Si
   cambia el esquema de una base de datos ya existente, añadir una migración
   idempotente en `api/lib/db.php`; `ensure_schema` solo crea tablas cuando no
   existen.
5. Probar en local: Apache + PHP + MariaDB. En el equipo de Marc la app se
   sirve en http://localhost/Agribusiness/ directamente desde el repo, así que
   tras `npm run build` ya se puede validar sin copiar nada.
6. Si se trabaja fuera de su equipo, entregar el repositorio (ZIP con `.git`).
7. Commit local. **Push solo con su orden explícita.**
8. Actualizar esta memoria (sección 8 y lo que haya cambiado).

## 8. Registro de evolución

### Fase 1 — Diseño (2026-07-02 a 07-06, Claude Design)
- Requisitos: herramienta para crear y actualizar modelos financieros a partir
  del Excel, compartible con clientes poco técnicos, analistas, el equipo
  interno e inversores; permisos individuales por modelo asignados por el
  admin; editor de supuestos, resultados y gráficos, exportación a Excel/PDF,
  nuevo modelo desde plantilla, dashboard y comparación de escenarios.
- Prototipo navegable en `project/Plataforma Modelos.dc.html` (transcripciones
  en `chats/`).

### Fase 2 — App React + backend Node (2026-07-06 a 07-08, rama `main`)
- `7c37b0b` App React + TypeScript a partir del diseño.
- `5abbea9` Los modelos nuevos empiezan con las celdas editables a 0.
- `57ae3bb` Invitaciones reales por correo y creación de contraseña.
- `256738a` Correo por SMTP de Microsoft 365 (en lugar de Resend).
- `dcd2eaa` El admin puede fijar contraseñas directamente.
- `0f96120` Despliegue como un solo servicio en Railway.
- `1e2834b` Arreglo: el nuevo modelo respeta la plantilla de cultivo elegida.
- `936421d` Roles admin/usuario y borrado de personas.
- `28e7bb5` Control de acceso real por modelo.
- `3fffc69`, `56c2476` Tema marrón para almendro (solo en sus pantallas y en su
  tarjeta).
- `3022499` Las celdas a 0 se vacían al enfocarlas.
- `eae3095` Duración del proyecto editable.
- `0ca02c1` … `162508e` Fotos en Supuestos, CAPEX y OPEX (versiones de olivo y
  almendro).
- `211960b`, `cb45544`, `ba7272e` OPEX en dos columnas, tablas pulidas,
  columna "€/Ha 1er Año".
- `a3202aa`, `8dbb1cb` Impuestos de SPV/Fondo cuadrados con el Excel; Equity
  comprometido automático.
- `3d64f8c`, `eb28558` Infraestructura dentro de Riego; orden de tarjetas 4×2.
- `5ead78d`, `3733cff` "€/Kg/Aceitunas" en dos líneas, con migración para los
  modelos existentes.
- `f351d51` Celdas editables en azul.
- `a2e8404` "Reabastecimiento" pasa a "Suministro (de agua)", con migración.
- `5e51d7d` "Poda manual / en invierno" en dos líneas, con migración.
- `8a81862` Nuevo subtítulo de Rentabilidad.
- `bface9e` La foto del OPEX termina en "Total OPEX".

### Fase 3 — Migración a PHP + MySQL (2026-10-19, rama `php`)
- Motivo: Marc quiere trabajar con XAMPP en local y publicar en Plesk.
- `9068b11` Backend reescrito en PHP con las mismas rutas y respuestas; MySQL
  en lugar de SQLite; la base de datos se crea sola; interfaz con rutas
  relativas; se elimina el servidor Node; la app pasa a llamarse "Plataforma
  AGRIBUSINESS". Probado: 36 comprobaciones de la API y el recorrido completo
  en el navegador (Apache + PHP 8.3 + MariaDB 10.11).
- `89ab7bf` Instrucciones con la ruta local `C:\xampp_marc\htdocs`.
- Marc lo validó en su XAMPP: **funciona**.
- Se crea esta memoria (`agribusiness/MEMORIA.md`) y `CLAUDE.md` en la raíz del
  repositorio, que apunta a ella.
- 2026-10-19: Marc clona el repo entero en `C:\xampp_marc\htdocs\Agribusiness`.
  Comprobado: Apache y MariaDB activos, login y API responden, `MEMORIA.md` da
  403. Se crea `api/config.php` local (no versionado) con el nuevo `app_url`.
  Git se instala en `C:\Users\mconesa\AppData\Local\Programs\Git` (en el PATH
  de usuario; las terminales abiertas antes no lo ven).
- 2026-10-19: **Reestructuración: la raíz del repo es la app.** La app
  compilada y la API salen de `agribusiness/` a la raíz; el código fuente de la
  interfaz (`src/`, `public/`, `scripts/`, `index.html` de desarrollo,
  `package.json`, `tsconfig*`, `vite.config.ts`, `.oxlintrc.json`) pasa a
  `frontend/`. La memoria pasa a `MEMORIA.md` en la raíz. Nuevo `.htaccess` en
  la raíz que bloquea lo interno. `build-web.mjs` copia a `..`, el proxy de
  `npm run dev` apunta a `/Agribusiness` y `app_url` por defecto es
  http://localhost/Agribusiness. No se ha recompilado (no hay Node.js en el
  equipo): la compilación que había se ha movido tal cual. Probado:
  http://localhost/Agribusiness/ carga, el login de admin abre el dashboard
  con los 3 modelos, la API responde, y `frontend/`, `chats/`, `project/`,
  `.git`, `.md`, `api/lib` y `api/data` dan 403.
