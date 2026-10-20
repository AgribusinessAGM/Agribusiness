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
3. Para hacer push (solo con su orden): en su equipo Git usa Git Credential
   Manager. Desde la sesión de IA no puede pedir credenciales, así que el push
   se lanza en una pestaña de la terminal de la app y Marc inicia sesión en
   GitHub en el navegador (desde 2026-10-19 la credencial queda guardada).
   Nunca pedir, escribir ni guardar tokens o contraseñas.
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
| Código de la interfaz | `app/` (JavaScript sin compilar; React en `assets/vendor/`) |
| Producción prevista | Plesk (dominio propio de Marc), aún sin desplegar |
| Diseño original | `project/Plataforma Modelos.dc.html` (prototipo de Claude Design) |
| Diseño nuevo (2026-10-19) | `project/design-nuevo/` — paquete de Claude Design (zip y su contenido): `Plataforma Modelos.dc.html`, `Informe PDF*.dc.html`, `RentTable.dc.html`, `i18n-dict.js`, Excels en `uploads/` |
| Transcripciones del diseño | `chats/chat1.md` … `chat5.md` |

**Estado de la rama `php`:** publicada en GitHub (por orden de Marc) y con
seguimiento de `origin/php`. Lo que está subido y lo que solo está en local se
comprueba con `git status -sb` (aquí no se apuntan hashes: cada apunte sería un
commit nuevo pendiente de subir).

Claude Design: desde la sesión de IA no se puede leer un proyecto de Claude
Design. Marc exporta el paquete ("handoff" en zip) y lo deja en `project/`.

### Entorno del equipo de Marc (Windows 11)

- XAMPP en `C:\xampp_marc` (Apache + MariaDB + PHP en `C:\xampp_marc\php`).
- **Git** instalado en `C:\Users\mconesa\AppData\Local\Programs\Git`
  (en el PATH de usuario; desde la sesión de IA conviene llamar a
  `...\Git\cmd\git.exe` con la ruta completa). Identidad global: Marc Conesa
  <mconesa@agromillora.com>.
- **Node.js no está instalado** y no hace falta (ver sección 4).
- `winget` no está disponible.

## 4. Arquitectura (rama `php`)

```
Navegador ──► index.html → app/main.js   (interfaz React, módulos JS sin compilar)
          └─► api/index.php/<ruta>      (API PHP, JSON)
                    └─► MySQL / MariaDB (base de datos "agribusiness")
```

- **Sin Node.js (desde 2026-10-19):** no hay ningún paso de compilación ni
  `package.json`. Para cambiar la interfaz se edita el `.js` de `app/` y se
  recarga el navegador. **No volver a introducir Node, npm, Vite ni
  TypeScript**: es un requisito de Marc.
- **Estructura del repo:** la raíz del repositorio **es** la app
  (`index.html`, `app/`, `assets/`, `api/`, `.htaccess`). El `.htaccess` de la
  raíz devuelve 403 para `chats/`, `project/`, `.git`, los `.md` y los archivos
  que empiezan por punto (usa `mod_rewrite`), y pone `Cache-Control: no-cache`
  a `.html`, `.js` y `.css` (usa `mod_headers`) para que un cambio se vea con
  solo recargar.
