"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { companyName: string; name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: User }>("/api/v1/auth/me")
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ data: { user: User } }>("/api/v1/auth/login", { email, password });
    setUser(res.data.data.user);
  }, []);

  const register = useCallback<AuthState["register"]>(async (input) => {
    const res = await api.post<{ data: { user: User } }>("/api/v1/auth/register", input);
    setUser(res.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/v1/auth/logout");
    setUser(null);
  }, []);

  return (
    <AuthContext value={{ user, loading, login, register, logout }}>{children}</AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
