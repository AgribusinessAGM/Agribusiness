// Llamadas a la API PHP (api/index.php). Todas devuelven una promesa con el
// JSON de respuesta, o fallan con el mensaje de error de la API.

const TOKEN_KEY = 'om_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // almacenamiento no disponible (ej. modo privado) — la sesión simplemente no persistirá
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ver setToken
  }
}

async function request(path, init) {
  const token = getToken();
  // Ruta relativa: la app puede vivir en cualquier carpeta (ej. htdocs/Agribusiness).
  const res = await fetch(`api/index.php${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // X-Auth-Token además de Authorization: algunos servidores PHP (FastCGI) no
      // pasan Authorization a PHP.
      ...(token ? { Authorization: `Bearer ${token}`, 'X-Auth-Token': token } : {}),
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Error de red (${res.status})`);
  }
  return body;
}

export function fetchUsers() {
  return request('/users');
}

export function login(email, password) {
  return request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function getMe() {
  return request('/me');
}

// input: { name, email, org, role }
export function inviteUser(input) {
  return request('/users/invite', { method: 'POST', body: JSON.stringify(input) });
}

// input: { name, email, org, password, role }
export function createUser(input) {
  return request('/users', { method: 'POST', body: JSON.stringify(input) });
}

export function setUserRole(userId, role) {
  return request(`/users/${userId}/role`, { method: 'POST', body: JSON.stringify({ role }) });
}

export function deleteUser(userId) {
  return request(`/users/${userId}`, { method: 'DELETE' });
}

export function getInvite(token) {
  return request(`/invites/${token}`);
}

export function acceptInvite(token, password) {
  return request(`/invites/${token}/accept`, { method: 'POST', body: JSON.stringify({ password }) });
}

export function setAccess(userId, modelId, level) {
  return request('/access', { method: 'POST', body: JSON.stringify({ userId, modelId, level }) });
}

export function resetPassword(userId, password) {
  return request(`/users/${userId}/password`, { method: 'POST', body: JSON.stringify({ password }) });
}

// La Due Diligence se guarda como importe total de la finca (it.total). Los modelos
// guardados antes la tenían en €/Ha: se convierten al cargarlos (€/Ha × superficie).
export function normalizeModel(m) {
  if (!m || !m.a || !Array.isArray(m.a.capexGroups)) return m;
  const sup = +m.a.superficie || 0;
  let changed = false;
  const capexGroups = m.a.capexGroups.map((g) => ({
    ...g,
    items: g.items.map((it) => {
      if (it.key !== 'dd' || it.total) return it;
      changed = true;
      const label = it.label === 'Due Diligence (15.000 € / 300 ha)' ? 'Due Diligence' : it.label;
      return { ...it, label, v: Math.round((+it.v || 0) * sup * 100) / 100, total: true };
    }),
  }));
  return changed ? { ...m, a: { ...m.a, capexGroups } } : m;
}

export async function fetchModels() {
  return (await request('/models')).map(normalizeModel);
}

// input: { name, crop, region, status, a }
export function createModel(input) {
  return request('/models', { method: 'POST', body: JSON.stringify(input) });
}

export function updateModel(id, model) {
  return request(`/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: model.name, crop: model.crop, region: model.region, status: model.status, a: model.a }),
  });
}