- **Interfaz:** React 19.2.7 en JavaScript (módulos ES). En lugar de JSX se usa
  la librería **htm** (plantillas `` html`…` `` de `app/lib/html.js`): valores
  y eventos con `${…}`, componentes con `<${Comp} />`, cierre con `<//>`; las
  entidades HTML (`&nbsp;`) no se traducen, se usa `${' '}` (espacio duro). Los tipos de
  datos están documentados con JSDoc en `app/types.js`.
  - `index.html` define un *import map*: `react`, `react-dom/client` y `htm`
    apuntan a `assets/vendor/` (versiones de producción descargadas una vez de
    jsDelivr, con sus imports reescritos a rutas locales; no se usa internet
    en tiempo de ejecución salvo Google Fonts).
  - Para actualizar React: descargar de jsDelivr `react@X/+esm`,
    `react-dom@X/+esm`, `react-dom@X/client/+esm` y la versión de `scheduler`
    que pida, y cambiar los `"/npm/…/+esm"` por `"./react.js"`, etc.
  - `app/components/` pantallas; `app/engine/` motor de cálculo;
    `app/state/store.js` estado y acciones; `app/data/` plantillas de
    CAPEX/OPEX; `app/styles.css` estilos globales.
  - **Idioma ES/EN** (`app/i18n/`): selector en la barra superior, se guarda en
    `localStorage` (`om_lang`). Igual que en el diseño, los componentes se
    escriben en español y `translate.js` reescribe el texto del DOM con el
    diccionario `dict.js` (pares `[español, inglés]` y patrones como "Año N");
    un `MutationObserver` traduce lo que React vaya pintando. Hacia el inglés
    también sustituye frases conocidas dentro de un texto; hacia el español solo
    textos completos (las partidas en inglés del Excel IAG), para no estropear
    los textos de la app. `data-i18n-skip` excluye un elemento. **Al añadir un
    texto visible nuevo, añadir su par al diccionario**, y escribirlo en un solo
    nodo (`${'sobre ' + n + ' Ha'}` en lugar de `sobre ${n} Ha`) para que se
    pueda traducir entero. Los números se formatean según el idioma
    (`setNumLang` en `engine/format.js`: 1.234,5 / 1,234.5).
  - **Informe PDF** (`app/components/report/`): se ve dentro de la pestaña
    Informe del editor (a ella llevan "Exportar informe" de Resultados y el
    botón PDF de la barra lateral), reducido con `zoom` para caber en el ancho.
    Páginas A4 que se imprimen con el botón "Imprimir" (`window.print()`: el
    usuario elige impresora o "Guardar como PDF"); las de rentabilidad usan la
    página con nombre `landscape` de `styles.css`. Al imprimir (también con
    Ctrl+P) `Report.js` monta en `beforeprint` una copia de las páginas en
    `<body>` (`.print-portal`, con `createPortal` de `react-dom`, añadido al
    import map) y la CSS de impresión oculta `#root`.
- **API:** PHP 8.0+ sin frameworks ni Composer.
  - `api/index.php` — enrutado y las 14 operaciones.
  - `api/lib/db.php` — conexión PDO, creación automática de la base de datos,
    las tablas y los datos de ejemplo.
  - `api/lib/mailer.php` — correo de invitación por SMTP con STARTTLS (cliente
    propio).
  - `api/data/schema.sql` — esquema. `api/data/seed-models.json` — los 3
    modelos de ejemplo. `api/data/seed-iag.json` — el modelo Torrimpietra
    (generado con `baseIAG()` de `app/data/iag.js`; si se cambia uno, cambiar
    el otro). `ensure_iag_model()` lo crea también en bases de datos ya
    existentes si no hay ningún modelo con `"engine":"iag"`, con acceso de
    edición para los administradores.
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
La Dehesa" (almendro, 120 ha), 3 "Projeto Alentejo" (olivo, 400 ha) y 4
"Torrimpietra" (IAG · Lazio, olivo, 300 ha; solo lo ven los administradores
hasta que se le dé acceso a alguien).

## 5. La aplicación (funcionalidad)

Pantallas: **Login** → **Modelos** (dashboard con tarjetas) → **Editor** (5
pestañas; 6 en el modelo IAG) → **Resultados** (gráficos y comparación de
escenario) → **Informe PDF** → **Usuarios y permisos** (solo admin). Selector
de idioma Español / English en la barra superior.

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
5. **4 · E. Financiera** — estructura financiera y deuda, con la tabla "IS -
   Impuesto diferido" (el arrastre de pérdidas del SPV visto como activo por
   impuesto diferido; no cambia ninguna cifra).
6. **5 · Precio** — ciclo de precios: variación % anual editable (`priceVar`),
   botón Restablecer (vuelve a precio constante) y gráfico. Sin variaciones el
   precio es constante, como en el Excel Iberocrops.
7. **6 · Informe** — el informe PDF directamente, con el botón "Imprimir"
   arriba a la derecha.

Indicadores fijos arriba: TIR Fondo · Final, VAN Fondo (tasa), Equity
comprometido (calculado automáticamente), Inversión total y Precio medio.

