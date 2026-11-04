"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Admin login failed");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Admin login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-5 py-10">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Eilm Academy</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your admin credentials to view analytics.</p>
        {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        <form onSubmit={submitLogin} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Username
            <input
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              autoComplete="current-password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

export function AdminLogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function logout() {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", { method: "DELETE" });
      if (!response.ok) throw new Error("Admin logout failed");
      router.refresh();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Admin logout failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span role="alert" className="text-xs text-rose-700">{error}</span>}
      <button type="button" onClick={() => void logout()} disabled={isSubmitting} className="text-xs font-semibold text-slate-600 hover:text-slate-950 disabled:opacity-60">
        {isSubmitting ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
