import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { hashPassword } from './auth.js';
import { buildSeedModels } from './seedModels.js';

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
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    crop TEXT NOT NULL DEFAULT 'olivo',
    region TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Borrador',
    created_by INTEGER,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    assumptions TEXT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

// Migración para bases de datos creadas antes de añadir el rol.
const hasRoleColumn = db
  .prepare("SELECT 1 FROM pragma_table_info('users') WHERE name = 'role'")
  .get();
if (!hasRoleColumn) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
}

// Demo seed: replica los usuarios y modelos que ya existían como datos de
// ejemplo en el prototipo, con una contraseña conocida para poder probar el
// login real.
const DEMO_PASSWORD = 'agromillora2026';

function seedUsersIfEmpty() {
  const { c } = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (c > 0) return null;

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
  let adminId = null;
  for (const u of seed) {
    const { lastInsertRowid } = insertUser.run(u.name, u.email, u.org, hash, 'active', u.role);
    if (u.role === 'admin') adminId = lastInsertRowid;
    for (const [modelId, level] of Object.entries(u.access)) {
      if (level !== 'none') insertAccess.run(lastInsertRowid, Number(modelId), level);
    }
  }
  console.log(`[db] Usuarios demo creados. Contraseña demo para todos: "${DEMO_PASSWORD}"`);
  return adminId;
}

function seedModelsIfEmpty(createdBy) {
  const { c } = db.prepare('SELECT COUNT(*) as c FROM models').get();
  if (c > 0) return;

  const insertModel = db.prepare(
    'INSERT INTO models (id, name, crop, region, status, created_by, updated_at, assumptions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();
  const updatedAt = [daysAgo(0), daysAgo(4), daysAgo(14)];

  buildSeedModels().forEach((m, i) => {
    insertModel.run(m.id, m.name, m.crop, m.region, m.status, createdBy, updatedAt[i], JSON.stringify(m.a));
  });
  console.log('[db] Modelos demo creados.');
}

const seededAdminId = seedUsersIfEmpty();
seedModelsIfEmpty(seededAdminId);

// Migración: renombra una sub-partida de OPEX ya persistida en modelos existentes
// (los modelos nuevos ya nacen con el nombre correcto vía seedModels.js).
function renameOpexItemLabel(oldLabel, newLabel) {
  const rows = db.prepare('SELECT id, assumptions FROM models').all();
  const update = db.prepare('UPDATE models SET assumptions = ? WHERE id = ?');
  for (const row of rows) {
    const a = JSON.parse(row.assumptions);
    let changed = false;
    for (const cat of a.opexItems || []) {
      for (const it of cat.items || []) {
        if (it.label === oldLabel) {
          it.label = newLabel;
          changed = true;
        }
      }
    }
    if (changed) update.run(JSON.stringify(a), row.id);
  }
}
renameOpexItemLabel('Reabastecimiento (de agua)', 'Suministro (de agua)');
renameOpexItemLabel('Poda manual en invierno', 'Poda manual\nen invierno');
