import type { AccessLevel, AppUser, CurrentUser, UserRole } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
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

export function login(email: string, password: string): Promise<{ ok: true; user: CurrentUser }> {
  return request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
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
