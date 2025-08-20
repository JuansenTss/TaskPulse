export type TaskStatus = 'Not Started' | 'Blocked' | 'In Progress' | 'Completed' | 'Pending Clarification';

export interface TaskEntry {
  id: string;
  title: string;
  status: TaskStatus;
  notes?: string;
  timestamp: string;
  doneDate?: string;
  //To develop
  deleted?: boolean;
  assignee?: string;
  priority?: 'Low' | 'Medium' | 'High';
  tags?: string[];
}

export interface User {
  username: string;
}