**Torrimpietra es la referencia (decisión de Marc, 2026-10-20):** los modelos
normales conservan su motor y su capa Fondo, pero tienen todo lo nuevo de
Torrimpietra: pestaña Precio con ciclo de precios, tabla de impuesto diferido y
**tasa de descuento del VAN editable** en Supuestos macro (`descuento`; los
modelos guardados sin ella usan el 8 %, `discountPct()` en `compute.js`). Con
los valores por defecto las cifras son idénticas a las de antes (comprobado
contra el motor anterior en los 3 modelos de ejemplo).

### Modelo Torrimpietra (motor IAG, `a.engine === 'iag'`)

- Fuente: Excel IAG del 15/10/2026 (`project/design-nuevo/…/uploads/
  excel-1792399489264-v9nw.xlsx`), solo el Orchard 1 (300 ha). Datos en
  `app/data/iag.js` (etiquetas en inglés, como el Excel) y motor en
  `app/engine/computeIAG.js` (`compute()` elige el motor).
- Verificado contra el diseño/Excel: TIR agrícola 22,28 %, TIR SPV 23,31 %,
  VAN/ha 59.728 € (al 6 %), payback año 7, inversión 5.045,5 k€.
- Diferencias con el motor normal: producción = kg/árbol × rendimiento graso
  con rampa 0·0·50·75·100 %; **ciclo de precios** (variación % anual editable,
  `priceVar`); partidas de OPEX en €/kg de aceituna (`perKg`); amortización
  olivo 10 % · riego 5 % · OPEX capitalizada 10 % con el reparto del Excel
  (Orchard 2 en `cons`); IS del SPV con activo por impuesto diferido; tasa de
  descuento propia; **sin capa Fondo** (la TIR de referencia es la del SPV).
- Pestañas: Supuestos · 1. CAPEX · 2. OPEX · 3. Rentabilidad (Orchard 1 + SPV)
  · 4. Financiero (con la tabla "IS - Impuesto diferido") · **6. Precio**
  (tabla del ciclo, botón Restablecer y gráfico precio/media/variación) ·
  **7. Informe** (como el "6 · Informe" de los modelos normales; es 7 porque
  el diseño numera Precio como 6).

### Informe PDF

6 páginas (IAG) o 7 (normal, con la página del Fondo): portada, resumen
ejecutivo, CAPEX, rentabilidad del proyecto y del SPV (y del Fondo) en
horizontal y aviso legal. **La hoja "Estructura financiera" ("Del cultivo al
SPV/fondo": capas con sus TIR, préstamo y condiciones, fees) está oculta por
decisión de Marc (2026-10-20), pero el código sigue en `Report.js`: para
recuperarla basta con poner `SHOW_FIN = true` al principio del archivo** (la
numeración de secciones y páginas se ajusta sola). Estilo del diseño "Informe PDF
Torrimpietra" (el más reciente) para todos los modelos; tablas a 35 años. En la
tabla del SPV normal se omiten "Otros", "Otros gastos operativos" y "Comisión de
éxito" cuando son cero (si no, no cabe en la hoja). Imágenes:
`assets/agromillora-logo-white.png`, `foto-olivar.jpg`, `foto-plantacion.jpg`
(reducidas a 1600 px).

### Motor de cálculo (`app/engine/compute.js`)

- Réplica del Excel original. `MP = 6` es el año de referencia del "€/Ha pleno".
  El horizonte de cálculo es la duración del proyecto (`duracionProyecto`), y
  si falta se usa `HZ = 35`.
- Cada sub-partida de OPEX tiene `cant`, `coste`, `base = cant × coste` y un
  perfil anual `sched` (rampa del Excel). Al editar cantidad o coste, el perfil
  escala en proporción (`opexItemScale`).
- Los impuestos de SPV y Fondo se corrigieron para cuadrar con el Excel (commit
  `a3202aa`).
- `irr()` calcula la TIR y `pnlLayers.js` arma las tres capas.

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
  `assets/`, versión de olivo y de almendro). En OPEX la foto **termina
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
con las celdas editables a 0 (`blankA` en `app/data/seed.js`), salvo la
superficie, y con la estructura completa de CAPEX y OPEX.

## 6. Pendiente / limitaciones conocidas

- **Exportar a Excel:** el botón solo muestra un aviso; **no genera archivo**
  todavía. (El PDF sí: informe imprimible, ver sección 5.)
