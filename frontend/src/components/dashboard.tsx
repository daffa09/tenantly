"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, LayoutDashboard, LogOut, Menu, Plus, X } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Member, Project, Task, TaskStatus, User } from "@/lib/types";
import { KanbanBoard } from "./kanban-board";
import { ProjectSidebar } from "./project-sidebar";
import { ThemeToggle } from "./theme-toggle";
import { field, ghostButton, label, Modal, primaryButton, RoleBadge, ToastView } from "./ui";
import type { Toast } from "./ui";

type Dialog = "project" | "task" | "member" | "deleteProject" | null;

export function Dashboard({ user }: { user: User }) {
  const { logout } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const [form, setForm] = useState({
    projectName: "",
    projectDesc: "",
    taskTitle: "",
    taskDesc: "",
    taskAssignee: "",
    memberName: "",
    memberEmail: "",
    memberPassword: "",
    memberRole: "MEMBER" as Member["role"],
  });
  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  const notify = useCallback((kind: Toast extends null ? never : "success" | "error", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchProjects = () =>
    api.get<{ data: Project[] }>("/api/v1/projects").then((res) => res.data.data);
  const fetchMembers = () =>
    api.get<{ data: Member[] }>("/api/v1/users").then((res) => res.data.data);
  const fetchTasks = (projectId: string) =>
    api.get<{ data: Task[] }>(`/api/v1/projects/${projectId}/tasks`).then((res) => res.data.data);

  const refreshProjects = async (keep?: Project) => {
    const list = await fetchProjects();
    setProjects(list);
    setSelected((current) => {
      const target = keep ?? current;
      return target ? (list.find((p) => p.id === target.id) ?? null) : (list[0] ?? null);
    });
  };

  useEffect(() => {
    let alive = true;
    Promise.all([fetchProjects(), fetchMembers()])
      .then(([projectList, memberList]) => {
        if (!alive) return;
        setProjects(projectList);
        setMembers(memberList);
        setSelected((current) => current ?? projectList[0] ?? null);
      })
      .catch((err: unknown) => notify("error", apiError(err, "Could not load your workspace")));
    return () => {
      alive = false;
    };
  }, [notify]);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    fetchTasks(selected.id)
      .then((list) => alive && setTasks(list))
      .catch((err: unknown) => notify("error", apiError(err, "Could not load tasks")));
    return () => {
      alive = false;
    };
  }, [selected, notify]);

  const run = async (action: () => Promise<string>, fallback: string) => {
    setBusy(true);
    try {
      notify("success", await action());
      setDialog(null);
    } catch (err) {
      notify("error", apiError(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const createProject = () =>
    run(async () => {
      const res = await api.post<{ data: Project }>("/api/v1/projects", {
        name: form.projectName,
        description: form.projectDesc || undefined,
      });
      set({ projectName: "", projectDesc: "" });
      await refreshProjects(res.data.data);
      return "Project created";
    }, "Could not create the project");

  const deleteProject = () =>
    run(async () => {
      if (!selected) throw new Error("no project");
      await api.delete(`/api/v1/projects/${selected.id}`);
      setSelected(null);
      await refreshProjects();
      return "Project deleted";
    }, "Could not delete the project");

  const createTask = () =>
    run(async () => {
      if (!selected) throw new Error("no project");
      await api.post(`/api/v1/projects/${selected.id}/tasks`, {
        title: form.taskTitle,
        description: form.taskDesc || undefined,
        assigneeId: form.taskAssignee || undefined,
      });
      set({ taskTitle: "", taskDesc: "", taskAssignee: "" });
      setTasks(await fetchTasks(selected.id));
      await refreshProjects();
      return form.taskAssignee ? "Task created — notification queued" : "Task created";
    }, "Could not create the task");

  const addMember = () =>
    run(async () => {
      await api.post("/api/v1/users", {
        name: form.memberName,
        email: form.memberEmail,
        password: form.memberPassword,
        role: form.memberRole,
      });
      set({ memberName: "", memberEmail: "", memberPassword: "" });
      setMembers(await fetchMembers());
      return `${form.memberName} added to ${user.companyName}`;
    }, "Could not add the member");

  const moveTask = async (task: Task, status: TaskStatus) => {
    if (!selected || task.status === status) return;
    const before = tasks;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));

    try {
      await api.patch(`/api/v1/projects/${selected.id}/tasks/${task.id}`, { status });
    } catch (err) {
      setTasks(before); // put it back where the server still thinks it is
      notify("error", apiError(err, "Could not move the task"));
    }
  };

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
            className={`${ghostButton} px-2 lg:hidden`}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Layers className="hidden h-5 w-5 text-brand sm:block" aria-hidden />
          <span className="hidden text-sm font-extrabold tracking-tight sm:block">Tenantly</span>

          <div className="mx-2 hidden h-5 w-px bg-line sm:block" />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user.companyName}</p>
            <p className="flex items-center gap-2 text-xs text-muted">
              <span className="truncate">{user.name}</span>
              <RoleBadge role={user.role} />
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button type="button" onClick={() => void logout()} className={ghostButton}>
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-4 py-5 lg:grid-cols-[280px_1fr]">
        <div className={sidebarOpen ? "block" : "hidden lg:block"}>
          <ProjectSidebar
            projects={projects}
            members={members}
            selected={selected}
            user={user}
            onSelect={(project) => {
              setSelected(project);
              setSidebarOpen(false);
            }}
            onNewProject={() => setDialog("project")}
            onDeleteProject={() => setDialog("deleteProject")}
            onAddMember={() => setDialog("member")}
          />
        </div>

        <main className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 sm:p-5">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div className="min-w-0">
                  <h1 className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
                    <LayoutDashboard className="h-5 w-5 text-brand" aria-hidden />
                    <span className="truncate">{selected.name}</span>
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    {selected.description || "No description yet."}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setDialog("task")}
                    className={primaryButton}
                  >
                    <Plus className="h-4 w-4" />
                    New task
                  </button>
                )}
              </div>

              <KanbanBoard tasks={tasks} user={user} onMove={(task, status) => void moveTask(task, status)} />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
              <LayoutDashboard className="h-10 w-10 text-muted/50" aria-hidden />
              <p className="text-sm font-semibold">No project selected</p>
              <p className="max-w-xs text-xs text-muted">
                {isAdmin
                  ? "Create your first project and start assigning work to your team."
                  : "An admin of this workspace has not created a project yet."}
              </p>
              {isAdmin && (
                <button type="button" onClick={() => setDialog("project")} className={primaryButton}>
                  <Plus className="h-4 w-4" />
                  New project
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      <Modal open={dialog === "project"} onClose={() => setDialog(null)} title="New project">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createProject();
          }}
          className="space-y-4"
        >
          <div>
            <label className={label} htmlFor="projectName">
              Name
            </label>
            <input
              id="projectName"
              className={field}
              required
              value={form.projectName}
              onChange={(e) => set({ projectName: e.target.value })}
              placeholder="Billing revamp"
            />
          </div>
          <div>
            <label className={label} htmlFor="projectDesc">
              Description
            </label>
            <textarea
              id="projectDesc"
              className={field}
              rows={3}
              value={form.projectDesc}
              onChange={(e) => set({ projectDesc: e.target.value })}
              placeholder="What is this project for?"
            />
          </div>
          <DialogActions busy={busy} submit="Create project" onCancel={() => setDialog(null)} />
        </form>
      </Modal>

      <Modal open={dialog === "task"} onClose={() => setDialog(null)} title="New task">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createTask();
          }}
          className="space-y-4"
        >
          <div>
            <label className={label} htmlFor="taskTitle">
              Title
            </label>
            <input
              id="taskTitle"
              className={field}
              required
              value={form.taskTitle}
              onChange={(e) => set({ taskTitle: e.target.value })}
              placeholder="Wire up the invoice webhook"
            />
          </div>
          <div>
            <label className={label} htmlFor="taskDesc">
              Description
            </label>
            <textarea
              id="taskDesc"
              className={field}
              rows={3}
              value={form.taskDesc}
              onChange={(e) => set({ taskDesc: e.target.value })}
            />
          </div>
          <div>
            <label className={label} htmlFor="taskAssignee">
              Assignee
            </label>
            <select
              id="taskAssignee"
              className={`${field} cursor-pointer`}
              value={form.taskAssignee}
              onChange={(e) => set({ taskAssignee: e.target.value })}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted">
              Assigning queues a notification job outside the request.
            </p>
          </div>
          <DialogActions busy={busy} submit="Create task" onCancel={() => setDialog(null)} />
        </form>
      </Modal>

      <Modal open={dialog === "member"} onClose={() => setDialog(null)} title="Add a member">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void addMember();
          }}
          className="space-y-4"
        >
          <p className="rounded-xl border border-line bg-raised px-3.5 py-2.5 text-xs text-muted">
            The account is created inside <strong className="text-ink">{user.companyName}</strong>.
            Nobody can join a workspace on their own.
          </p>
          <div>
            <label className={label} htmlFor="memberName">
              Name
            </label>
            <input
              id="memberName"
              className={field}
              required
              value={form.memberName}
              onChange={(e) => set({ memberName: e.target.value })}
            />
          </div>
          <div>
            <label className={label} htmlFor="memberEmail">
              Email
            </label>
            <input
              id="memberEmail"
              type="email"
              className={field}
              required
              value={form.memberEmail}
              onChange={(e) => set({ memberEmail: e.target.value })}
            />
          </div>
          <div>
            <label className={label} htmlFor="memberPassword">
              Temporary password
            </label>
            <input
              id="memberPassword"
              type="password"
              className={field}
              required
              minLength={8}
              value={form.memberPassword}
              onChange={(e) => set({ memberPassword: e.target.value })}
            />
          </div>
          <div>
            <label className={label} htmlFor="memberRole">
              Role
            </label>
            <select
              id="memberRole"
              className={`${field} cursor-pointer`}
              value={form.memberRole}
              onChange={(e) => set({ memberRole: e.target.value as Member["role"] })}
            >
              <option value="MEMBER">Member — sees projects, edits own tasks</option>
              <option value="ADMIN">Admin — full control of this workspace</option>
            </select>
          </div>
          <DialogActions busy={busy} submit="Add member" onCancel={() => setDialog(null)} />
        </form>
      </Modal>

      <Modal open={dialog === "deleteProject"} onClose={() => setDialog(null)} title="Delete project">
        <p className="text-sm text-muted">
          Delete <strong className="text-ink">{selected?.name}</strong> and all of its tasks? This
          cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={ghostButton} onClick={() => setDialog(null)}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void deleteProject()}
            className={`${primaryButton} bg-red-600`}
          >
            Delete project
          </button>
        </div>
      </Modal>

      <ToastView toast={toast} />
    </div>
  );
}

function DialogActions({
  busy,
  submit,
  onCancel,
}: {
  busy: boolean;
  submit: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button type="button" className={ghostButton} onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" disabled={busy} className={primaryButton}>
        {submit}
      </button>
    </div>
  );
}
