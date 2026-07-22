"use client";

import { FolderKanban, Plus, Trash2, Users } from "lucide-react";
import type { Member, Project, User } from "@/lib/types";
import { RoleBadge } from "./ui";

export function ProjectSidebar({
  projects,
  members,
  selected,
  user,
  onSelect,
  onNewProject,
  onDeleteProject,
  onAddMember,
}: {
  projects: Project[];
  members: Member[];
  selected: Project | null;
  user: User;
  onSelect: (project: Project) => void;
  onNewProject: () => void;
  onDeleteProject: (project: Project) => void;
  onAddMember: () => void;
}) {
  const isAdmin = user.role === "ADMIN";

  return (
    <aside className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-4">
      <section>
        <header className="mb-3 flex items-center justify-between border-b border-line pb-2.5">
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
            <FolderKanban className="h-4 w-4 text-brand" aria-hidden />
            Projects
            <span className="text-muted">({projects.length})</span>
          </h2>
          {isAdmin && (
            <button
              type="button"
              onClick={onNewProject}
              aria-label="New project"
              className="cursor-pointer rounded-lg p-1.5 text-brand transition-colors duration-200 hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </header>

        <ul className="space-y-1.5">
          {projects.map((project) => {
            const active = selected?.id === project.id;

            return (
              <li key={project.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(project)}
                  aria-current={active ? "true" : undefined}
                  className={`min-w-0 flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    active
                      ? "border-brand bg-brand-soft text-ink"
                      : "border-transparent text-muted hover:bg-raised hover:text-ink"
                  }`}
                >
                  <span className="block truncate text-sm font-semibold">{project.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {project._count?.tasks ?? 0} tasks
                  </span>
                </button>

                {isAdmin && active && (
                  <button
                    type="button"
                    onClick={() => onDeleteProject(project)}
                    aria-label={`Delete ${project.name}`}
                    className="cursor-pointer rounded-lg p-2 text-muted transition-colors duration-200 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}

          {projects.length === 0 && (
            <li className="py-4 text-center text-xs text-muted">
              No projects in this workspace yet.
            </li>
          )}
        </ul>
      </section>

      <section>
        <header className="mb-3 flex items-center justify-between border-b border-line pb-2.5">
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
            <Users className="h-4 w-4 text-brand" aria-hidden />
            People
            <span className="text-muted">({members.length})</span>
          </h2>
          {isAdmin && (
            <button
              type="button"
              onClick={onAddMember}
              aria-label="Add member"
              className="cursor-pointer rounded-lg p-1.5 text-brand transition-colors duration-200 hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </header>

        <ul className="space-y-2">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">{member.name}</span>
                <span className="block truncate text-xs text-muted">{member.email}</span>
              </span>
              <RoleBadge role={member.role} />
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
