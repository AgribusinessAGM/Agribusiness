import type { AccessLevel, AppUser, CurrentUser } from './types';

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
}): Promise<{ ok: true; user: AppUser; devLink?: string }> {
  return request('/users/invite', { method: 'POST', body: JSON.stringify(input) });
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
