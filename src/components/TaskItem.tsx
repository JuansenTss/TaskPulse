import { useState } from 'react';
import type { TaskEntry, TaskStatus } from '../types/task';

interface Props {
  index: number;
  task: TaskEntry;
  onUpdate: (task: TaskEntry) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskItem({ index, task, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState<'title' | 'notes' | null>(null);
  const [editValue, setEditValue] = useState('');

  const statusOptions: TaskStatus[] = ['Not Started', 'Blocked', 'In Progress', 'Completed', 'Pending Clarification'];

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleDoubleClick = (field: 'title' | 'notes') => {
    setEditing(field);
    setEditValue(field === 'title' ? task.title : task.notes || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditing(null);
    }
  };

  const handleSave = () => {
    if (editing) {
      onUpdate({
        ...task,
        [editing]: editValue
      });
      setEditing(null);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <tr>
      <td className="row-number">{index}</td>
      <td onDoubleClick={() => handleDoubleClick('title')}>
        {editing === 'title' ? (
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
            className="inline-edit"
          />
        ) : (
          task.title
        )}
      </td>
      <td className="status-cell">
        <select
          value={task.status}
          onChange={(e) => {
            const newStatus = e.target.value as TaskStatus;
            onUpdate({
              ...task,
              status: newStatus,
              doneDate: newStatus === 'Completed' ? new Date().toISOString() : undefined
            });
          }}
          className={`status-select status-${task.status.toLowerCase().replace(' ', '-')}`}
          disabled={task.status === 'Completed'}
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </td>
      <td>{formatDate(task.timestamp)}</td>
      <td>{task.doneDate ? formatDate(task.doneDate) : '—'}</td>
      <td onDoubleClick={() => handleDoubleClick('notes')}>
        {editing === 'notes' ? (
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
            className="inline-edit"
          />
        ) : (
          task.notes || '—'
        )}
      </td>
      <td>
        <button
          className="delete-button"
          onClick={() => onDelete?.(task.id)}
          title="Delete task"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    </tr>
  );
}