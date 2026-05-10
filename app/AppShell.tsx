"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const { data: session, status } = useSession();

  function getNavClass(href: string) {
    const isActive =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);

    if (isActive) {
      return "flex items-center rounded-xl border border-slate-300 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition";
    }

    return "flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600";
  }

  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-r border-slate-200 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/80 lg:w-72 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        <div className="flex h-full flex-col p-6 lg:p-8">
          <Link href="/" className="group inline-flex flex-col gap-1">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">ZCC</span>
            <span className="text-sm text-slate-500">Zahids Chem Clinic</span>
          </Link>

          <nav className="mt-10 space-y-2">
            <Link href="/dashboard" className={getNavClass("/dashboard")}>
              Dashboard
            </Link>
            <Link href="/admission" className={getNavClass("/admission")}>
              Student Admission
            </Link>
            <Link href="/students" className={getNavClass("/students")}>
              Student Management
            </Link>
            <Link href="/expenses" className={getNavClass("/expenses")}>
              Daily Expenses
            </Link>
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Quick access</p>
              <p className="mt-1 text-sm text-slate-500">
                Switch between daily summary, student admissions, and expense entries.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Signed in</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {status === "loading" ? "Loading account..." : (session?.user?.name ?? "Admin User")}
              </p>
              <p className="mt-1 truncate text-sm text-slate-500">
                {status === "loading" ? "Please wait" : (session?.user?.email ?? "No email")}
              </p>

              {session ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                >
                  Go to login
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur">
          <div className="flex items-center justify-end px-4 py-3 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Admin</p>
                <p className="text-sm font-medium text-slate-900">
                  {status === "loading" ? "Loading account..." : (session?.user?.name ?? "Admin User")}
                </p>
              </div>

              {session ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 sm:text-sm"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 sm:text-sm"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
