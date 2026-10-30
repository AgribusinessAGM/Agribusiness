<?php
// API de la Plataforma AGRIBUSINESS: rutas que devuelven JSON a la interfaz.
//
// La ruta llega como PATH_INFO (api/index.php/login) o, si el servidor no lo
// soporta, como parámetro (api/index.php?r=/login).

require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/mailer.php';

const INVITE_TTL = 72 * 3600; // alta y reenvío de acceso
const RESET_TTL = 3600; // He olvidado mi contraseña
const SESSION_TTL = 30 * 24 * 3600;
// Login: como mucho 5 fallos por correo y 20 por IP cada 15 minutos
const LOGIN_WINDOW = 15 * 60;
const LOGIN_MAX_PER_EMAIL = 5;
const LOGIN_MAX_PER_IP = 20;
// "He olvidado mi contraseña": como mucho 10 solicitudes por IP y hora
const FORGOT_MAX_PER_IP = 10;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header_remove('X-Powered-By');

// ---------- Utilidades ----------

class HttpError extends Exception
{
    public function __construct(public int $status, string $message)
    {
        parent::__construct($message);
    }
}

function respond($data, int $status = 200): void
{
    http_response_code($status);
    echo json_out($data);
    exit;
}

function body(): array
{
    static $body = null;
    if ($body === null) {
        $decoded = json_decode(file_get_contents('php://input') ?: '', true);
        $body = is_array($decoded) ? $decoded : [];
    }
    return $body;
}

function str_field(array $b, string $key): string
{
    return isset($b[$key]) && is_scalar($b[$key]) ? trim((string) $b[$key]) : '';
}

function public_user(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'org' => $row['org'],
        'status' => $row['status'],
        'role' => normalize_role($row['role']),
    ];
}

function normalize_role($role): string
{
    return $role === 'admin' ? 'admin' : 'user';
}

function is_expired(string $utc): bool
{
    return strtotime($utc . ' UTC') < time();
}

function relative_label(string $utc): string
{
    $days = (int) floor((time() - strtotime($utc . ' UTC')) / 86400);
    if ($days <= 0) return 'hoy';
    if ($days === 1) return 'ayer';
    if ($days < 14) return "hace $days días";
    if ($days < 60) return 'hace ' . intdiv($days, 7) . ' semanas';
    return 'hace ' . intdiv($days, 30) . ' meses';
}

function new_token(): string
{
    return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
}

function require_password(array $b): string
{
    $password = isset($b['password']) && is_string($b['password']) ? $b['password'] : '';
    if (mb_strlen($password) < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
    return $password;
}

function find_user(int $id): array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if (!$user) throw new HttpError(404, 'No existe esa persona.');
    return $user;
}

// ---------- Autenticación ----------

function auth_token(): ?string
{
    // El frontend envía el token en X-Auth-Token: Authorization lleva el usuario y la
    // contraseña del .htaccess ("Basic …"). Por compatibilidad se acepta también
    // "Authorization: Bearer …", pero nunca se toma un "Basic …" como token.
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if ($token === '') {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (str_starts_with($header, 'Bearer ')) $token = substr($header, 7);
    }
    return $token !== '' ? $token : null;
}

function require_auth(): array
{
    $token = auth_token();
    if (!$token) throw new HttpError(401, 'No has iniciado sesión.');

    $stmt = db()->prepare('SELECT * FROM sessions WHERE token = ?');
    $stmt->execute([$token]);
    $session = $stmt->fetch();
    if (!$session || is_expired($session['expires_at'])) {
        throw new HttpError(401, 'Tu sesión ha caducado. Vuelve a iniciar sesión.');
    }
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$session['user_id']]);
    $user = $stmt->fetch();
    if (!$user) throw new HttpError(401, 'No has iniciado sesión.');
    return $user;
}

function require_admin(): array
{
    $user = require_auth();
    if ($user['role'] !== 'admin') throw new HttpError(403, 'Solo un administrador puede hacer esto.');
    return $user;
}

function create_session(int $userId): string
{
    $token = new_token();
    db()->prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        ->execute([$token, $userId, now_utc(), now_utc(SESSION_TTL)]);
    return $token;
}

// ---------- Usuarios e invitaciones ----------

function route_me(): void
{
    respond(['ok' => true, 'user' => public_user(require_auth())]);
}

