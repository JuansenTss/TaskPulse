import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as fs from 'fs/promises';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3001;
// Data files
const TASKS_FILE = path.resolve(__dirname, './tasks.json');
const USERS_FILE = path.resolve(__dirname, './users.json');
const SESSION_COOKIE = 'tp_session';

// very simple in-memory session store
const sessions = new Map<string, { username: string }>();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'TaskPulse API is running' });
});

// Auth helpers
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });
  const session = sessions.get(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  (req as unknown as { user: { username: string } }).user = session;
  next();
}

// Ensure users file exists with a default admin user
async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    const adminHash = await bcrypt.hash('admin', 10);
    const defaultUsers = [{ username: 'admin', password: adminHash }];
    await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

async function readUsers(): Promise<Array<{ username: string; password: string; email?: string }>> {
  await ensureUsersFile();
  const raw = await fs.readFile(USERS_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUsers(users: Array<{ username: string; password: string; email?: string }>) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Auth routes (support both root and /api prefix for dev/prod flexibility)
function handleLogin(req: Request, res: Response) {
  const { username, password, rememberMe } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  readUsers()
    .then(users => {
      const found = users.find(u => u.username === username);
      if (!found) return res.status(401).json({ error: 'Invalid username or password' });

      const storedPassword = (found as { password: string }).password as string;
      const isHashLike = typeof storedPassword === 'string' && storedPassword.startsWith('$2');

      const verify = isHashLike ? bcrypt.compare(password, storedPassword) : Promise.resolve(storedPassword === password);

      return verify.then(async (ok: boolean) => {
        if (!ok) return res.status(401).json({ error: 'Invalid username or password' });

        // If legacy plaintext matched, migrate to hash
        if (!isHashLike && storedPassword === password) {
          const usersAll = await readUsers();
          const idx = usersAll.findIndex(u => u.username === username);
          if (idx !== -1) {
            usersAll[idx].password = await bcrypt.hash(password, 10);
            await writeUsers(usersAll);
          }
        }

        const sessionId = randomUUID();
        sessions.set(sessionId, { username });

        const cookieOptions: { httpOnly: true; sameSite: 'lax'; secure: false; maxAge?: number } = {
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
        };
        if (rememberMe) {
          cookieOptions.maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
        }
        res.cookie(SESSION_COOKIE, sessionId, cookieOptions);
        res.json({ user: { username } });
      });
    })
    .catch(() => res.status(500).json({ error: 'Failed to read users' }));
}
app.post('/auth/login', handleLogin);
app.post('/api/auth/login', handleLogin);

async function handleSignup(req: Request, res: Response) {
  const { username, password, email } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const users = await readUsers();
    const exists = users.some(u => u.username === username);
    if (exists) return res.status(409).json({ error: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    users.push({ username, password: hash, email });
    await writeUsers(users);
    res.status(201).json({ user: { username } });
  } catch {
    res.status(500).json({ error: 'Failed to create user' });
  }
}
app.post('/auth/signup', handleSignup);
app.post('/api/auth/signup', handleSignup);

async function handleResetPassword(req: Request, res: Response) {
  const { username, email, newPassword } = req.body || {};
  if ((!username && !email) || !newPassword) {
    return res.status(400).json({ error: 'Username or email and newPassword are required' });
  }
  try {
    const users = await readUsers();
    const idx = users.findIndex(u => (username ? u.username === username : (email && u.email === email)));
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const hash = await bcrypt.hash(newPassword, 10);
    users[idx] = { ...users[idx], password: hash };
    await writeUsers(users);
    res.status(200).json({ user: { username: users[idx].username } });
  } catch {
    res.status(500).json({ error: 'Failed to reset password' });
  }
}
app.post('/auth/reset', handleResetPassword);
app.post('/api/auth/reset', handleResetPassword);

function handleLogout(req: Request, res: Response) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie(SESSION_COOKIE, { sameSite: 'lax', secure: false, httpOnly: true });
  res.sendStatus(204);
}
app.post('/auth/logout', handleLogout);
app.post('/api/auth/logout', handleLogout);

function handleMe(req: Request, res: Response) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });
  const session = sessions.get(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: { username: session.username } });
}
app.get('/auth/me', handleMe);
app.get('/api/auth/me', handleMe);

// Ensure tasks file exists
async function ensureTasksFile() {
  try {
    await fs.access(TASKS_FILE);
  } catch {
    await fs.writeFile(TASKS_FILE, '[]');
  }
}

// Routes
async function handleGetTasks(req: Request, res: Response) {
  try {
    await ensureTasksFile();
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    const username = (req as unknown as { user: { username: string } }).user.username;
    const tasks = JSON.parse(data);
    const filtered = Array.isArray(tasks)
      ? tasks.filter((t: { owner?: string }) => t && t.owner === username)
      : [];
    res.json(filtered);
  } catch {
    res.status(500).json({ error: 'Failed to read tasks' });
  }
}
app.get('/tasks', requireAuth, handleGetTasks);
app.get('/api/tasks', requireAuth, handleGetTasks);

async function handleCreateTask(req: Request, res: Response) {
  try {
    await ensureTasksFile();
    const tasks = JSON.parse(await fs.readFile(TASKS_FILE, 'utf-8'));
    const username = (req as unknown as { user: { username: string } }).user.username;
    const taskWithOwner = { ...req.body, owner: username };
    tasks.push(taskWithOwner);
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
    res.json(taskWithOwner);
  } catch {
    res.status(500).json({ error: 'Failed to save task' });
  }
}
app.post('/tasks', requireAuth, handleCreateTask);
app.post('/api/tasks', requireAuth, handleCreateTask);

async function handleUpdateTask(req: Request, res: Response) {
  try {
    await ensureTasksFile();
    const tasks = JSON.parse(await fs.readFile(TASKS_FILE, 'utf-8'));
    const username = (req as unknown as { user: { username: string } }).user.username;
    const index = tasks.findIndex((t: { id: string }) => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Task not found' });
    if (tasks[index].owner !== username) return res.status(403).json({ error: 'Forbidden' });
    tasks[index] = { ...req.body, owner: username };
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
    res.json(tasks[index]);
  } catch {
    res.status(500).json({ error: 'Failed to update task' });
  }
}
app.put('/tasks/:id', requireAuth, handleUpdateTask);
app.put('/api/tasks/:id', requireAuth, handleUpdateTask);

async function handleDeleteTask(req: Request, res: Response) {
  try {
    await ensureTasksFile();
    const tasksData = await fs.readFile(TASKS_FILE, 'utf-8');
    const tasks = JSON.parse(tasksData);
    const username = (req as unknown as { user: { username: string } }).user.username;
    const index = tasks.findIndex((t: { id: string; owner?: string }) => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Task not found' });
    if (tasks[index].owner !== username) return res.status(403).json({ error: 'Forbidden' });
    tasks.splice(index, 1);
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
    res.sendStatus(204);
  } catch {
    res.status(500).json({ error: 'Failed to delete task' });
  }
}
app.delete('/tasks/:id', requireAuth, handleDeleteTask);
app.delete('/api/tasks/:id', requireAuth, handleDeleteTask);

app.listen(PORT, async () => {
  await ensureUsersFile();
  console.log(`Server running on http://localhost:${PORT}`);
});
