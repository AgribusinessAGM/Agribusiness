import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { hashPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// En Railway (o cualquier host con filesystem efímero), define DB_PATH apuntando
// a un Volume montado (ej. /data/data.db) para que los usuarios no se pierdan
// en cada despliegue.
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.db');

export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    org TEXT NOT NULL DEFAULT '',
    password_hash TEXT,
    status TEXT NOT NULL DEFAULT 'invited',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS invites (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS access (
    user_id INTEGER NOT NULL,
    model_id INTEGER NOT NULL,
    level TEXT NOT NULL,
    PRIMARY KEY (user_id, model_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migración para bases de datos creadas antes de añadir el rol.
const hasRoleColumn = db
  .prepare("SELECT 1 FROM pragma_table_info('users') WHERE name = 'role'")
  .get();
if (!hasRoleColumn) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
}

// Demo seed: replica los usuarios que ya existían como datos de ejemplo en el
// prototipo, con una contraseña conocida para poder probar el login real.
const DEMO_PASSWORD = 'agromillora2026';

function seedIfEmpty() {
  const { c } = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (c > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, org, password_hash, status, role) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertAccess = db.prepare('INSERT INTO access (user_id, model_id, level) VALUES (?, ?, ?)');

  const seed = [
    {
      name: 'María Ferrer',
      email: 'm.ferrer@iberocrops.com',
      org: 'Iberocrops (Cliente)',
      role: 'user',
      access: { 1: 'edit', 2: 'view', 3: 'none' },
    },
    {
      name: 'James Whitfield',
      email: 'j.whitfield@greenfund.eu',
      org: 'GreenFund (Inversor)',
      role: 'user',
      access: { 1: 'view', 2: 'none', 3: 'view' },
    },
    {
      name: 'Carlos Ruiz',
      email: 'c.ruiz@agromillora.com',
      org: 'Agromillora (Admin)',
      role: 'admin',
      access: { 1: 'edit', 2: 'edit', 3: 'edit' },
    },
    {
      name: 'Ana Costa',
      email: 'a.costa@alentejofarms.pt',
      org: 'Alentejo Farms (Cliente)',
      role: 'user',
      access: { 1: 'none', 2: 'none', 3: 'edit' },
    },
  ];

  const hash = hashPassword(DEMO_PASSWORD);
  for (const u of seed) {
    const { lastInsertRowid } = insertUser.run(u.name, u.email, u.org, hash, 'active', u.role);
    for (const [modelId, level] of Object.entries(u.access)) {
      if (level !== 'none') insertAccess.run(lastInsertRowid, Number(modelId), level);
    }
  }
  console.log(`[db] Usuarios demo creados. Contraseña demo para todos: "${DEMO_PASSWORD}"`);
}

seedIfEmpty();
