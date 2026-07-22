"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Layers, Loader2, ShieldCheck, UserCog, Zap } from "lucide-react";
import { apiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { field, label, primaryButton } from "./ui";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Tenant isolation",
    body: "Every query is scoped by the company on your session — guessing an id gets you a 404.",
  },
  {
    icon: UserCog,
    title: "Roles that mean something",
    body: "Admins run the workspace and its people; members move only the tasks assigned to them.",
  },
  {
    icon: Zap,
    title: "Work off the request path",
    body: "Assignment notifications are handed to a queue worker instead of blocking the response.",
  },
];

const DEMO_ACCOUNTS = [
  { email: "admin@acme.com", who: "Alice", tenant: "Acme Corp", role: "Admin" },
  { email: "member@acme.com", who: "Bob", tenant: "Acme Corp", role: "Member" },
  { email: "admin@stark.com", who: "Tony", tenant: "Stark Industries", role: "Admin" },
];

type Mode = "signin" | "signup";

export function LoginView() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@acme.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await register({ companyName, name, email, password });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(apiError(err, "Something went wrong. Is the API running?"));
      setBusy(false);
    }
  };

  const signInAsDemo = async (demoEmail: string) => {
    setError("");
    setMode("signin");
    setEmail(demoEmail);
    setPassword("password123");
    setBusy(true);
    try {
      await login(demoEmail, "password123");
    } catch (err) {
      setError(apiError(err, "Demo login failed — run the database seed first."));
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2 lg:gap-16">
      <section className="relative flex flex-col justify-center overflow-hidden bg-indigo-50 px-6 py-10 text-slate-900 sm:px-10 dark:bg-slate-950 dark:text-slate-100 lg:items-end lg:py-12 lg:pr-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-600/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10"
        />

        <div className="relative w-full max-w-md">
          <div className="flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-brand" />
            <span className="text-lg font-extrabold tracking-tight">Tenantly</span>
          </div>

          <h1 className="mt-8 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            Every company gets its own workspace.
            <span className="block text-slate-500 dark:text-slate-400">None of them can see each other.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            A small multi-tenant project manager: projects, tasks and people, kept apart by the
            session you sign in with.
          </p>

          <ul className="mt-8 hidden space-y-4 lg:block">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                  <Icon className="h-4.5 w-4.5 text-brand" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 hidden text-xs text-slate-500 lg:block dark:text-slate-500">
            NestJS · Next.js · PostgreSQL · Prisma · BullMQ
          </p>
        </div>
      </section>

      {/* Form side */}
      <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:justify-start lg:pl-16">
        <div className="w-full max-w-sm">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {mode === "signin" ? "Sign in" : "Create a workspace"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {mode === "signin"
                  ? "Use your work email to reach your company's board."
                  : "You will be the admin of a brand new tenant."}
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-raised p-1"
          >
            {(["signin", "signup"] as const).map((value) => (
              <button
                key={value}
                role="tab"
                type="button"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  setError("");
                }}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  mode === value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {value === "signin" ? "Sign in" : "Create workspace"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className={label} htmlFor="companyName">
                    Company name
                  </label>
                  <input
                    id="companyName"
                    className={field}
                    required
                    autoComplete="organization"
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Creates a new tenant. To join an existing one, ask its admin to add you.
                  </p>
                </div>
                <div>
                  <label className={label} htmlFor="name">
                    Your name
                  </label>
                  <input
                    id="name"
                    className={field}
                    required
                    autoComplete="name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className={label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={field}
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className={label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={field}
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div aria-live="polite">
              {error && (
                <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}
            </div>

            <button type="submit" disabled={busy} className={`${primaryButton} w-full py-3`}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create workspace"}
            </button>
          </form>

          <div className="mt-8 border-t border-line pt-5">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
              Seeded demo accounts
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={busy}
                  onClick={() => void signInAsDemo(account.email)}
                  className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left transition-colors duration-200 hover:border-brand/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">
                      {account.who} · {account.tenant}
                    </span>
                    <span className="block truncate text-[11px] text-muted">{account.email}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-brand">
                    {account.role}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