function route_list_users(): void
{
    require_admin();
    $users = db()->query('SELECT id, name, email, org, status, role FROM users ORDER BY id')->fetchAll();
    $byUser = [];
    foreach (db()->query('SELECT user_id, model_id, level FROM access')->fetchAll() as $r) {
        $byUser[$r['user_id']][(string) $r['model_id']] = $r['level'];
    }
    respond(array_map(
        fn ($u) => public_user($u) + ['access' => (object) ($byUser[$u['id']] ?? [])],
        $users
    ));
}

function find_user_by_email(string $email): ?array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    return $stmt->fetch() ?: null;
}

function route_invite(): void
{
    require_admin();
    $b = body();
    $name = str_field($b, 'name');
    $email = mb_strtolower(str_field($b, 'email'));
    $org = str_field($b, 'org');
    $role = normalize_role($b['role'] ?? null);
    if ($name === '' || $email === '') throw new HttpError(400, 'Nombre y correo son obligatorios.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new HttpError(400, 'El correo no es válido.');

    $existing = find_user_by_email($email);
    if ($existing) {
        if ($existing['status'] === 'active') throw new HttpError(409, 'Ya existe una cuenta activa con ese correo.');
        $userId = (int) $existing['id'];
        db()->prepare('UPDATE users SET name = ?, org = ?, role = ? WHERE id = ?')->execute([$name, $org, $role, $userId]);
    } else {
        db()->prepare('INSERT INTO users (name, email, org, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$name, $email, $org, 'invited', $role, now_utc()]);
        $userId = (int) db()->lastInsertId();
    }

    $out = ['ok' => true, 'user' => public_user(find_user($userId)) + ['access' => (object) []]];
    $devLink = send_access_link($userId, 'invite');
    if ($devLink) $out['devLink'] = $devLink;
    respond($out);
}

// Crea un enlace de un solo uso para que la persona ponga su contraseña y se lo envía por
// correo. Nadie más ve la contraseña ni el enlace: sin correo configurado es un error, salvo
// en local con dev_show_links (entonces devuelve el enlace para mostrarlo en pantalla).
function send_access_link(int $userId, string $kind): ?string
{
    $user = find_user($userId);
    $token = new_token();
    db()->prepare('INSERT INTO invites (token, user_id, expires_at) VALUES (?, ?, ?)')
        ->execute([$token, $userId, now_utc($kind === 'reset' ? RESET_TTL : INVITE_TTL)]);
    $link = rtrim(config()['app_url'], '/') . '/?token=' . $token;
    try {
        $mail = send_invite_email($user['email'], $user['name'], $link, $kind);
    } catch (RuntimeException $e) {
        throw new HttpError(502, $e->getMessage());
    }
    if ($mail['sent']) return null;
    if (!empty(config()['dev_show_links'])) return $link;
    throw new HttpError(503, 'El envío de correo no está configurado: no se puede enviar el enlace de acceso.');
}

// Administrador: vuelve a enviar a una persona un enlace para crear (o cambiar) su contraseña
function route_send_access(int $userId): void
{
    require_admin();
    $user = find_user($userId);
    $devLink = send_access_link($userId, $user['status'] === 'invited' ? 'invite' : 'reset');
    respond($devLink ? ['ok' => true, 'devLink' => $devLink] : ['ok' => true]);
}

// "He olvidado mi contraseña": responde siempre lo mismo, exista o no el correo, para no
// revelar quién tiene cuenta. Como mucho 3 enlaces por persona y hora. A quien aún no ha
// creado su contraseña (invitado, o el primer administrador) se le reenvía la invitación.
// Además, como mucho FORGOT_MAX_PER_IP solicitudes por IP y hora, existan o no los correos:
// así nadie puede mandar enlaces a muchas personas ni tantear qué correos tienen cuenta.
function route_forgot_password(): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $stmt = db()->prepare('SELECT COUNT(*) FROM forgot_requests WHERE ip = ? AND requested_at > ?');
    $stmt->execute([$ip, now_utc(-3600)]);
    if ((int) $stmt->fetchColumn() >= FORGOT_MAX_PER_IP) {
        throw new HttpError(429, 'Demasiadas solicitudes. Espera una hora y vuelve a probar.');
    }
    db()->prepare('INSERT INTO forgot_requests (ip, requested_at) VALUES (?, ?)')->execute([$ip, now_utc()]);

    $user = find_user_by_email(mb_strtolower(str_field(body(), 'email')));
    if ($user) {
        $stmt = db()->prepare('SELECT COUNT(*) FROM invites WHERE user_id = ? AND expires_at > ?');
        $stmt->execute([$user['id'], now_utc(RESET_TTL - 3600)]);
        if ((int) $stmt->fetchColumn() < 3) {
            try {
                send_access_link((int) $user['id'], $user['status'] === 'invited' ? 'invite' : 'reset');
            } catch (HttpError $e) {
                error_log('[forgot] ' . $e->getMessage());
            }
        }
    }
    respond(['ok' => true]);
}

// Cada persona cambia su propia contraseña (con la actual); se cierran sus otras sesiones
function route_change_own_password(): void
{
    $user = require_auth();
    $b = body();
    $current = isset($b['current']) && is_string($b['current']) ? $b['current'] : '';
    if (!$user['password_hash'] || !password_verify($current, $user['password_hash'])) {
        throw new HttpError(400, 'La contraseña actual no es correcta.');
    }
    $password = require_password($b);
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    db()->prepare('DELETE FROM sessions WHERE user_id = ? AND token <> ?')->execute([$user['id'], auth_token()]);
    respond(['ok' => true]);
}

// Editar el perfil (nombre, correo, organización) desde la pestaña Perfiles
function route_update_profile(int $userId): void
{
    $admin = require_admin();
    $user = find_user($userId);
    $b = body();
    $name = str_field($b, 'name');
    $email = mb_strtolower(str_field($b, 'email'));
    $org = str_field($b, 'org');
    if ($name === '' || $email === '') throw new HttpError(400, 'Nombre y correo son obligatorios.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new HttpError(400, 'El correo no es válido.');
    $other = find_user_by_email($email);
    if ($other && (int) $other['id'] !== $userId) throw new HttpError(409, 'Ya existe otra persona con ese correo.');
    // El rol es opcional. Nadie puede cambiarse el suyo: así siempre queda un administrador.
    $current = normalize_role($user['role']);
    $role = array_key_exists('role', $b) ? normalize_role($b['role']) : $current;
    if ((int) $admin['id'] === $userId && $role !== $current) throw new HttpError(400, 'No puedes cambiar tu propio rol.');
    db()->prepare('UPDATE users SET name = ?, email = ?, org = ?, role = ? WHERE id = ?')
        ->execute([$name, $email, $org, $role, $userId]);
    respond(['ok' => true, 'name' => $name, 'email' => $email, 'org' => $org, 'role' => $role]);
}

function route_delete_user(int $userId): void
{
    $admin = require_admin();
    find_user($userId);
    // Así siempre queda al menos un administrador: el que borra.
    if ((int) $admin['id'] === $userId) throw new HttpError(400, 'No puedes eliminar tu propia cuenta.');
    // access, invites y sessions se borran en cascada.
    db()->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
    respond(['ok' => true]);
}

function valid_invite(string $token): array
{
    $stmt = db()->prepare('SELECT * FROM invites WHERE token = ?');
    $stmt->execute([$token]);
    $invite = $stmt->fetch();
    if (!$invite) throw new HttpError(404, 'Este enlace no es válido.');
    if ($invite['used_at']) throw new HttpError(410, 'Este enlace ya se ha utilizado.');
    if (is_expired($invite['expires_at'])) throw new HttpError(410, 'Este enlace ha caducado.');
    return $invite;
}

function route_get_invite(string $token): void
{
    $user = find_user((int) valid_invite($token)['user_id']);
    respond(['name' => $user['name'], 'email' => $user['email']]);
}

function route_accept_invite(string $token): void
{
    $password = require_password(body());
    $invite = valid_invite($token);
    db()->prepare("UPDATE users SET password_hash = ?, status = 'active' WHERE id = ?")
        ->execute([password_hash($password, PASSWORD_DEFAULT), $invite['user_id']]);
    // este enlace y cualquier otro pendiente de la misma persona dejan de valer, y se
    // cierran sus sesiones abiertas (la contraseña ha cambiado)
    db()->prepare('UPDATE invites SET used_at = ? WHERE user_id = ? AND used_at IS NULL')->execute([now_utc(), $invite['user_id']]);
    db()->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$invite['user_id']]);
    respond(['ok' => true]);
}

