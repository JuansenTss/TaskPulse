import type { User } from '../types/task';
import { API_BASE } from './api';

export async function login(username: string, password: string, rememberMe?: boolean): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberMe }),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json();
  return data.user as User;
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to logout');
}

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include'
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to get current user');
  const data = await res.json();
  return data.user as User;
}

export async function signup(username: string, password: string, email?: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email }),
    credentials: 'include'
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Failed to sign up');
  }
  const data = await res.json();
  return data.user as User;
}

export async function resetPassword(username: string | undefined, newPassword: string, email?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, newPassword, email }),
    credentials: 'include'
  });
  if (!res.ok) {
    let message = 'Failed to reset password';
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}


