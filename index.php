<?php
// Catálogo de apps de Agromillora. Cada carpeta de la raíz con un app.json aparece
// aquí como un cuadro que abre la app. Para añadir una app nueva basta con crear su
// carpeta con un app.json:
//   { "name": "Nombre", "description": "Una línea", "icon": "icon.svg" }
// "icon" es relativo a la carpeta de la app.

header('X-Content-Type-Options: nosniff');
header_remove('X-Powered-By');

function e($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

$apps = [];
foreach (glob(__DIR__ . '/*/app.json') ?: [] as $file) {
    $meta = json_decode((string) file_get_contents($file), true);
    if (!is_array($meta) || empty($meta['name']) || !is_string($meta['name'])) continue;
    $dir = basename(dirname($file));
    $icon = isset($meta['icon']) && is_string($meta['icon']) && !str_contains($meta['icon'], '..')
        ? $dir . '/' . ltrim($meta['icon'], '/')
        : null;
    $apps[] = [
        'href' => rawurlencode($dir) . '/',
        'name' => $meta['name'],
        'description' => is_string($meta['description'] ?? null) ? $meta['description'] : '',
        'icon' => $icon && is_file(__DIR__ . '/' . $icon) ? $icon : null,
    ];
}
usort($apps, fn ($a, $b) => strcasecmp($a['name'], $b['name']));
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="same-origin">
  <title>Apps — Agromillora</title>
  <link rel="icon" type="image/png" href="assets/agromillora-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --brand: #2e6b34;
      --brandD: #1e4423;
      --bg: #f3f5f1;
      --surface: #ffffff;
      --ink: #182015;
      --ink2: #606b58;
      --line: #dde3d8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Public Sans', Arial, sans-serif;
      background: var(--bg);
      color: var(--ink);
    }
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      padding: 14px 22px;
    }
    header img { height: 30px; display: block; }
    main { max-width: 1040px; margin: 0 auto; padding: 40px 22px 64px; }
    .eyebrow {
      margin: 0 0 6px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--brand);
    }
    h1 { margin: 0 0 6px; font-size: 28px; font-weight: 800; }
    .lead { margin: 0 0 32px; font-size: 14px; color: var(--ink2); }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 18px;
    }
    .app {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
      padding: 28px 20px 24px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      color: inherit;
      text-decoration: none;
      transition: border-color .15s, box-shadow .15s, transform .15s;
    }
    .app:hover, .app:focus-visible {
      border-color: var(--brand);
      box-shadow: 0 6px 18px rgba(30, 68, 35, .12);
      transform: translateY(-2px);
      outline: none;
    }
    .icon {
      width: 88px;
      height: 88px;
      border-radius: 20px;
      display: grid;
      place-items: center;
      background: var(--brand);
      color: #fff;
      font-size: 36px;
      font-weight: 800;
    }
    .icon img { width: 100%; height: 100%; display: block; }
    .name { font-size: 17px; font-weight: 700; }
    .desc { font-size: 13px; line-height: 1.5; color: var(--ink2); }
    .empty { font-size: 14px; color: var(--ink2); }
  </style>
</head>
<body>
  <header>
    <img src="assets/agromillora-logo.png" alt="Agromillora">
  </header>
  <main>
    <p class="eyebrow">Agromillora</p>
    <h1>Apps</h1>
    <p class="lead">Elige la aplicación que quieres abrir.</p>
    <?php if (!$apps): ?>
      <p class="empty">Todavía no hay ninguna app.</p>
    <?php else: ?>
      <div class="grid">
        <?php foreach ($apps as $app): ?>
          <a class="app" href="<?= e($app['href']) ?>">
            <span class="icon">
              <?php if ($app['icon']): ?>
                <img src="<?= e($app['icon']) ?>" alt="">
              <?php else: ?>
                <?= e(mb_strtoupper(mb_substr($app['name'], 0, 1))) ?>
              <?php endif; ?>
            </span>
            <span class="name"><?= e($app['name']) ?></span>
            <?php if ($app['description'] !== ''): ?>
              <span class="desc"><?= e($app['description']) ?></span>
            <?php endif; ?>
          </a>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </main>
</body>
</html>
