import type { TaskEntry } from '../types/task';

// Demo mode: Use localStorage instead of API
const TASKS_STORAGE_KEY = 'taskpulse_demo_tasks';

export const loadTasks = async (): Promise<TaskEntry[]> => {
  const stored = localStorage.getItem(TASKS_STORAGE_KEY);
  if (!stored) return [];

  const tasks: TaskEntry[] = JSON.parse(stored);

  // Migrate existing completed tasks to have a doneDate
  const updatedTasks = tasks.map((task) => {
    if (task.status === 'Completed' && !task.doneDate) {
      return {
        ...task,
        doneDate: task.timestamp
      };
    }
    return task;
  });

  if (JSON.stringify(tasks) !== JSON.stringify(updatedTasks)) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
  }

  return updatedTasks;
};

export const saveTask = async (task: TaskEntry): Promise<TaskEntry> => {
  const tasks = await loadTasks();
  const newTask = { ...task, id: task.id || crypto.randomUUID() };
  tasks.push(newTask);
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  return newTask;
};

export const updateTask = async (task: TaskEntry): Promise<TaskEntry> => {
  const tasks = await loadTasks();
  const index = tasks.findIndex(t => t.id === task.id);
  if (index === -1) throw new Error('Task not found');
  tasks[index] = task;
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  return task;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const tasks = await loadTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(filtered));
};