- **Informe PDF:** comprobado en pantalla (cabe todo en cada hoja y la
  orientación de cada página es la correcta) y Marc probó el botón "Imprimir"
  el 2026-10-20 con buen resultado.
- **Idioma:** la API responde siempre en español; sus mensajes de error se
  traducen en pantalla con el diccionario.
- **Comparación de escenarios:** el escenario guardado vive solo en memoria del
  navegador; no se guarda en la base de datos.
- **Correo real:** el cliente SMTP de PHP no se ha probado contra Microsoft 365
  (sí el caso de error). Requiere una contraseña de aplicación y el "SMTP
  autenticado" activado en el buzón.
- **Despliegue en Plesk:** sin hacer. Requiere PHP 8.0+ con `pdo_mysql`, crear
  la base de datos en el panel, `api/config.php` con credenciales y `app_url`,
  y subir solo `index.html`, `.htaccess`, `app/`, `assets/` y `api/` de la
  raíz del repo (no hace falta `chats/`, `project/` ni los `.md`). Comprobar
  que el servidor sirve los `.js` como `text/javascript` (los módulos ES lo
  exigen).
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
3. Para cambios de **interfaz**: editar el `.js` correspondiente de `app/` y
   recargar el navegador. No hay compilación (ver sección 4).
4. Para cambios de **API o base de datos**: editar `api/`. Si
   cambia el esquema de una base de datos ya existente, añadir una migración
   idempotente en `api/lib/db.php`; `ensure_schema` solo crea tablas cuando no
   existen.