function route_login(): void
{
    $b = body();
    $email = mb_strtolower(str_field($b, 'email'));
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $since = now_utc(-LOGIN_WINDOW);

    $stmt = db()->prepare(
        'SELECT COALESCE(SUM(email = ?), 0), COALESCE(SUM(ip = ?), 0) FROM login_attempts WHERE attempted_at > ? AND (email = ? OR ip = ?)'
    );
    $stmt->execute([$email, $ip, $since, $email, $ip]);
    [$byEmail, $byIp] = array_map('intval', $stmt->fetch(PDO::FETCH_NUM));
    if ($byEmail >= LOGIN_MAX_PER_EMAIL || $byIp >= LOGIN_MAX_PER_IP) {
        throw new HttpError(429, 'Demasiados intentos fallidos. Espera 15 minutos y vuelve a probar.');
    }

    $user = find_user_by_email($email);
    $password = isset($b['password']) && is_string($b['password']) ? $b['password'] : '';
    $hash = $user['password_hash'] ?? null;
    // Sin cuenta (o sin contraseña todavía) se comprueba igualmente contra un hash real, para
    // que el tiempo de respuesta no revele qué correos están dados de alta.
    $valid = password_verify($password, $hash ?: timing_hash());
    if (!$user || !$hash || !$valid) {
        db()->prepare('INSERT INTO login_attempts (email, ip, attempted_at) VALUES (?, ?, ?)')
            ->execute([mb_substr($email, 0, 190), $ip, now_utc()]);
        throw new HttpError(401, 'Correo o contraseña incorrectos.');
    }

    db()->prepare('DELETE FROM login_attempts WHERE email = ? OR attempted_at < ?')->execute([$email, $since]);
    purge_expired();
    respond(['ok' => true, 'token' => create_session((int) $user['id']), 'user' => public_user($user)]);
}

