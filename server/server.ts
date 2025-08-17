import express, { Request, Response } from 'express';
import cors from 'cors';
import * as fs from 'fs/promises';
import * as path from 'path';

const app = express();
const PORT = 3001;
// Make sure we're looking at the right directory for tasks.json
const TASKS_FILE = path.resolve(__dirname, './tasks.json');

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'TaskPulse API is running' });
});

// Ensure tasks file exists
async function ensureTasksFile() {
  try {
    await fs.access(TASKS_FILE);
  } catch {
    await fs.writeFile(TASKS_FILE, '[]');
  }
}

// Routes
app.get('/tasks', async (req: Request, res: Response) => {
  try {
    await ensureTasksFile();
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read tasks' });
  }
});

app.post('/tasks', async (req: Request, res: Response) => {
  try {
    await ensureTasksFile();
    const tasks = JSON.parse(await fs.readFile(TASKS_FILE, 'utf-8'));
    tasks.push(req.body);
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save task' });
  }
});

app.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    await ensureTasksFile();
    const tasks = JSON.parse(await fs.readFile(TASKS_FILE, 'utf-8'));
    const index = tasks.findIndex((t: any) => t.id === req.params.id);
    if (index !== -1) {
      tasks[index] = req.body;
      await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
      res.json(req.body);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    console.log('Delete request received for task:', req.params.id);
    console.log('Tasks file path:', TASKS_FILE);
    
    await ensureTasksFile();
    const tasksData = await fs.readFile(TASKS_FILE, 'utf-8');
    console.log('Raw tasks data:', tasksData);
    
    const tasks = JSON.parse(tasksData);
    console.log('Parsed tasks:', tasks);
    
    const index = tasks.findIndex((t: any) => {
      console.log('Comparing task ID:', t.id, 'with requested ID:', req.params.id);
      return t.id === req.params.id;
    });
    console.log('Found task at index:', index);

    if (index !== -1) {
      const deletedTask = tasks.splice(index, 1)[0];
      console.log('Task to be deleted:', deletedTask);
      await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
      console.log('File written successfully');
      res.sendStatus(204);
    } else {
      console.log('Task not found in array of', tasks.length, 'tasks');
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'Failed to delete task', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
