"use client";

import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "tenantly_theme";

/**
 * No React state: the current theme already lives on <html data-theme>, so CSS
 * decides which icon shows. That also means the button is correct on the very
 * first paint, before hydration.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle dark mode"
      aria-label="Toggle dark mode"
      className="cursor-pointer rounded-xl border border-line bg-surface p-2 text-muted transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <Moon className="h-4 w-4 dark:hidden" aria-hidden />
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
    </button>
  );
}