// Hash de contraseña de alguna cuenta (mismo coste que los reales), solo para gastar el mismo
// tiempo en un login fallido. Si aún no hay ninguna contraseña, un hash no válido.
function timing_hash(): string
{
    $hash = db()->query('SELECT password_hash FROM users WHERE password_hash IS NOT NULL LIMIT 1')->fetchColumn();
    return $hash ?: '$2y$10$' . str_repeat('.', 53);
}

// Cierra la sesión también en el servidor: el token deja de valer aunque alguien lo tenga
function route_logout(): void
{
    $token = auth_token();
    if ($token) db()->prepare('DELETE FROM sessions WHERE token = ?')->execute([$token]);
    respond(['ok' => true]);
}

// Limpieza al iniciar sesión: sesiones caducadas, enlaces caducados hace más de una semana y
// solicitudes de contraseña de hace más de una hora
function purge_expired(): void
{
    db()->prepare('DELETE FROM sessions WHERE expires_at < ?')->execute([now_utc()]);
    db()->prepare('DELETE FROM invites WHERE expires_at < ?')->execute([now_utc(-7 * 86400)]);
    db()->prepare('DELETE FROM forgot_requests WHERE requested_at < ?')->execute([now_utc(-3600)]);
}

function upsert_access(int $userId, int $modelId, string $level): void
{
    db()->prepare(
        'INSERT INTO access (user_id, model_id, level) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE level = VALUES(level)'
    )->execute([$userId, $modelId, $level]);
}

function route_set_access(): void
{
    require_admin();
    $b = body();
    $userId = (int) ($b['userId'] ?? 0);
    $modelId = (int) ($b['modelId'] ?? 0);
    $level = str_field($b, 'level');
    if (!$userId || !$modelId || $level === '') throw new HttpError(400, 'Faltan datos.');
    if (!in_array($level, ['none', 'view', 'edit'], true)) throw new HttpError(400, 'Nivel de acceso no válido.');
    find_user($userId);
    find_model($modelId);

    if ($level === 'none') {
        db()->prepare('DELETE FROM access WHERE user_id = ? AND model_id = ?')->execute([$userId, $modelId]);
    } else {
        upsert_access($userId, $modelId, $level);
    }
    respond(['ok' => true]);
}

// ---------- Modelos ----------

function model_access_level(int $userId, int $modelId): string
{
    $stmt = db()->prepare('SELECT level FROM access WHERE user_id = ? AND model_id = ?');
    $stmt->execute([$userId, $modelId]);
    return $stmt->fetchColumn() ?: 'none';
}

function shared_label(int $modelId): string
{
    $stmt = db()->prepare("SELECT COUNT(*) FROM access WHERE model_id = ? AND level != 'none'");
    $stmt->execute([$modelId]);
    $c = (int) $stmt->fetchColumn();
    return $c <= 1 ? 'solo tú' : "$c personas";
}

function serialize_model(array $row, string $myAccess): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'crop' => $row['crop'],
        'region' => $row['region'],
        'status' => $row['status'],
        'updated' => relative_label($row['updated_at']),
        'shared' => shared_label((int) $row['id']),
        'myAccess' => $myAccess,
        // Sin "true": así los objetos vacíos siguen siendo {} y no [].
        'a' => json_decode($row['assumptions']),
    ];
}

