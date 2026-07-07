import type { AccessLevel, AppUser, Assumptions, CurrentUser, CropType, FinModel, ModelStatus, UserRole } from './types';

const TOKEN_KEY = 'om_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // almacenamiento no disponible (ej. modo privado) — la sesión simplemente no persistirá
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ver setToken
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Error de red (${res.status})`);
  }
  return body as T;
}

export function fetchUsers(): Promise<AppUser[]> {
  return request<AppUser[]>('/users');
}

export function login(email: string, password: string): Promise<{ ok: true; token: string; user: CurrentUser }> {
  return request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function getMe(): Promise<{ ok: true; user: CurrentUser }> {
  return request('/me');
}

export function inviteUser(input: {
  name: string;
  email: string;
  org: string;
  role: UserRole;
}): Promise<{ ok: true; user: AppUser; devLink?: string }> {
  return request('/users/invite', { method: 'POST', body: JSON.stringify(input) });
}

export function createUser(input: {
  name: string;
  email: string;
  org: string;
  password: string;
  role: UserRole;
}): Promise<{ ok: true; user: AppUser }> {
  return request('/users', { method: 'POST', body: JSON.stringify(input) });
}

export function setUserRole(userId: number, role: UserRole): Promise<{ ok: true; role: UserRole }> {
  return request(`/users/${userId}/role`, { method: 'POST', body: JSON.stringify({ role }) });
}

export function deleteUser(userId: number): Promise<{ ok: true }> {
  return request(`/users/${userId}`, { method: 'DELETE' });
}

export function getInvite(token: string): Promise<{ name: string; email: string }> {
  return request(`/invites/${token}`);
}

export function acceptInvite(token: string, password: string): Promise<{ ok: true }> {
  return request(`/invites/${token}/accept`, { method: 'POST', body: JSON.stringify({ password }) });
}

export function setAccess(userId: number, modelId: number, level: AccessLevel): Promise<{ ok: true }> {
  return request('/access', { method: 'POST', body: JSON.stringify({ userId, modelId, level }) });
}

export function resetPassword(userId: number, password: string): Promise<{ ok: true }> {
  return request(`/users/${userId}/password`, { method: 'POST', body: JSON.stringify({ password }) });
}

export function fetchModels(): Promise<FinModel[]> {
  return request<FinModel[]>('/models');
}

export function createModel(input: {
  name: string;
  crop: CropType;
  region: string;
  status: ModelStatus;
  a: Assumptions;
}): Promise<{ ok: true; model: FinModel }> {
  return request('/models', { method: 'POST', body: JSON.stringify(input) });
}

export function updateModel(id: number, model: FinModel): Promise<{ ok: true; model: FinModel }> {
  return request(`/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: model.name, crop: model.crop, region: model.region, status: model.status, a: model.a }),
  });
}
