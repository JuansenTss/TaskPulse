import type { User } from '../types/task';

// Demo mode: Use localStorage instead of API
const USER_STORAGE_KEY = 'taskpulse_demo_user';
const USERS_STORAGE_KEY = 'taskpulse_demo_users';

// Initialize with demo user
const initDemoUsers = () => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    const defaultUsers = [
      { username: 'demo', password: 'demo', email: 'demo@taskpulse.com' }
    ];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  }
};

export async function login(username: string, password: string, rememberMe?: boolean): Promise<User> {
  initDemoUsers();

  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [];

  const user = users.find((u: any) => u.username === username && u.password === password);
  if (!user) throw new Error('Invalid credentials');

  const currentUser: User = { username: user.username, email: user.email };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
  return currentUser;
}

export async function logout(): Promise<void> {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) {
    // Auto-login as demo user for demo purposes
    const demoUser: User = { username: 'demo', email: 'demo@taskpulse.com' };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoUser));
    return demoUser;
  }
  return JSON.parse(stored);
}

export async function signup(username: string, password: string, email?: string): Promise<User> {
  initDemoUsers();

  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [];

  if (users.some((u: any) => u.username === username)) {
    throw new Error('Username already exists');
  }

  const newUser = { username, password, email };
  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  const currentUser: User = { username, email };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
  return currentUser;
}

export async function resetPassword(username: string | undefined, newPassword: string, email?: string): Promise<void> {
  initDemoUsers();

  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [];

  const userIndex = users.findIndex((u: any) =>
    (username && u.username === username) || (email && u.email === email)
  );

  if (userIndex === -1) {
    throw new Error('User not found');
  }

  users[userIndex].password = newPassword;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}


