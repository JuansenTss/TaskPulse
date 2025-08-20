import type { TaskEntry } from '../types/task';
import { API_BASE } from './api';

export const loadTasks = async (): Promise<TaskEntry[]> => {
  const response = await fetch(`${API_BASE}/tasks`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to load tasks');
  const tasks: TaskEntry[] = await response.json();
  
  // Migrate existing completed tasks to have a doneDate
  const updatedTasks = tasks.map(async (task) => {
    if (task.status === 'Completed' && !task.doneDate) {
      const updatedTask = {
        ...task,
        doneDate: task.timestamp // Use the creation date as done date for old tasks
      };
      await updateTask(updatedTask);
      return updatedTask;
    }
    return task;
  });

  return Promise.all(updatedTasks);
};

export const saveTask = async (task: TaskEntry): Promise<TaskEntry> => {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to save task');
  return response.json();
};

export const updateTask = async (task: TaskEntry): Promise<TaskEntry> => {
  const response = await fetch(`${API_BASE}/tasks/${task.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to delete task');
};