"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { Task, TaskStatus, User } from "@/lib/types";
import { TaskCard } from "./task-card";

export const COLUMNS = [
  { status: "TODO", label: "To do", icon: Circle, tint: "text-muted" },
  { status: "IN_PROGRESS", label: "In progress", icon: Clock, tint: "text-amber-500" },
  { status: "DONE", label: "Done", icon: CheckCircle2, tint: "text-emerald-500" },
] as const satisfies ReadonlyArray<{
  status: TaskStatus;
  label: string;
  icon: typeof Circle;
  tint: string;
}>;

export function KanbanBoard({
  tasks,
  user,
  onMove,
}: {
  tasks: Task[];
  user: User;
  onMove: (task: Task, status: TaskStatus) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<TaskStatus | null>(null);

  const drop = (status: TaskStatus) => {
    setHovered(null);
    const task = tasks.find((t) => t.id === draggingId);
    if (task && task.status !== status) onMove(task, status);
    setDraggingId(null);
  };

  return (
    <div className="grid flex-1 gap-4 md:grid-cols-3">
      {COLUMNS.map(({ status, label, icon: Icon, tint }) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setHovered(status);
            }}
            onDragLeave={() => setHovered(null)}
            onDrop={() => drop(status)}
            className={`flex flex-col rounded-2xl border p-3.5 transition-colors duration-200 ${
              hovered === status ? "border-brand bg-brand-soft" : "border-line bg-canvas"
            }`}
          >
            <h3 className="mb-3 flex items-center gap-2 border-b border-line pb-2.5 text-xs font-bold tracking-wide uppercase">
              <Icon className={`h-4 w-4 ${tint}`} aria-hidden />
              {label}
              <span className="ml-auto rounded-md bg-raised px-1.5 py-0.5 text-[11px] text-muted">
                {columnTasks.length}
              </span>
            </h3>

            <div className="flex min-h-32 flex-1 flex-col gap-2.5">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  user={user}
                  dragging={draggingId === task.id}
                  onDragStart={() => setDraggingId(task.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setHovered(null);
                  }}
                  onStatusChange={(next) => onMove(task, next)}
                />
              ))}

              {columnTasks.length === 0 && (
                <p className="my-auto text-center text-xs text-muted">Nothing here</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
