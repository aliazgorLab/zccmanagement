"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => searchParams.get("callbackUrl") || "/dashboard", [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      if (result?.url) {
        router.push(result.url);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="pointer-events-none absolute -left-36 -top-24 h-80 w-80 rounded-full bg-[#9bc4ff]/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#ffd8b2]/25 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-5xl rounded-4xl border border-white/80 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur md:p-10 lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-10">
        <div className="hidden border-r border-slate-100 pr-10 lg:block">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Zahids Chem Clinic</p>
          <h1 className="mt-6 text-5xl leading-tight tracking-tight text-slate-900" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            Administration
            <br />
            Access Console
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-slate-500">
            Secure access for internal finance and student records management. Sign in with your admin credentials to continue.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md lg:pl-2">
          <div className="mb-8 lg:hidden">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Zahids Chem Clinic</p>
            <h1 className="mt-3 text-3xl tracking-tight text-slate-900" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              Admin Login
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@zccmanagement.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your secure password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                required
              />
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f6f8] px-6 py-16 sm:px-10">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
