import { useState, useEffect } from 'react';
import type { TaskEntry, User } from './types/task';
import { loadTasks, saveTask, updateTask as updateTaskInStorage, deleteTask as deleteTaskFromStorage } from './utils/storage';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import Login from './components/Login';
import { getCurrentUser, logout } from './utils/auth';

export default function App() {
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await getCurrentUser();
        setUser(me);
        if (me) {
          const t = await loadTasks();
          setTasks(t);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addTask = async (task: TaskEntry) => {
    try {
      const savedTask = await saveTask(task);
      setTasks(prev => [...prev, savedTask]);
    } catch (err) {
      setError('Failed to add task');
    }
  };

  const updateTask = async (updated: TaskEntry) => {
    try {
      const updatedTask = await updateTaskInStorage(updated);
      setTasks(prev =>
        prev.map(task => (task.id === updatedTask.id ? updatedTask : task))
      );
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteTaskFromStorage(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    notStarted: tasks.filter(t => t.status === 'Not Started').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    blocked: tasks.filter(t => t.status === 'Blocked').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    pendingClarification: tasks.filter(t => t.status === 'Pending Clarification').length,
  };

  if (!user) {
    return (
      <div className="login-page">
        {loading ? <div className="loading">Loading...</div> : (
          <Login onLoggedIn={async () => {
            setLoading(true);
            const me = await getCurrentUser();
            setUser(me);
            const t = await loadTasks();
            setTasks(t);
            setLoading(false);
          }} />
        )}
      </div>
    );
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-title">
            <span className="app-logo">📋</span>
            Task Pulse <span style={{ fontSize: '0.5em', color: '#666' }}>(Demo)</span>
          </h1>
          <div className="app-header-right">
            <span style={{ marginRight: 8 }}>Signed in as <strong style={{ fontSize: '1.1em' }}>{user.username}</strong></span>
            <button onClick={async () => {
              await logout();
              setUser(null);
              setTasks([]);
            }}>Sign out</button>
          </div>
        </div>
      </header>
      <div className="app-layout">
      <>
      <aside className="sidebar left-sidebar">
        <h2 className="sidebar-title">Task Statistics</h2>
        <div className="stats-list">
          <div className="stat-item">
            <div className="stat-label">
              <div className="stat-indicator" style={{ backgroundColor: '#e0e0e0' }}></div>
              Not Started
            </div>
            <span className="stat-count">{taskStats.notStarted}</span>
          </div>
          <div className="stat-item">
            <div className="stat-label">
              <div className="stat-indicator" style={{ backgroundColor: '#ffd700' }}></div>
              In Progress
            </div>
            <span className="stat-count">{taskStats.inProgress}</span>
          </div>
          <div className="stat-item">
            <div className="stat-label">
              <div className="stat-indicator" style={{ backgroundColor: '#ff6b6b' }}></div>
              Blocked
            </div>
            <span className="stat-count">{taskStats.blocked}</span>
          </div>
          <div className="stat-item">
            <div className="stat-label">
              <div className="stat-indicator" style={{ backgroundColor: '#4a9eff' }}></div>
              Pending Clarification
            </div>
            <span className="stat-count">{taskStats.pendingClarification}</span>
          </div>
          <div className="stat-item">
            <div className="stat-label">
              <div className="stat-indicator" style={{ backgroundColor: '#50c878' }}></div>
              Completed
            </div>
            <span className="stat-count">{taskStats.completed}</span>
          </div>
          <div className="stats-divider" />
          <div className="total-tasks">
            <span>Total Tasks</span>
            <span>{taskStats.total}</span>
          </div>
        </div>
      </aside>

      <main>
        {error && <div className="error-message">{error}</div>}
        <TaskForm onAdd={addTask} />
        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : (
          <TaskList tasks={tasks} onUpdate={updateTask} onDelete={deleteTask} />
        )}
      </main>

      <aside className="sidebar right-sidebar">
        <h2 className="sidebar-title">Recent Activity</h2>
        <div className="recent-activity">
          {tasks
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5)
            .map(task => (
            <div key={task.id} className="activity-item">
              <div className="activity-header activity-title">{task.title}</div>
              <div className="activity-body activity-action">{task.status}</div>
              <div className="activity-body activity-time">
                {new Date(task.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </aside>
      </>
      </div>
    </>
  );
}