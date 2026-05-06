import Link from "next/link";
import { ArrowRight, ClipboardList, Sparkles, UsersRound } from "lucide-react";

export default function Home() {
  return (
    <main className="px-6 py-8 sm:px-8 lg:px-10">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
                <Sparkles size={14} />
                Zahids Chem Clinic management
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Welcome back, manager.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-500">
                Manage admissions and review today&apos;s activity from one calm, focused workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500 lg:max-w-sm">
              <p className="font-medium text-slate-900">Daily flow</p>
              <p className="mt-1">
                Use the quick actions below to open admissions or review the daily summary.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Link
              href="/admission"
              className="group rounded-3xl border border-slate-200 bg-slate-50 p-7 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                <UsersRound size={22} />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
                Student Admission
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                Register a new student, capture payment details, and keep the admission flow organized.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                Open admission
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="group rounded-3xl border border-slate-200 bg-slate-50 p-7 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <ClipboardList size={22} />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
                View Daily Summary
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                Review today&apos;s inflow, expenses, and transaction overview in a clean summary view.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                Open summary
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
