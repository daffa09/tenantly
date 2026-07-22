"use client";

import { Loader2 } from "lucide-react";
import { Dashboard } from "@/components/dashboard";
import { LoginView } from "@/components/login-view";
import { AuthProvider, useAuth } from "@/lib/auth";

export default function Page() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2.5 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading your workspace…
      </div>
    );
  }

  return user ? <Dashboard user={user} /> : <LoginView />;
}
