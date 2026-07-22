export type Role = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
  companyName: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  assignee?: { id: string; name: string; email: string };
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
}
