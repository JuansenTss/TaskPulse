import { useState } from 'react';
import type { TaskEntry } from '../types/task';

interface Props {
  onAdd: (task: TaskEntry) => void;
}

export default function TaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: TaskEntry = {
      id: crypto.randomUUID(),
      title,
      status: 'Not Started',
      timestamp: new Date().toISOString(),
    };

    onAdd(newTask);
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        className="task-input"
      />
      <button type="submit">Add Task</button>
    </form>
  );
}