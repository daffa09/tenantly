"use client";

import { GripVertical, Lock, Trash2, UserRound } from "lucide-react";
import type { Task, TaskStatus, User } from "@/lib/types";
import { COLUMNS } from "./kanban-board";

export function TaskCard({
  task,
  user,
  dragging,
  onDragStart,
  onDragEnd,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  user: User;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDelete?: () => void;
}) {
  const mine = task.assigneeId === user.id;
  const canEdit = user.role === "ADMIN" || mine;

  return (
    <article
      draggable={canEdit}
      onDragStart={(e) => {
        if (!canEdit) return;
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`rounded-xl border border-line bg-surface p-3.5 transition-colors duration-200 ${
        dragging ? "opacity-40" : ""
      } ${canEdit ? "cursor-grab hover:border-brand/50 active:cursor-grabbing" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm leading-snug font-semibold">{task.title}</h4>
        <div className="flex shrink-0 items-center gap-1.5">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${task.title}`}
              className="cursor-pointer rounded-md p-1 text-muted/60 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {canEdit ? (
            <GripVertical className="h-4 w-4 text-muted/60" aria-hidden />
          ) : (
            <Lock className="h-3.5 w-3.5 text-muted/60" aria-label="Read only" />
          )}
        </div>
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium ${
            mine ? "bg-brand-soft text-brand" : "bg-raised text-muted"
          }`}
        >
          <UserRound className="h-3 w-3" />
          {task.assignee ? (mine ? "You" : task.assignee.name) : "Unassigned"}
        </span>

        {canEdit ? (
          <label className="ml-auto">
            <span className="sr-only">Status for {task.title}</span>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
              className="cursor-pointer rounded-lg border border-line bg-raised px-2 py-1 text-[11px] font-semibold text-muted focus:border-brand focus:outline-none"
            >
              {COLUMNS.map((column) => (
                <option key={column.status} value={column.status}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="ml-auto text-[11px] text-muted italic">Not yours</span>
        )}
      </div>
    </article>
  );
}
