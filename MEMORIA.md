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
7. **Revisión estética tras cada cambio visual:** lanzar el agente
   `revisor-estetico` (`.claude/agents/revisor-estetico.md`), que mide en el
   navegador la alineación de cuadros con sus cabeceras, columnas uniformes,
   textos que se pisan, tipografías y las reglas de texto. Corregir lo que
   marque antes de dar el cambio por terminado.

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
- 2026-10-20: **Hojas 4 y 5 del informe:** márgenes laterales de la tabla a
  1 cm (`RentTable pad=38`; la cabecera y el pie siguen a 60 px). Columnas de
  año de 25,3 a 26,5 px. Pendiente: en Iberocrops, "Beneficio Neto de
  Explotación" e "IS (Impuesto de Sociedades)" no caben en la columna de
  etiquetas (115 px) y montan sobre el año 1; ya pasaba antes. Con commit y push.
- 2026-10-20: **Hoja 5, en inglés:** la fila del IS se llama "Corp. Income
  Tax" (en vez de "CIT (Corporate Income Tax)"; solo en el informe, el
  editor no cambia) y ya cabe; en español, "Imp. Sociedades". Con commit y push.
- 2026-10-20: **Títulos de las hojas de rentabilidad de Torrimpietra:**
  sección 03 "Modelo Financiero Agrícola" / "Agricultural Financial Model"
  (antes "Standalone returns") y sección 04 "Modelo Financiero SPV" / "SPV
  Financial Model" (antes "SPV — deuda, fees y auditoría sobre 300 Ha"). Los
  modelos normales no cambian. Con commit y push.
- 2026-10-20: **Hoja 4 del informe (modelos normales):** "Beneficio Neto de
  Explotación" pasa a "Beneficio Neto" (solo en el informe y en español; en
  inglés "Net operating profit" ya cabía). Ya no queda ninguna etiqueta que
  no quepa en las hojas de rentabilidad. Con commit y push.
- 2026-10-20: **Portada en español:** "Olivar en seto en regadío" (antes
  "Olivar SHD en regadío"; en inglés sigue "Irrigated SHD olives"). Cabe en
  una línea (621 de 666 px). Con commit y push.
- 2026-10-20: **Numeración de secciones del informe:** la hoja del SPV va en
  el mismo bloque 03 que la del proyecto (Marc). Quedan: Torrimpietra 01–03 y
  04 Aviso legal; normales 01–03, 04 Fondo y 05 Aviso legal. Con commit y push.
