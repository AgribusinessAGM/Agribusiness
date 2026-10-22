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
  const iag = m.a.engine === 'iag';
  let capexGroups = m.a.capexGroups.map((g) => ({
    ...g,
    items: g.items.map((it) => {
      if (it.key !== 'dd' || it.total || it.ddHa) return it;
      changed = true;
      const label = it.label === 'Due Diligence (15.000 € / 300 ha)' ? 'Due Diligence' : it.label;
      return { ...it, label, v: Math.round((+it.v || 0) * sup * 100) / 100, total: true };
    }),
  }));
  // Modelos IAG: Due Diligence pasa de importe total a 70 €/Ha editable, el proyecto de riego
  // sube al bloque de riego y se añade la plantación mecánica
  if (iag) {
    const grp = (k) => capexGroups.find((g) => g.key === k);
    const viab = grp('viab');
    const riego = grp('riego');
    const plant = grp('plant');
    const dd = viab && viab.items.find((it) => it.key === 'dd');
    if (dd && !dd.ddHa) {
      changed = true;
      capexGroups = capexGroups.map((g) =>
        g.key !== 'viab' ? g : { ...g, items: g.items.map((it) => (it.key === 'dd' ? { key: 'dd', label: 'Due Diligence', v: 70, ddHa: true } : it)) },
      );
    }
    const proj = viab && viab.items.find((it) => it.key === 'irrproj');
    if (proj && riego) {
      changed = true;
      capexGroups = capexGroups.map((g) =>
        g.key === 'viab'
          ? { ...g, items: g.items.filter((it) => it.key !== 'irrproj') }
          : g.key === 'riego'
            ? { ...g, items: [...g.items, proj] }
            : g,
      );
    }
    // orden del bloque de riego: proyecto, sistema, energía
    const RIEGO_ORDER = ['irrproj', 'irrsys', 'energy'];
    const rg = grp('riego');
    if (rg) {
      const sorted = [...rg.items].sort((x, y) => (RIEGO_ORDER.indexOf(x.key) + 1 || 99) - (RIEGO_ORDER.indexOf(y.key) + 1 || 99));
      if (sorted.some((it, i) => it !== rg.items[i])) {
        changed = true;
        capexGroups = capexGroups.map((g) => (g.key === 'riego' ? { ...g, items: sorted } : g));
      }
    }
    // "Accessories (Stake + Protector)" se parte en "Trellis + Protector" (nueva, 0) y
    // "Stake + Protector" (conserva el importe que había)
    if (plant && plant.items.some((it) => it.key === 'accessories')) {
      changed = true;
      capexGroups = capexGroups.map((g) =>
        g.key !== 'plant'
          ? g
          : {
              ...g,
              items: g.items.flatMap((it) =>
                it.key !== 'accessories'
                  ? [it]
                  : [
                      { key: 'trellis', label: 'Training and support system (Trellis + Protector)', v: 0 },
                      { key: 'stake', label: 'Training and support system (Stake + Protector)', v: it.v },
                    ],
              ),
            },
      );
    }
    // nombres "Planting method 1./2." en los modelos que ya tenían las dos partidas
    const PM = {
      trellis: 'Training and support system (Trellis + Protector)',
      stake: 'Training and support system (Stake + Protector)',
      manual: 'Manual planting',
      mechanical: 'Mechanised planting',
    };
    if (capexGroups.some((g) => g.key === 'plant' && g.items.some((it) => PM[it.key] && it.label !== PM[it.key]))) {
      changed = true;
      capexGroups = capexGroups.map((g) =>
        g.key !== 'plant' ? g : { ...g, items: g.items.map((it) => (PM[it.key] ? { ...it, label: PM[it.key] } : it)) },
      );
    }
    // plantación manual, mecánica y fertilizante pasan de €/Árbol a €/Ha (mismo importe por Ha)
    const dens = m.a.marcoN > 0 && m.a.marcoM > 0 ? 10000 / (m.a.marcoN * m.a.marcoM) : 0;
    const HA_KEYS = ['manual', 'mechanical', 'fert'];
    if (plant && plant.items.some((it) => HA_KEYS.includes(it.key) && it.unit !== 'ha')) {
      changed = true;
      capexGroups = capexGroups.map((g) =>
        g.key !== 'plant'
          ? g
          : { ...g, items: g.items.map((it) => (HA_KEYS.includes(it.key) && it.unit !== 'ha' ? { ...it, v: Math.round((+it.v || 0) * dens), unit: 'ha' } : it)) },
      );
    }
    if (plant && !plant.items.some((it) => it.key === 'mechanical')) {
      changed = true;
      capexGroups = capexGroups.map((g) => {
        if (g.key !== 'plant') return g;
        const items = [...g.items];
        const i = items.findIndex((it) => it.key === 'manual');
        items.splice(i < 0 ? items.length : i + 1, 0, { key: 'mechanical', label: 'Mechanised planting', v: 0, unit: 'ha' });
        return { ...g, items };
      });
    }
  }
  // la categoría "3LIS System" se añadió y luego se descartó (22/10/2026): se quita si está
  if (capexGroups.some((g) => g.key === 'lis')) {
    changed = true;
    capexGroups = capexGroups.filter((g) => g.key !== 'lis');
  }
  // Torrimpietra: "Roads, facilities, etc." pasa de "Farm maintenance" a "Infrastructure
  // maintenance" y la categoría "farm" desaparece
  let opexItems = m.a.opexItems;
  const farm = m.a.engine === 'iag' && Array.isArray(opexItems) ? opexItems.find((c) => c.key === 'farm') : null;
  if (farm && opexItems.some((c) => c.key === 'infra')) {
    changed = true;
    opexItems = opexItems
      .filter((c) => c.key !== 'farm')
      .map((c) => (c.key === 'infra' ? { ...c, items: [...c.items, ...farm.items] } : c));
  }
  // Torrimpietra: supuestos del fondo de inversión añadidos después (0 = sin fondo)
  const fondo = {};
  if (m.a.engine === 'iag') {
    for (const k of ['successFee', 'fondoCost', 'fondoOtros']) {
      if (m.a[k] == null) {
        fondo[k] = 0;
        changed = true;
      }
    }
  }
  return changed ? { ...m, a: { ...m.a, capexGroups, opexItems, ...fondo } } : m;
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
