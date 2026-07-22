"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export const field =
  "w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 transition-colors duration-200 focus:border-brand focus:outline-none";

export const label = "mb-1.5 block text-xs font-semibold text-muted";

export const primaryButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60";

export const ghostButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      aria-label={title}
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-slate-950/60"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-sm font-bold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="cursor-pointer rounded-lg p-1 text-muted transition-colors duration-200 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

export type Toast = { kind: "success" | "error"; text: string } | null;

export function ToastView({ toast }: { toast: Toast }) {
  if (!toast) return null;
  const success = toast.kind === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg sm:left-auto sm:right-6 sm:translate-x-0 ${
        success
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
      }`}
    >
      {success ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      <span>{toast.text}</span>
    </div>
  );
}

export function RoleBadge({ role }: { role: "ADMIN" | "MEMBER" }) {
  return (
    <span
      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
        role === "ADMIN"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
      }`}
    >
      {role}
    </span>
  );
}