- 2026-10-20: **Hoja del SPV, en español:** "(=) Resultado Neto" pasa a
  "(=) Beneficio Neto" (solo en el informe; en inglés sigue "(=) Net
  income"). Con commit y push.
- 2026-10-20: **Bloque 03 del informe:** las dos hojas (proyecto y SPV), en
  todos los modelos, llevan el antetítulo "Rentabilidad · Modelo financiero" /
  "Profitability · Financial Model". Con commit y push.
- 2026-10-20: **"(=) Beneficio Neto" en toda la app** (antes "(=) Resultado
  Neto"; cambiado en `pnlLayers.js` y el diccionario, en inglés sigue "(=) Net
  income"). El informe ya no lo renombra por su cuenta. Con commit y push.
- 2026-10-20: **Hoja 3 del informe (CAPEX):** sin la foto de la plantación,
  filas de la tabla de partidas más bajas (`SummaryTable` en `Report.js`) y
  nueva tabla "OPEX · Plena producción" con los 8 bloques del OPEX sin
  "Otros" (€/Ha, % sobre esos 8, total k€) y fila "OPEX total (sin otros)".
  Sobran unos 160 px hasta el pie. Comprobado en los dos tipos de modelo y en
  ES/EN. La foto `assets/foto-plantacion.jpg` ya no se usa. Con commit y push.
- 2026-10-20: **Hojas 2 y 3 del informe:** 20 px entre la entradilla y el
  primer bloque (antes 30 y 32). Con commit y push.
- 2026-10-20: **Hoja 3:** 20 px entre la banda de densidad, la tabla CAPEX y
  el bloque OPEX; vuelve la foto `foto-plantacion.jpg` en el hueco que queda
  (20 px por arriba, 24 px hasta el pie como el resto de fotos; ≈141 px de
  alto). Con commit y push.
- 2026-10-20: **Hoja 3:** el "OPEX total" incluye ahora "Otros" (es
  `r.opexHa`; "Otros" sigue sin fila propia) y el % de cada bloque es sobre
  ese total; la cabecera de la tabla OPEX es "Partida"; nuevo título
  "CAPEX · Inversión inicial" sobre la tabla CAPEX. La foto baja a ≈118 px.
  Con commit y push.
- 2026-10-20: **Hoja 3:** las tablas CAPEX y OPEX se ordenan solas de mayor a
  menor peso (%) cada vez que cambian las partidas del modelo; la
  capitalización del OPEX va siempre al final de la tabla CAPEX (su % es sobre
  otra base). Título de la tabla OPEX: "OPEX · Plena producción". Con commit y push.
- 2026-10-20: **Hoja 3:** la columna "Total (k€)" de las tablas CAPEX y OPEX
  baja a 12 px (antes 14; las dos tablas comparten `SummaryTable`). Con commit y push.
- 2026-10-20: **Hoja 3, banda verde:** 5 px menos de relleno arriba y abajo
  (13 px) y orden Marco · Densidad · Superficie (nuevo) · Nº árboles.
  Con commit y push.
- 2026-10-20: **Hoja 3, tablas CAPEX y OPEX:** todo el texto (cabeceras,
  partidas, cifras y fila de total) a 13 px, el tamaño de la columna %.
  Los títulos "CAPEX · Inversión inicial" y "OPEX · Plena producción" van
  en la primera celda de la cabecera de cada tabla (en lugar de "Partida" y
  de un título aparte), con lo que la foto crece a ≈197 px. La densidad de la banda verde
  se expresa en "Árboles/Ha" ("Trees/Ha"). Con commit y push.
- 2026-10-20: **Etiquetas de las hojas de rentabilidad:** "Capitalización del
  OPEX" pasa a "Capitalización OPEX" en toda la app (`pnlLayers.js`); en el
  informe, hoja 4: "Impuesto de Sociedades" → "Imp. Sociedades" (EN "Corp.
  Income Tax") y "Beneficio neto" de Torrimpietra → "Beneficio Neto"; hoja
  5: sin los prefijos "(=) " ("Beneficio Neto" → EN "Net income"). Con commit y push.
- 2026-10-20: **Tablas de rentabilidad (hojas 4, 5 y la del Fondo):** cada
  columna de año y su cabecera con 0,1 cm de margen derecho (`RentTable`);
  ninguna cifra se corta. Con commit y push.
- 2026-10-20: **Hojas 4 y 5:** columna de etiquetas más estrecha (`labW45` en
  `Report.js`: 94,1 px en español y 90 px en inglés, antes 115) para que entre
  la etiqueta más larga y las cifras del año 1 queden 5 px; medido en los dos
  modelos y los dos idiomas. Si cambian las etiquetas hay que reajustarlo. En
  inglés, la hoja 4 dice ahora "Net income" (como "Beneficio Neto"). Con commit y push.
- 2026-10-20: **Cabecera de las tablas de rentabilidad:** "Concepto · k€" pasa a
  "Concepto" / "(Miles €)" en dos líneas (EN "Concept" / "(€ thousand)"),
  sin relleno vertical para que la fila no crezca. Reajustados `labW45` (94,1 /
  91,65 px) y la hoja 5 (`vAdj=-0.78`): siguen los 5 px hasta el año 1 y los
  26 px arriba y abajo de la tabla del SPV. Con commit y push.
- 2026-10-20: **"(Miles €)"** de esa cabecera en cursiva, sin negrita, 10 px y
  sin mayúsculas; `labW45` en inglés vuelve a 90 px (5 px hasta el año 1).
  Con commit y push.
- 2026-10-20: **Cabecera de las tablas de rentabilidad:** "(miles €)" en
  minúscula y a 8 px; los números de año a 8 px (antes 6,6). Hoja 5 reajustada
  (`vAdj=-0.56`) para mantener 26 px arriba y abajo; siguen los 5 px hasta el
  año 1. Con commit y push.
- 2026-10-20: **Pestañas del editor reordenadas y numeradas** (Marc): 1 Supuestos ·
  2 CAPEX · 3 OPEX · 4 Precio · 5 Rentabilidad · 6 Financiero ("E. Financiera"
  en los normales) · 7 Informe, en los dos tipos de modelo (Torrimpietra con
  "1.", los normales con "1 ·"). Renumerados también los títulos de las
  pestañas CAPEX, OPEX, Rentabilidad y Precio. Numeración siempre "N." (también
  en los modelos normales: "6. E. Financiera"). Con commit y push.
- 2026-10-20: **Pestaña Financiero:** la tabla "IS - Impuesto diferido" ocupa
  el mismo ancho que las columnas de la pestaña OPEX (3 de 4 columnas; 542 px
  medidos en ambas). Con commit y push.
- 2026-10-20: **Pestaña Financiero con foto**, como CAPEX: todo el contenido
  ocupa las columnas 1-3 y la foto la 4 (`TabWithPhoto`; `foto-olivar.jpg`,
  en almendro `supuestos-almendro-detalle.webp`). Mismos bordes que CAPEX
  (contenido 256-798 px, foto 810-983 px medidos). Se quita el ajuste propio de
  la tabla del IS. Con commit y push.
- 2026-10-20: **Pestaña Financiero:** quitado el `maxWidth: 1080` de su raíz;
  en pantallas anchas se quedaba más estrecha que CAPEX. Medido a 1700 px: los
  dos cuadros van de 256 a 1305 px. Con commit y push.
- 2026-10-20: **Pestaña Financiero:** en el cuadro de amortización del préstamo
  y en el de amortización/depreciación, los valores 0 se muestran como "-".
  Con commit y push.
- 2026-10-20: **OPEX de Torrimpietra:** la partida "CAP processing (Common
  Agricultural Policy)" se muestra en español como "Tramitación PAC" (antes
  "Tramitación PAC (Política Agrícola Común)"; solo cambia el diccionario, en
  inglés sigue igual). Con commit y push.
- 2026-10-20: **Pestaña 6:** se llama "6. Est. Financiera" en todos los modelos
  (EN "6. Fin. Structure"). Con commit y push.
- 2026-10-20: **Supuestos:** quitada la frase "Los valores en gris se calculan
  automáticamente y no se pueden editar.". Con commit y push.
- 2026-10-20: **Supuestos de Torrimpietra:** "Kg/árbol (olivo) · producción plena" pasa a
  "Kg/Aceituna/Árbol (olivo) · Plena Producción" (EN "Kg olives/tree (olive) ·
  Full production"). Con commit y push.
- 2026-10-20: **Supuestos, "Resumen del Proyecto":** pasa arriba (antes de las
  tarjetas) con los mismos campos que la banda de la hoja CAPEX del informe:
  Marco (m) · Densidad (Árboles/Ha) · Superficie (Ha) · Nº árboles. Mismo
  estilo; salen CAPEX por Ha y OPEX/Ha (pleno). Misma estructura que el
  informe: etiqueta en mayúsculas y, debajo, cifra y unidad en una línea
  ("3,80 m × 1,40 m", "1.880 Árboles/Ha", "300 Ha", "563.910"), repartidas
  en una fila. Con commit y push.
- 2026-10-20: **Supuestos:** las tarjetas de grupos pierden el margen izquierdo
  de 20 px; quedan alineadas con el título y el resumen. Con commit y push.
- 2026-10-20: **OPEX:** cada sub-partida lleva línea gris debajo (antes encima),
  así la última fila de cada tarjeta también queda cerrada. Con commit y push.
- 2026-10-20: **Supuestos:** quitada del todo la banda "Resumen del Proyecto"
  (Marco, Densidad, Superficie, Nº árboles) a petición de Marc, para que la
  página sea más baja. Con commit y push.
- 2026-10-20: **Supuestos:** la última fila de cada tarjeta ya no lleva línea
  gris antes del borde (en "Fees y fondo" la última es Equity comprometido).
  Con commit y push.
- 2026-10-20: **Supuestos:** filas con 8 px de relleno (49 px de alto, como en
  CAPEX y OPEX) y sin relleno vertical en el cuerpo de la tarjeta: del último
  campo al borde quedan 9 px, como en OPEX. Con commit y push.
- 2026-10-20: **CAPEX, Due Diligence como importe total:** la partida `dd` se
  introduce en € totales de la finca (`it.total: true`, unidad "€ total") y el
  motor la pasa a €/Ha dividiendo por la superficie (`capexItemHa` en
  `compute.js`, usado por los dos motores, la pestaña CAPEX y el informe).
  Torrimpietra: 15.000 € (= 50 €/Ha; etiqueta "Due Diligence"); normales: 75 €/Ha
  × superficie (Iberocrops 18.750 €). Los modelos guardados se convierten al
  cargarlos (`normalizeModel` en `api.js`); se guardan ya convertidos la
  próxima vez que se pulse Guardar. Cifras sin cambios (TIR e inversión
  iguales). `api/data/seed-*.json` siguen en €/Ha (los convierte la carga), así
  que `baseIAG` ya no coincide byte a byte con `seed-iag.json`. Con commit y push.
- 2026-10-20: **Est. Financiera:** la entradilla queda en "Préstamo francés sobre
  la deuda, con años de carencia." (sin la segunda frase). Con commit y push.
- 2026-10-20: **CAPEX:** la etiqueta "Marco (n × m)" de la tarjeta "Marco de
  plantación" pasa a "Marco de plantación". Con commit y push.
- 2026-10-20: **OPEX:** la cabecera "Sub-partida" de las tarjetas pasa a"
  "Partida". Con commit y push.
- 2026-10-20: **OPEX:** "Aplicación foliar (calle sí/no)" se muestra en dos
  líneas ("Aplicación foliar" / "(calle sí/no)"): `TWO_LINES` en `OpexTab.js`
  y el par del diccionario con el salto (EN sigue "Foliar application
  (alternate rows)"). Igual "Aplicación foliar" / "(todas hileras)". Con commit y push.
- 2026-10-20: **CAPEX:** la unidad de la Due Diligence es "€/Total" (antes
  "€ total"). Con commit y push.
- 2026-10-20: **CAPEX:** la cifra de la cabecera de cada tarjeta ("€/Ha · %") va
  en la fuente normal, como en OPEX (antes en monoespaciada). Con commit y push.
- 2026-10-20: **OPEX de Torrimpietra, Sanidad vegetal:** la partida "Plant
  protection products" se muestra como "Protección vegetal" (`splitLabel` en
  `OpexTab.js` según la categoría); en Control de malezas el mismo texto del
  Excel sigue como "Productos fitosanitarios". En el diccionario el par
  "Protección vegetal" va antes que "Productos fitosanitarios" (gana el último
  al traducir al español). Con commit y push.
- 2026-10-20: **Regla de Marc: "/Año" siempre con mayúscula** en las unidades
  (€/Ha/Año, €/Año, % equity/Año), en el editor y en el informe. Con commit y push.
- 2026-10-20: **OPEX, orden de tarjetas:** columna izquierda Poda · Nutrición ·
  Sanidad vegetal · Control de malezas (en Torrimpietra, Mantenimiento de
  infraestructura va entre Sanidad y Malezas, a la altura de Riego); la derecha conserva el orden anterior con el resto
  (`LEFT` en `OpexTab.js`, se intercalan en la cuadrícula de 2 columnas; si una
  columna tiene menos tarjetas se deja un hueco vacío). Con commit y push.
- 2026-10-20: **OPEX de Torrimpietra:** "Roads, facilities, etc." (Caminos,
  instalaciones, etc.) pasa de "Farm maintenance" (Mantenimiento de terrenos) a
  "Infrastructure maintenance"; la categoría "farm" desaparece (8 categorías).
  Cambiado en `iag.js` y, para el modelo guardado, en `normalizeModel` de
  `api.js`. Las cifras no cambian (TIR SPV 23,31 %). Derecha fila a fila
  (`RIGHT_IAG`): Cosecha · Riego (junto a Nutrición) · Control de malezas (junto a
  Sanidad) · Otros (junto a Mantenimiento de infraestructura); la izquierda queda
  Poda · Nutrición · Sanidad · Mantenimiento de infraestructura. Con commit y push.
- 2026-10-20: **OPEX, línea bajo la última partida:** solo se ve cuando la tarjeta
  tiene espacio en blanco debajo (relleno `flex: 1` con sombra interior de 1 px);
  en la tarjeta más alta de cada fila (p. ej. Riego) ya no se junta con el borde.
  Igual en las tarjetas de Supuestos (p. ej. Costes estructurales). Después: la
  línea solo sale si el hueco es de 20 px o más (componente `FillLine.js`, mide
  con ResizeObserver); con un hueco pequeño, como en Riego, no se dibuja. No se
  pudo comprobar del todo en el navegador de la sesión (oculto, no repinta).
  Unidades "Años" con mayúscula en Supuestos. Con commit y push.
- 2026-10-20: **Pestaña Precio:** números del eje del gráfico a 8 (Marc probó 12 y 10 y
  lo dejó en 8) y gráfico más
  bajo (`H` 280 → 125, barras 90 → 55) para que la pestaña quepa sin
  desplazarse; a 1440×800 queda justa (800 px). Con commit y push.
- 2026-10-20: **Regla de Marc: tras "/" la letra siempre en mayúscula** (amplía la
  de "/Año"): €/Kg, €/Árbol, €/Ha/Año… y en inglés €/Tree, /Year, olives/Tree.
  Cambiado en editor, informe y diccionario. "(calle sí/no)" se muestra como "(calle Sí/No)" (con commit y push).
  Con commit y push.
- 2026-10-20: **Gráfico de Precio:** la media lleva la etiqueta "Precio Medio" (8,
  negrita, color de la línea) 5 px por encima de la línea discontinua, al
  principio de la línea (izquierda), y se mueve con ella; sale "Media" de la leyenda. Con commit y push.
- 2026-10-20: **Gráfico de Precio:** los números del eje arrancan en el margen
  izquierdo de la tarjeta (alineados con el título "Ciclo de precios") y el
  gráfico empieza justo después (margen interior 30).
- 2026-10-20: **OPEX:** el texto de entrada pasa a ser una breve descripción del OPEX
  (costes operativos anuales) y aclara que los importes son datos base por Ha sin inflación.
- 2026-10-20: **Gráfico de Precio:** eje vertical desde 0 con marcas cada 0,5 €/Kg.
- 2026-10-20: **TEMPORAL:** botón "Edición de texto" (app/devTextEdit.js, cargado en index.html)
  para editar textos en pantalla y copiar la lista ANTES/DESPUÉS. Quitarlo cuando Marc lo diga.
- 2026-10-20: **Textos (edición en pantalla):** Kg/Aceituna/Árbol sin "(olivo)"; CAPEX/OPEX Fee;
  "Activo por Impuesto Diferido (AID)"; columna "Amorti."; bloque IS como "Impuesto de Sociedades
  (en miles €)" sin subtítulo; capa IAG "4 · Rentabilidad agrícola" sin subtítulo; pestaña
  "5. Rentabilidad" con texto IAG provisional "PDTE.".
- 2026-10-20: **OPEX:** texto de entrada empieza por "Costes operativos anuales…"; "Bioestimulantes y nutrición".
- 2026-10-20: **OPEX:** "Aplicación foliar (todas las hileras)".
- 2026-10-20: **Gráfico de Precio:** marcas del eje cada 1 €/Kg (sin decimales).
- 2026-10-20: **Gráfico de Precio:** números de año a 8; márgenes del gráfico 10 arriba y 5 abajo (más alto).
- 2026-10-20: **Gráfico de Precio:** años 5 px por encima del fondo, a ~10 px del borde de la tarjeta; las barras up/down bajan con ellos.
- 2026-10-20: **CAPEX:** "Calculado", "Árboles/Ha" y fuera el "sobre N Ha" bajo # Plantas.
- 2026-10-20: **CAPEX:** "Total CAPEX" sin el paréntesis "(no incluye la capitalización del OPEX)".
- 2026-10-20: **CAPEX:** la fila Total Inversión Inicial usa la fuente normal (como las cabeceras verdes).
- 2026-10-20: **OPEX:** "Mechanical / top pruning" y "Mechanical / side pruning" en dos líneas (ES: "Poda mecánica / de cobertura", "Poda mecánica / lateral").
- 2026-10-20: **OPEX (IAG):** la partida "CAP processing…" se muestra "PAC" (ES) y "CAP (Common Agricultural Policy)" (EN).
- 2026-10-20: **Textos EN:** CAPEX/OPEX Fee (Year 1 / Annual), Audit (Prorated…), Discount Rate, Corporate Income Tax, "Planting layout" sin (n)/(m).
- 2026-10-20: **Textos EN:** "Surface area" y "Editable cells".
- 2026-10-20: **Rentabilidad (IAG):** capas "Rentabilidad agrícola" y "SPV", sin subtítulos.
- 2026-10-20: **Editor:** títulos de sección (h2 de cada pestaña) en Rockwell.
- 2026-10-21: **Editor (IAG):** tarjetas TIR en orden Agrícola, SPV y Fondo (nueva, 0% hasta que exista la capa Fondo; decidir luego 0 o N/A); ninguna resaltada en verde.
- 2026-10-21: **Supuestos:** "Marco de plantación" sin (n)/(m), "CAPEX Fee (Año 1)" y "Auditoría" (EN: Audit).
- 2026-10-21: **CAPEX:** "Capitalización OPEX (OPEX Año 1 + Año 2)".
- 2026-10-21: **Textos:** "Impuesto de Sociedades" (también en el informe) y "OPEX Fee (Anual)" / "(Annual)".
- 2026-10-21: **CAPEX:** "Árboles/Ha" con mayúscula en el texto de entrada.
- 2026-10-21: **CAPEX:** la cifra de Total CAPEX usa la fuente normal (como las cabeceras verdes).
- 2026-10-21: **Campos editables (azules):** todos 3 px más estrechos (NumberField).
- 2026-10-21: **OPEX:** columnas de ancho fijo (minmax(0,fr)) para que todos los cuadros queden alineados aunque la etiqueta sea larga.
- 2026-10-21: **OPEX:** unidad "€/Kg/Aceituna" (antes Aceitunas).
- 2026-10-21: **OPEX:** fuera la columna "€/Ha 1er Año" de las tablas.
- 2026-10-21: **OPEX:** columnas de tabla: Partida flexible (hace salto de línea), cuadros de 69 px, Unidad 52 px, €/Ha pleno 64 px; "Coste unitario" en una línea.
- 2026-10-21: **OPEX:** "Coste unitario" alineado a la derecha con su cuadro. Nuevo agente `revisor-estetico` (regla 7).
- 2026-10-21: **OPEX:** cuadros de 58 px, huecos más estrechos (Partida gana ~35 px) y unidad "€/Kg/" + "Aceituna" en dos líneas en todos los modelos.
- 2026-10-21: **OPEX:** cabeceras Cantidad/Coste unitario a 10 px, 10 px entre cuadros, etiquetas con guionado (hyphens) para palabras largas. Revisor estético: sin fallos (2 modelos × ES/EN).
- 2026-10-21: **OPEX:** bloque Cantidad 7 px más a la izquierda (17 px entre cuadros). Revisor: sin solapes.
- 2026-10-21: **Gráfico de Precio:** gráfico pegado a la leyenda (~5 px entre la leyenda y el primer número del eje).
- 2026-10-21: **Gráfico de Precio:** más alto (H=176) para que la tarjeta llegue a ~5 px del botón inferior a 1400×900.
- 2026-10-21: **Rentabilidad (IAG):** nueva capa "Fondo" (mismas filas que el modelo estándar) a 0 hasta que el motor IAG calcule el fondo; se vuelca sola cuando existan r.fundRev, r.fcfF, r.tirF…
- 2026-10-21: **Rentabilidad:** las tablas de capas comparten anchos fijos (Concepto 230 px, año 88 px) para que los años queden alineados entre tablas.
- 2026-10-21: **Supuestos (IAG):** nueva tarjeta "Fondo de inversión" (participación %, comisión gestión % equity/Año, otros €/Año; por defecto 0). El motor IAG calcula la capa Fondo: su % del FCF apalancado, comisión, IS de Supuestos sobre ingresos del fondo y otros con inflación. Con 0 % todo sale a 0.
- 2026-10-21: **Supuestos (IAG):** el campo de participación del fondo se llama "Capital Fondo" (EN "Fund Capital").
- 2026-10-21: **Supuestos (IAG):** "Capital Fondo" pasa a ser calculado = 100 % − % financiación (no editable); el motor usa ese % para la capa Fondo.
- 2026-10-21: **Supuestos:** unidad "% Capital" (EN "% Equity") (antes "% equity/Año").
- 2026-10-21: **Rentabilidad (capa Fondo):** la fila "Capital" = inversión inicial (CAPEX + OPEX capitalizada) × (1 − % financiación), el mismo importe todos los años. En Torrimpietra (IAG) es la base de la comisión de gestión del fondo; en el modelo estándar la comisión sigue sobre el equity comprometido.
- 2026-10-21: **Supuestos (IAG):** campo "Success Fee" (%) en "Fees y costes del SPV", entre OPEX Fee y Auditoría; por defecto 0 y aún sin cálculo (pendiente de que Marc defina la base).
- 2026-10-21: **Informe (tablas de 35 años):** cifras a 7,3 px y separación derecha de cada columna 0,05 cm (antes 6,6 px y 0,1 cm).
- 2026-10-21: **Informe:** la tabla Fondo usa los mismos márgenes y columna de texto que Agrícola y SPV (pad 38, labW45), así sus cifras caben a 7,3 px.
- 2026-10-21: **Fondo (IAG):** ingresos del fondo = FCF apalancado positivo del SPV (y aportaciones = el negativo), igual que el modelo original; ya no se multiplica por el % Capital Fondo (lo contaba dos veces). El % solo da el capital base de la comisión.
- 2026-10-21: **Fondo:** la partida "Otros" del fondo pasa a llamarse "Auditoría" (Supuestos IAG, capas Fondo de Rentabilidad en ambos modelos e informe).
- 2026-10-21: **OPEX:** última columna a 90 px con cabecera "€/Ha Plena Prod." en una línea (EN "€/Ha Full Prod."); Partida cede el ancho y puede ir en dos líneas.
- 2026-10-21: **Editor:** selector de estado del proyecto (Activo / Borrador / En revisión) junto al nombre, con los colores del panel; se guarda con "Guardar cambios" (solo quien puede editar).
- 2026-10-21: **Estado del proyecto:** "Borrador" con letras blancas (a petición de Marc, se descarta el texto oscuro).
- 2026-10-21: **Estado del proyecto:** solo "Activo" y "Borrador" (fuera "En revisión").
- 2026-10-21: **Estado del proyecto:** fondo de "Borrador" en gris #595959 (editor y panel).
- 2026-10-21: **Panel:** botón "Duplicar" en cada tarjeta de modelo: crea una copia "(copia)" con todos los supuestos, en Borrador, y la abre en el editor (el que duplica queda con acceso de edición).
- 2026-10-21: **Panel:** lápiz junto al nombre de cada modelo para renombrarlo (Enter o salir del campo guarda al momento, Esc cancela); solo admin o quien tiene edición.
- 2026-10-21: **Lanuvio (modelo id 5, BD local):** finca distinta de Torrimpietra con el mismo OPEX y su propio CAPEX (hoja de Marc): 350 Ha, 3,8×1,4; CAPEX 17.263 €/Ha, cap. OPEX 2.986, inversión 20.248 €/Ha (cuadra con su Excel). Auditoría prorrateada 10.000×350/650 = 5.385 €/Año; sin reparto de amortización con la otra finca (cons a 0). TIR agrícola 19,69 %, TIR SPV 20,79 %. Solo en la BD local.
- 2026-10-21: **Amortización:** cada finca amortiza sus propios activos (cons a 0 en Torrimpietra, Lanuvio y por defecto en modelos IAG nuevos). Torrimpietra: TIR agrícola 22,28 → 22,30 %, TIR SPV 23,31 → 23,34 % (ya no cuadra al céntimo con el Excel original, que repartía con Lanuvio).
- 2026-10-21: **Excel vs herramienta (3. Profitability):** la diferencia de TIR por finca (22,28 vs 22,30 %; 19,66 vs 19,69 %) viene solo de la amortización: el Excel reparte una amortización consolidada y en E. Financial!E4 usa el riego por Ha de Orchard 1 para las 650 Ha. Marc decide dejar la herramienta como está (cada finca amortiza sus activos).
- 2026-10-22: **CAPEX:** la partida "Irrigation system (all inc.)" se muestra en ES como "Sistema de riego".
- 2026-10-22: **Supuestos (IAG):** la producción se introduce como "Kg Aceite/Ha · Plena Producción" (kgOil, 1.800) con rendimiento graso 16 %; la aceituna sale de kgOil/rendimiento (11,25 t/Ha). Modelos sin kgOil siguen con kg/árbol. Torrimpietra y Lanuvio actualizados en la BD local.
- 2026-10-22: **CAPEX (IAG):** "Irrigation project" pasa al bloque de riego; Due Diligence editable en €/Ha (70, ddHa) en lugar de total; nueva partida "Mechanical planting" (Plantación mecánica, €/Árbol, 0) tras la manual. Migración en normalizeModel; Torrimpietra y Lanuvio guardados (TIR agrícola 18,17 % / 15,93 %, TIR SPV 18,49 % / 16,34 %).
- 2026-10-22: **Precio:** a la derecha del gráfico, tres KPIs: precio máximo (con su año), mínimo (con su año) y medio del proyecto.
- 2026-10-22: **CAPEX (IAG):** orden del bloque de riego: Proyecto de riego, Sistema de riego, Energía (también en modelos guardados vía normalizeModel).
- 2026-10-22: **Informe, CAPEX inversión inicial:** el bloque de plantación se separa en "Plantas" (planta + royalties) y "Plantación" (resto de partidas de plantación).
- 2026-10-22: **Precio:** KPIs con el alto del gráfico (columna absoluta, recuadros a partes iguales); con precio plano el año sale "—".
- 2026-10-22: **CAPEX:** nueva categoría "3LIS System" / "Sistema 3LIS" (una partida en €/Ha, 0) tras la plantación, en el editor y en el resumen del informe; en todos los modelos (plantillas + normalizeModel, guardados los 5 de la BD local). De momento no se amortiza (como la preparación del suelo).
- 2026-10-22: **Precio:** KPIs con alto mínimo de 170 px (en pantallas estrechas el texto ya no se sale) y borde inferior a 2 px del final del gráfico.
- 2026-10-22: **Precio:** orden de los KPIs: medio, máximo, mínimo.
- 2026-10-22: **Precio (IAG):** ciclo de precios reescalado (misma forma) para que vaya de 3 a 6 €/Kg desde 5 €/Kg; precio medio 5,16. Nuevo PRICE_VAR_IAG por defecto ("Restablecer") y guardado en Torrimpietra y Lanuvio. TIR agrícola 15,13 % / 13,21 %, TIR SPV 14,86 % / 13,03 %.
- 2026-10-22: **Precio (IAG):** mínimo del ciclo a 2,92 €/Kg (máximo 6); medio 5,15. TIR agrícola 15,03 % / 13,12 %, TIR SPV 14,73 % / 12,92 % (Torrimpietra / Lanuvio).
- 2026-10-22: **Precio (IAG):** se adopta el modelo de ciclicidad de Marc (Book7, Ciclo_AOVE, senda central): año 1 = 2,85 €/Kg, mín 2,39 (año 3), máx 6 (año 35), medio 4,00. PRICE_VAR_IAG y precioEVOO por defecto actualizados; guardado en Torrimpietra y Lanuvio. TIR agrícola 8,04 % / 6,81 %, TIR SPV 6,45 % / 5,31 %.
- 2026-10-22: **CAPEX (IAG):** "Plantación manual", "Plantación mecánica" y "Fertilizante" pasan a €/Ha (partida con unit propia, it.unit; capexItemHa la respeta). Valores convertidos con la densidad: manual 1.316 (Torrimpietra) y 1.504 (Lanuvio) €/Ha.
- 2026-10-22: **CAPEX:** se elimina el bloque "3LIS System" (plantillas, traducción y modelos guardados vía normalizeModel).
- 2026-10-22: **CAPEX:** "Plantación manual" sin "(todo incluido)" en ES.
- 2026-10-22: **CAPEX (IAG):** "Accesorios (tutor + protector)" se sustituye por "Espaldera + Protector" (nueva, 0 €/Árbol) y "Tutor + Protector" (conserva el importe: 0,80 / 0,85 €/Árbol). Migración en normalizeModel; guardado en Torrimpietra y Lanuvio.
- 2026-10-22: **CAPEX:** texto de entrada: "Las partidas en €/Árbol se multiplican por la densidad (…); el resto en €/Ha" (ya no todas las de plantación van por árbol).
- 2026-10-22: **CAPEX:** etiquetas "Método plantación 1. (Espaldera + Protector)" y "Método plantación 2. (Tutor + Protector)" (EN "Planting method 1./2. …").
- 2026-10-22: **CAPEX (IAG):** "Método Plantación 1. (Manual)" y "Método Plantación 2. (Mecánica)" (EN "Planting method 1. (Manual)" / "2. (Mechanical)"); guardado en Torrimpietra y Lanuvio.
- 2026-10-22: **Supuestos (IAG):** "Kg AOVE/Ha · Plena Producción" (EN "Kg EVOO/Ha · Full Production").
- 2026-10-22: **Est. Financiera:** título de la pestaña "6. Estructura financiera".
- 2026-10-22: **Precio (IAG):** ciclo Book7 con mínimo 2,92 €/Kg (amplitud reducida en escala log, máximo 6): año 1 = 3,36, medio 4,35. Guardado en Torrimpietra y Lanuvio y por defecto. TIR agrícola 10,37 % / 8,87 %, TIR SPV 9,23 % / 7,82 %.
- 2026-10-22: **Campos editables:** borde verde #385723 (variable --editableLine; afecta también a las pastillas "editable" y al campo de renombrar).
- 2026-10-22: **Campos editables:** fondo azul #dceaf7 con un 25 % de transparencia (rgba 0,75).
- 2026-10-22: **Precio:** los KPIs van dentro de PriceChart (prop side), junto al gráfico de precio: de la línea superior del eje al eje 0 (las barras ocupan solo la columna del gráfico).
- 2026-10-22: **Precio:** KPIs en dos líneas (etiqueta; cifra + año) con letra que escala con el alto del recuadro (cqh); el medio ya no lleva "35 años". En pantallas estrechas (~1000 px) la letra queda pequeña.
- 2026-10-22: **Pestañas 1-3:** 20 px entre las tablas y la foto (gap de la rejilla repeat(4,1fr)).
- 2026-10-22: **Precio:** foto a la derecha (assets/precio-detalle.webp, aceitunas en la almazara) con el mismo ancho y márgenes que las pestañas 1-3 (TabWithPhoto).
- 2026-10-22: **Editor:** el área de pestañas reserva siempre el hueco de la barra de desplazamiento (scrollbar-gutter: stable): mismo margen derecho con y sin scroll.
- 2026-10-22: **OPEX:** separación entre columnas de 12 px (Partida baja a ~54 px y se parten más palabras); el guionado usa el idioma activo (lang es/en).
- 2026-10-22: **Editor:** el hueco de la barra se reserva en `html` (scrollbar-gutter: stable en styles.css), que es lo que hace scroll; el del contenedor de pestañas no bastaba.
- 2026-10-22: **Editor:** quitado el scrollbar-gutter del contenedor de pestañas (duplicaba el hueco y dejaba las fotos 15 px más a la izquierda que la cabecera); solo queda el de html.
- 2026-10-22: **Precio:** gráfico más alto (H=364) para que la tarjeta y la foto acaben a la altura del botón PDF a 1536×864 (en otros anchos no coincide exacto).
- 2026-10-22: **Informe pág. 3:** banda superior en orden Superficie, Marco, Densidad, Nº árboles.
- 2026-10-22: **Precio:** alto del gráfico dinámico (ResizeObserver): llena la ventana hasta 26 px del borde inferior para que la pestaña no tenga scroll (mínimo 200 px de alto).
- 2026-10-22: **Precio:** en los KPIs de máximo y mínimo el año va en una línea debajo de la cifra.
- 2026-10-22: **Informe (tablas de 35 años):** los 10 últimos años (26–35) se agrupan en una columna "Σ 26–35" con la suma (en filas de %: suma del numerador / suma de ingresos). 26 columnas; cifras a 9,5 px. Las filas de % guardan num/den en pnlLayers.
- 2026-10-22: **Est. Financiera:** cifras de las tarjetas KPI (deuda, intereses…) en Arial.
- 2026-10-22: **Cifras grandes en Arial negrita:** KPI de la cabecera del editor, densidad y nº de plantas en CAPEX, cifras de las tarjetas del panel y KPI de Est. Financiera.
- 2026-10-22: **Informe:** columna "Σ 26–35" más ancha (44 px) para que quepan las sumas largas a 9,5 px.
- 2026-10-22: **Informe:** densidad como "Árboles/Ha" (EN "Trees/Ha").
- 2026-10-22: **Informe:** marco de plantación "3,80 m × 1,40 m".
- 2026-10-22: **Informe:** producción plena "kg AOVE/Ha" en ES (EN "kg EVOO/Ha").
- 2026-10-22: **Informe:** precio inicial sin "· con ciclo".
- 2026-10-22: **Informe, Estructura financiera:** orden Financiación, Tipo de interés, Deuda, Equity (SPV), Cuota anual, Plazo · carencia, Impuesto de Sociedades, Inflación.
- 2026-10-22: **Regla de textos:** en español siempre "AOVE", en inglés "EVOO". Corregidos: Precio inicial (AOVE), Precio AOVE (constante), Precio €/Kg AOVE (tabla de precios), Precio AOVE inicial / Precio AOVE (informe), Precios · €/Kg AOVE.
- 2026-10-22: **CAPEX:** "Sistema Plantación 1. (Manual)" y "Sistema Plantación 2. (Mecánica)" en ES (EN sigue "Planting method 1./2.").
- 2026-10-22: **CAPEX (IAG):** Sistema Plantación 1 (manual) y 2 (mecánica) excluyentes: al poner valor en uno, el otro pasa a 0 (onCapexField, store.js).
- 2026-10-22: **Campos editables:** Intro cierra la edición y fija el valor (blur).
- 2026-10-22: **CAPEX (IAG):** Método plantación 1 (espaldera) y 2 (tutor) también excluyentes.
- 2026-10-22: **Informe, CAPEX:** la fila "Plantación" lleva "(Manual)" o "(Mecánica)" según el sistema de plantación con importe.
- 2026-10-22: **CAPEX:** "Sistema Plantación 1. (Manual)" pasa a "Plantación Manual" (ES).
- 2026-10-22: **CAPEX:** "Sistema Plantación 2. (Mecánica)" pasa a "Plantación Mecanizada" (ES).
- 2026-10-22: **Informe, CAPEX:** la fila de plantación se llama "Plantación Manual" o "Plantación Mecanizada" (los mismos nombres que en el CAPEX).
- 2026-10-22: **CAPEX:** "Método plantación 1. (Espaldera + Protector)" pasa a "Sistema de guiado y soporte (Espaldera + Protector)" (ES).
- 2026-10-22: **CAPEX:** "Sistema de guiado y soporte (Tutor + Protector)" también; EN "Training and support system (Trellis/Stake + Protector)" (datos, migración y BD local de Torrimpietra y Lanuvio).
