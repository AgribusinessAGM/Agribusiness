import { randomBytes } from 'node:crypto';
import express from 'express';
import { db } from './db.js';
import { hashPassword, verifyPassword } from './auth.js';
import { sendInviteEmail } from './mailer.js';

try {
  process.loadEnvFile();
} catch {
  // no .env file present — fine, rely on process.env as-is
}

const PORT = process.env.PORT || 8787;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const INVITE_TTL_MS = 7 * 24 * 3600 * 1000;

const app = express();
app.use(express.json());

const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email, org: row.org, status: row.status });

app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT id, name, email, org, status FROM users ORDER BY id').all();
  const accessRows = db.prepare('SELECT user_id, model_id, level FROM access').all();
  const byUser = {};
  for (const r of accessRows) {
    (byUser[r.user_id] ??= {})[r.model_id] = r.level;
  }
  res.json(users.map((u) => ({ ...publicUser(u), access: byUser[u.id] || {} })));
});

app.post('/api/users/invite', async (req, res) => {
  const { name, email, org } = req.body || {};
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Nombre y correo son obligatorios.' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

  let userId;
  if (existing) {
    if (existing.status === 'active') {
      return res.status(409).json({ error: 'Ya existe una cuenta activa con ese correo.' });
    }
    userId = existing.id;
    db.prepare('UPDATE users SET name = ?, org = ? WHERE id = ?').run(name.trim(), org?.trim() || '', userId);
  } else {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (name, email, org, status) VALUES (?, ?, ?, ?)')
      .run(name.trim(), cleanEmail, org?.trim() || '', 'invited');
    userId = lastInsertRowid;
  }

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  db.prepare('INSERT INTO invites (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);

  const link = `${APP_URL}/set-password?token=${token}`;
  let mailResult;
  try {
    mailResult = await sendInviteEmail({ to: cleanEmail, name: name.trim(), link });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }

  const user = db.prepare('SELECT id, name, email, org, status FROM users WHERE id = ?').get(userId);
  res.json({
    ok: true,
    user: { ...publicUser(user), access: {} },
    // Solo se incluye cuando no hay proveedor de email real configurado —
    // conveniencia de desarrollo para poder probar el flujo sin bandeja de entrada.
    devLink: mailResult.sent ? undefined : link,
  });
});

app.get('/api/invites/:token', (req, res) => {
  const invite = db.prepare('SELECT * FROM invites WHERE token = ?').get(req.params.token);
  if (!invite) return res.status(404).json({ error: 'Este enlace no es válido.' });
  if (invite.used_at) return res.status(410).json({ error: 'Este enlace ya se ha utilizado.' });
  if (new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: 'Este enlace ha caducado.' });
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(invite.user_id);
  res.json({ name: user.name, email: user.email });
});

app.post('/api/invites/:token/accept', (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }
  const invite = db.prepare('SELECT * FROM invites WHERE token = ?').get(req.params.token);
  if (!invite) return res.status(404).json({ error: 'Este enlace no es válido.' });
  if (invite.used_at) return res.status(410).json({ error: 'Este enlace ya se ha utilizado.' });
  if (new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: 'Este enlace ha caducado.' });

  db.prepare("UPDATE users SET password_hash = ?, status = 'active' WHERE id = ?").run(
    hashPassword(password),
    invite.user_id,
  );
  db.prepare('UPDATE invites SET used_at = ? WHERE token = ?').run(new Date().toISOString(), req.params.token);
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').trim().toLowerCase());
  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }
  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, org: user.org } });
});

app.post('/api/access', (req, res) => {
  const { userId, modelId, level } = req.body || {};
  if (!userId || !modelId || !level) return res.status(400).json({ error: 'Faltan datos.' });
  if (level === 'none') {
    db.prepare('DELETE FROM access WHERE user_id = ? AND model_id = ?').run(userId, modelId);
  } else {
    db.prepare(
      'INSERT INTO access (user_id, model_id, level) VALUES (?, ?, ?) ' +
        'ON CONFLICT(user_id, model_id) DO UPDATE SET level = excluded.level',
    ).run(userId, modelId, level);
  }
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[server] API escuchando en http://localhost:${PORT}`);
});