function find_model(int $id): array
{
    $stmt = db()->prepare('SELECT * FROM models WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) throw new HttpError(404, 'No existe ese modelo.');
    return $row;
}

function crop_of(array $b): string
{
    return ($b['crop'] ?? null) === 'almendro' ? 'almendro' : 'olivo';
}

function route_list_models(): void
{
    $user = require_auth();
    $isAdmin = $user['role'] === 'admin';
    $out = [];
    foreach (db()->query('SELECT * FROM models ORDER BY id')->fetchAll() as $row) {
        $level = $isAdmin ? 'edit' : model_access_level((int) $user['id'], (int) $row['id']);
        if ($level !== 'none') $out[] = serialize_model($row, $level);
    }
    respond($out);
}

function route_create_model(): void
{
    $user = require_auth();
    $b = body();
    $name = str_field($b, 'name');
    if ($name === '' || empty($b['a'])) throw new HttpError(400, 'Faltan datos del modelo.');

    // Se re-decodifica el cuerpo como objetos para guardar los supuestos tal cual llegaron.
    $raw = json_decode(file_get_contents('php://input'));
    db()->prepare(
        'INSERT INTO models (name, crop, region, status, created_by, updated_at, assumptions) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $name, crop_of($b), str_field($b, 'region'), str_field($b, 'status') ?: 'Borrador',
        $user['id'], now_utc(), json_out($raw->a),
    ]);
    $modelId = (int) db()->lastInsertId();
    upsert_access((int) $user['id'], $modelId, 'edit');
    respond(['ok' => true, 'model' => serialize_model(find_model($modelId), 'edit')]);
}

function route_update_model(int $modelId): void
{
    $user = require_auth();
    $row = find_model($modelId);
    $level = $user['role'] === 'admin' ? 'edit' : model_access_level((int) $user['id'], $modelId);
    if ($level !== 'edit') throw new HttpError(403, 'No tienes permiso de edición sobre este modelo.');

    $b = body();
    $raw = json_decode(file_get_contents('php://input'));
    db()->prepare(
        'UPDATE models SET name = ?, crop = ?, region = ?, status = ?, assumptions = ?, updated_at = ? WHERE id = ?'
    )->execute([
        str_field($b, 'name') ?: $row['name'],
        crop_of($b),
        array_key_exists('region', $b) ? str_field($b, 'region') : $row['region'],
        str_field($b, 'status') ?: $row['status'],
        !empty($b['a']) ? json_out($raw->a) : $row['assumptions'],
        now_utc(),
        $modelId,
    ]);
    respond(['ok' => true, 'model' => serialize_model(find_model($modelId), $level)]);
}

// ---------- Enrutado ----------

$method = $_SERVER['REQUEST_METHOD'];
$path = '/' . trim($_SERVER['PATH_INFO'] ?? ($_GET['r'] ?? ''), '/');

$routes = [
    ['GET', '#^/me$#', 'route_me'],
    ['GET', '#^/users$#', 'route_list_users'],
    ['POST', '#^/users/invite$#', 'route_invite'],
    ['POST', '#^/users/(\d+)/profile$#', 'route_update_profile'],
    ['DELETE', '#^/users/(\d+)$#', 'route_delete_user'],
    ['POST', '#^/users/(\d+)/send-access$#', 'route_send_access'],
    ['POST', '#^/password/forgot$#', 'route_forgot_password'],
    ['POST', '#^/me/password$#', 'route_change_own_password'],
    ['GET', '#^/invites/([\w-]+)$#', 'route_get_invite'],
    ['POST', '#^/invites/([\w-]+)/accept$#', 'route_accept_invite'],
    ['POST', '#^/login$#', 'route_login'],
    ['POST', '#^/logout$#', 'route_logout'],
    ['POST', '#^/access$#', 'route_set_access'],
    ['GET', '#^/models$#', 'route_list_models'],
    ['POST', '#^/models$#', 'route_create_model'],
    ['PUT', '#^/models/(\d+)$#', 'route_update_model'],
];

try {
    foreach ($routes as [$m, $pattern, $handler]) {
        if ($m === $method && preg_match($pattern, $path, $match)) {
            $handler(...array_slice($match, 1));
        }
    }
    throw new HttpError(404, 'Ruta no encontrada.');
} catch (HttpError $e) {
    respond(['error' => $e->getMessage()], $e->status);
} catch (Throwable $e) {
    // El detalle (SQL, rutas) solo va al log del servidor, nunca a la respuesta.
    error_log('[api] ' . $e);
    respond(['error' => 'Error interno del servidor.'], 500);
}