5. Probar en local: Apache + PHP + MariaDB. En el equipo de Marc la app se
   sirve en http://localhost/Agribusiness/ directamente desde el repo, así que
   cualquier cambio se valida recargando, sin copiar nada.
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
- 2026-10-19: **Se elimina Node.js por completo** (petición de Marc: "que la
  app no necesite para nada nodejs"). Los 35 archivos TypeScript/JSX de
  `frontend/src/` se convierten a JavaScript en `app/` (misma estructura y
  lógica; JSX → htm). React 19.2.7, React DOM y htm 3.1.1 se guardan en
  `assets/vendor/` y se cargan con un import map. Se borran `frontend/`
  (package.json, Vite, TypeScript) y el bundle compilado. Comprobado: se
  capturó texto, valores de los campos e HTML de 20 pantallas (dashboard,
  5 pestañas + resultados de los 3 modelos y usuarios) con la versión anterior
  y la nueva da **exactamente el mismo resultado**; además, edición de celdas
  (TIR 10,94% → 20,45% con precio 5,2 y vuelta), escenarios, modales,
  validaciones, login correcto e incorrecto, usuario de solo lectura, tema
  almendro e invitación inválida.
- 2026-10-19: **Primer push de la rama `php` a GitHub** (orden de Marc), hecho
  desde una pestaña de la terminal de la app con inicio de sesión en el
  navegador (Git Credential Manager). Después se subió también `6a69a9a`
  (memoria). Rama local y remota sincronizadas.
- 2026-10-19: Mensaje "Hola Marc!" (verde de marca, negrita) debajo del texto
  de demo en la pantalla de login (`app/components/Login.js`). Comprobado en
  el navegador. Sin commit.
- 2026-10-19: **Diseño nuevo de Claude Design implementado** (paquete en
  `project/design-nuevo/`; Marc pidió todo, informes PDF incluidos):
  selector de idioma ES/EN con traducción de toda la interfaz y formato de
  números por idioma; modelo **Torrimpietra** con motor IAG propio, pestaña
  "6. Precio", tabla de impuesto diferido e indicadores propios (editor,
  dashboard, resultados); la API lo añade a la base de datos existente;
  **informe PDF** imprimible (7/8 páginas A4, mixtas). Comprobado en el
  navegador: cifras de Torrimpietra iguales al Excel, Iberocrops sin cambios
  (TIR Fondo 10,94 %), todas las pantallas y ventanas en inglés y en español,
  edición y restablecimiento del ciclo de precios, guardado y recarga desde la
  base de datos, y que cada página del informe cabe en su hoja. Sin commit.
- 2026-10-20: **Torrimpietra como referencia para todos los modelos** (Marc
  eligió "solo las novedades" y mantener la capa Fondo): los modelos normales
  ganan la pestaña "5 · Precio" (ciclo de precios), la tabla de impuesto
  diferido en E. Financiera, la tasa de descuento editable (por defecto 8 %) y
  el indicador Precio medio; el informe usa esa tasa y marca "con ciclo" si hay
  variaciones. Comprobado: con los valores por defecto, Iberocrops, La Dehesa y
  Alentejo dan exactamente lo mismo que el motor anterior; cambiar la tasa o una
  variación de precio recalcula y Restablecer vuelve atrás; textos en inglés.
  Sin commit.
- 2026-10-20: **Repaso del diseño nuevo elemento a elemento** contra la app
  (pantalla principal e informes). Estaba todo salvo la unidad "€/Ha/año" de
  Supuestos (corregida). No se incorporan, a propósito: el mapa de
  sensibilidad (en el diseño está oculto con `display:none`, Marc lo ocultó en
  el chat 5) y el selector "Estilo" Corporativo/Moderno/Cálido (herramienta de
  comparación del diseño; la app nunca lo tuvo). Excel sigue sin exportar
  (también en el diseño es solo un aviso). Corregido además: al editar una
  variación de precio en un modelo normal el gráfico de la pestaña Precio se
  quedaba sin barras mientras se escribía (huecos en `priceVar`).
- 2026-10-20: **Pestaña Informe en el editor** (Marc no encontraba el PDF; el
  único acceso era el botón pequeño "PDF" de la barra lateral y el de
  Resultados). "6 · Informe" en modelos normales y "7. Informe" en
  Torrimpietra: índice de páginas, TIR agrícola y SPV y botón para abrir el
  informe. Comprobado en el navegador en español e inglés. Con commit y push.
- 2026-10-20: **El informe se ve dentro de la pestaña Informe** (petición de
  Marc: ver el PDF directamente y un botón "Imprimir" arriba a la derecha que
  abra el cuadro de impresión). Desaparecen la pantalla `report` (y
  `reportFrom`/`closeReport`) y `InformeTab.js`. Comprobado en pantalla: páginas
  escaladas al ancho y la copia de impresión se monta/desmonta con
  `beforeprint`/`afterprint`. Marc probó "Imprimir" y sale bien. Con commit y
  push.
- 2026-10-20: **Título de portada del informe en una línea** (Marc): "Olivar
  SHD en regadío" / "Irrigated SHD olives" (almendro: "Almendro SHD en
  regadío" / "Irrigated SHD almonds"), igual para Torrimpietra y los modelos
  normales, a 52 px. Con commit y push.
- 2026-10-20: **Página CAPEX del informe:** toda la columna "Total (k€)" a
  14 px, como la fila de capitalización del OPEX (Marc). Con commit y push.
- 2026-10-20: **Cabeceras de hoja del informe iguales** (Marc): todas como la
  del resumen ejecutivo — título en Rockwell 32 px y entradilla a 12 px
  (`SectionHead` ya no admite otra fuente ni tamaño; antes CAPEX, Estructura
  financiera y Aviso legal iban en Arial). El título del aviso legal ocupa dos
  líneas; nada se sale de la hoja. Con commit y push.
- 2026-10-20: **Oculta la hoja "Estructura financiera" del informe** (Marc;
  se recupera con `SHOW_FIN = true` en `Report.js`). El aviso legal pasa a ser
  la sección 05 (IAG) / 06 (normal). Comprobada la numeración. Con commit y push.
- 2026-10-20: **Informe, retoques de Marc:** entradilla de las cabeceras a
  14 px; en Torrimpietra la hoja 03 se titula "Standalone returns" con el
  antetítulo "Rentabilidad · Modelo financiero" / "Profitability · Financial
  Model". Comprobado en ES y EN; nada se sale de la hoja. Con commit y push.
- 2026-10-20: **Hoja 5 del informe (SPV):** filas algo más bajas
  (`RentTable vAdj=-1.05`) para que el hueco entre la tabla y la línea del pie
  sea igual al que hay entre la entradilla y la tabla (≈26 px en ambos, en los
  dos tipos de modelo). Con commit y push.
