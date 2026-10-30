<?php
// Conexión a MySQL/MariaDB, creación de tablas y datos de ejemplo.

function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = require __DIR__ . '/../config.example.php';
        $local = __DIR__ . '/../config.php';
        if (is_file($local)) {
            $cfg = array_merge($cfg, require $local);
        }
    }
    return $cfg;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $c = config();
    $opts = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $dsn = "mysql:host={$c['db_host']};port={$c['db_port']};charset=utf8mb4";

    try {
        $pdo = new PDO("$dsn;dbname={$c['db_name']}", $c['db_user'], $c['db_pass'], $opts);
    } catch (PDOException $e) {
        // 1049 = la base de datos no existe. En local la creamos.
        if (($e->errorInfo[1] ?? null) !== 1049 || !$c['db_autocreate']) throw $e;
        $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], $opts);
        $pdo->exec("CREATE DATABASE `{$c['db_name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$c['db_name']}`");
    }
    $pdo->exec("SET time_zone = '+00:00'");

    ensure_schema($pdo);
    return $pdo;
}

function ensure_schema(PDO $pdo): void
{
    $exists = $pdo->query("SHOW TABLES LIKE 'models'")->fetchColumn();
    if (!$exists) {
        $sql = preg_replace('/^--.*$/m', '', file_get_contents(__DIR__ . '/../data/schema.sql'));
        foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
            $pdo->exec($statement);
        }
        // Los modelos van primero: los permisos de los usuarios de ejemplo apuntan a ellos.
        seed_models($pdo);
        // Los usuarios de ejemplo tienen una contraseña pública: solo en local.
        $adminId = !empty(config()['demo_users']) ? seed_users($pdo) : null;
        if ($adminId) $pdo->prepare('UPDATE models SET created_by = ?')->execute([$adminId]);
    }
    ensure_rate_limit_tables($pdo);
    ensure_first_admin($pdo);
    ensure_iag_model($pdo);
}

// Tablas de los límites contra abusos: intentos de login fallidos y solicitudes de
// "He olvidado mi contraseña". Se añadieron después del esquema inicial, así que también
// se crean en bases de datos que ya existían.
function ensure_rate_limit_tables(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS login_attempts (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(190) NOT NULL,
          ip VARCHAR(45) NOT NULL,
          attempted_at DATETIME NOT NULL,
          KEY (email, attempted_at),
          KEY (ip, attempted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS forgot_requests (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          ip VARCHAR(45) NOT NULL,
          requested_at DATETIME NOT NULL,
          KEY (ip, requested_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

// Producción: sin usuarios de ejemplo, el primer administrador es el correo de
// admin_email. Se crea como invitado y entra con "He olvidado mi contraseña".
function ensure_first_admin(PDO $pdo): void
{
    $email = mb_strtolower(trim((string) (config()['admin_email'] ?? '')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return;
    if ((int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0) return;
    $pdo->prepare('INSERT INTO users (name, email, org, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute(['Administrador', $email, 'Agromillora', 'invited', 'admin', now_utc()]);
}

// Modelo Torrimpietra (motor IAG). Se añadió después de los modelos de ejemplo,
// así que también se crea en bases de datos que ya existían: solo si todavía no
// hay ningún modelo IAG, y con acceso de edición para los administradores.
function ensure_iag_model(PDO $pdo): void
{
    $hasIag = $pdo->query("SELECT COUNT(*) FROM models WHERE assumptions LIKE '%\"engine\":\"iag\"%'")->fetchColumn();
    if ((int) $hasIag > 0) return;

    $m = json_decode(file_get_contents(__DIR__ . '/../data/seed-iag.json'));
    $adminId = $pdo->query("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1")->fetchColumn();
    $pdo->prepare(
        'INSERT INTO models (name, crop, region, status, created_by, updated_at, assumptions) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([$m->name, $m->crop, $m->region, $m->status, $adminId ?: null, now_utc(), json_out($m->a)]);
    $modelId = (int) $pdo->lastInsertId();

    $insertAccess = $pdo->prepare('INSERT INTO access (user_id, model_id, level) VALUES (?, ?, ?)');
    foreach ($pdo->query("SELECT id FROM users WHERE role = 'admin'")->fetchAll(PDO::FETCH_COLUMN) as $id) {
        $insertAccess->execute([(int) $id, $modelId, 'edit']);
    }
}

// Usuarios de ejemplo, con una contraseña conocida para poder probar el login.
// Solo se crean con 'demo_users' => true en config.php (pruebas en local).
const DEMO_PASSWORD = 'agromillora2026';

function seed_users(PDO $pdo): ?int
{
    if ((int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0) return null;

    $seed = [
        ['María Ferrer', 'm.ferrer@iberocrops.com', 'Iberocrops (Cliente)', 'user', [1 => 'edit', 2 => 'view']],
        ['James Whitfield', 'j.whitfield@greenfund.eu', 'GreenFund (Inversor)', 'user', [1 => 'view', 3 => 'view']],
        ['Carlos Ruiz', 'c.ruiz@agromillora.com', 'Agromillora (Admin)', 'admin', [1 => 'edit', 2 => 'edit', 3 => 'edit']],
        ['Ana Costa', 'a.costa@alentejofarms.pt', 'Alentejo Farms (Cliente)', 'user', [3 => 'edit']],
    ];

    $insertUser = $pdo->prepare(
        'INSERT INTO users (name, email, org, password_hash, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $insertAccess = $pdo->prepare('INSERT INTO access (user_id, model_id, level) VALUES (?, ?, ?)');
    $hash = password_hash(DEMO_PASSWORD, PASSWORD_DEFAULT);
    $adminId = null;

    foreach ($seed as [$name, $email, $org, $role, $access]) {
        $insertUser->execute([$name, $email, $org, $hash, 'active', $role, now_utc()]);
        $id = (int) $pdo->lastInsertId();
        if ($role === 'admin') $adminId = $id;
        foreach ($access as $modelId => $level) {
            $insertAccess->execute([$id, $modelId, $level]);
        }
    }
    return $adminId;
}

function seed_models(PDO $pdo): void
{
    if ((int) $pdo->query('SELECT COUNT(*) FROM models')->fetchColumn() > 0) return;

    $models = json_decode(file_get_contents(__DIR__ . '/../data/seed-models.json'));
    $insert = $pdo->prepare(
        'INSERT INTO models (id, name, crop, region, status, updated_at, assumptions) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $daysAgo = [0, 4, 14];
    foreach ($models as $i => $m) {
        $updated = now_utc(-($daysAgo[$i] ?? 0) * 86400);
        $insert->execute([$m->id, $m->name, $m->crop, $m->region, $m->status, $updated, json_out($m->a)]);
    }
}

function now_utc(int $offsetSeconds = 0): string
{
    return gmdate('Y-m-d H:i:s', time() + $offsetSeconds);
}

function json_out($value): string
{
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
}
