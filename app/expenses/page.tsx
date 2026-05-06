"use client";

import { useEffect, useMemo, useState } from "react";

type ExpenseType = "Breakfast" | "Lunch" | "Evening" | "Office";
type ExpenseCategory = "Staff" | "Teacher" | "Guest";

interface ExpenseItem {
  _id: string;
  type: ExpenseType;
  category: ExpenseCategory;
  amount: number;
  note: string;
  date: string;
}

const typeOptions: ExpenseType[] = ["Breakfast", "Lunch", "Evening", "Office"];
const categoryOptions: ExpenseCategory[] = ["Staff", "Teacher", "Guest"];

export default function ExpensesPage() {
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  const [formData, setFormData] = useState({
    type: "Breakfast" as ExpenseType,
    category: "Staff" as ExpenseCategory,
    amount: "",
    note: "",
  });

  const totalToday = useMemo(
    () => expenses.reduce((sum, item) => sum + (item.amount || 0), 0),
    [expenses]
  );

  const fetchExpenses = async () => {
    setLoadingList(true);

    try {
      const response = await fetch("/api/expenses");
      const result = await response.json().catch(() => null);

      if (!response.ok || !result) {
        setError("Could not load today's expenses");
        setExpenses([]);
        return;
      }

      setExpenses(Array.isArray(result.expenses) ? result.expenses : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchExpenses();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.amount) {
      setError("Please provide an amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formData.type,
          category: formData.category,
          amount: Number(formData.amount),
          note: formData.note,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || "Failed to save expense");
        return;
      }

      setSuccess("Expense recorded successfully");
      setFormData({
        type: "Breakfast",
        category: "Staff",
        amount: "",
        note: "",
      });

      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-8">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Daily Expenses</h1>
          <p className="text-slate-500 mt-2">Record operational costs for today</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-600">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Add Expense</h2>

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Type</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as ExpenseType,
                      }))
                    }
                  >
                    {typeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value as ExpenseCategory,
                      }))
                    }
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Amount (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Optional details"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Expense"}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Entries</h2>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                ৳{totalToday.toLocaleString()}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {loadingList ? (
                <p className="text-sm text-slate-500">Loading expenses...</p>
              ) : expenses.length === 0 ? (
                <p className="text-sm text-slate-500">No expenses logged today.</p>
              ) : (
                expenses.map((item) => (
                  <article
                    key={item._id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.type} · {item.category}
                        </p>
                        {item.note ? (
                          <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        ৳{Number(item.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
