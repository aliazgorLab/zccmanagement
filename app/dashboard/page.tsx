"use client";

import { useEffect, useState } from "react";
import { Printer, Calendar, SendHorizonal, Loader2 } from "lucide-react";
import DailyReport from "./DailyReport";

interface SummaryData {
  totalInflow: number;
  totalOutflow: number;
  students: Array<{
    _id: string;
    studentId: string;
    name: string;
    formNumber: string;
    receiptNumber?: string;
    totalFee: number;
    paidToday: number;
    remainingDue: number;
    amountPaid: number;
    status: "PAID" | "DUE";
  }>;
  expenses: Array<{
    _id: string;
    category: "Breakfast" | "Lunch" | "Evening" | "Office";
    recipient: string;
    amount: number;
  }>;
}

const emptySummary: SummaryData = {
  totalInflow: 0,
  totalOutflow: 0,
  students: [],
  expenses: [],
};

const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-32 mb-3"></div>
    <div className="h-8 bg-slate-200 rounded w-24"></div>
  </div>
);

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData>(emptySummary);
  const [error, setError] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [testSmsError, setTestSmsError] = useState<string | null>(null);
  const [testSmsSuccess, setTestSmsSuccess] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);

  const normalizeSummary = (result: Partial<SummaryData> | null | undefined) => ({
    totalInflow: Number(result?.totalInflow ?? 0),
    totalOutflow: Number(result?.totalOutflow ?? 0),
    students: Array.isArray(result?.students) ? result.students : [],
    expenses: Array.isArray(result?.expenses) ? result.expenses : [],
  });

  useEffect(() => {
    if (!selectedDate) return;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ date: selectedDate });
        const response = await fetch(`/api/summary?${query}`);
        const result = await response.json().catch(() => null);
        setSummaryData(normalizeSummary(result));

        if (!response.ok) {
          setError("Summary data loaded with fallback values");
        } else {
          setError(null);
        }
      } catch (err) {
        setSummaryData(emptySummary);
        setError(
          err instanceof Error ? err.message : "An error occurred while fetching data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleTestSms = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTestSmsError(null);
    setTestSmsSuccess(null);

    const phone = testPhone.trim();
    if (!phone) {
      setTestSmsError("Enter a phone number first");
      return;
    }

    setTestSmsLoading(true);

    try {
      const response = await fetch("/api/admin/test-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const providerMessage = result?.error_message || result?.error || result?.raw || null;
        setTestSmsError(providerMessage || "Failed to send test SMS");
        return;
      }

      // Prefer provider success message, fallback to generic
      const successMessage = result?.message || result?.success_message || "Test SMS sent successfully";
      setTestSmsSuccess(successMessage);
    } catch (err) {
      setTestSmsError(err instanceof Error ? err.message : "Failed to send test SMS");
    } finally {
      setTestSmsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Daily Summary
                </h1>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <Calendar size={18} className="text-slate-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-0 px-2 py-1 text-sm font-medium text-slate-900 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
            <p className="text-slate-500">
              Financial overview and transactions for <span suppressHydrationWarning>{selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}</span>
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <Printer size={20} />
            Generate Daily Report
          </button>
        </div>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                SMS Test
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                Send a quick verification message
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sends <span className="font-medium text-slate-700">Hello from ZCC</span> to the number below.
              </p>
            </div>

            <form onSubmit={handleTestSms} className="flex w-full flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center">
              <input
                type="tel"
                inputMode="tel"
                value={testPhone}
                onChange={(event) => setTestPhone(event.target.value)}
                placeholder="Enter your phone number"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />

              <button
                type="submit"
                disabled={testSmsLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testSmsLoading ? <Loader2 size={18} className="animate-spin" /> : <SendHorizonal size={18} />}
                {testSmsLoading ? "Sending..." : "Send test SMS"}
              </button>
            </form>
          </div>

          {(testSmsError || testSmsSuccess) && (
            <div className="mt-4">
              {testSmsError && (
                <p className="text-sm font-medium text-rose-600">{testSmsError}</p>
              )}
              {testSmsSuccess && (
                <p className="text-sm font-medium text-emerald-600">{testSmsSuccess}</p>
              )}
            </div>
          )}
        </section>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              {/* Total Inflow */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <p className="text-sm font-medium text-slate-600 mb-2">
                  Total Inflow
                </p>
                <p className="text-2xl font-semibold tracking-tight text-emerald-600">
                  ৳{summaryData.totalInflow.toLocaleString()}
                </p>
              </div>

              {/* Daily Expenses */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <p className="text-sm font-medium text-slate-600 mb-2">
                  Daily Expenses
                </p>
                <p className="text-2xl font-semibold tracking-tight text-rose-600">
                  ৳{summaryData.totalOutflow.toLocaleString()}
                </p>
              </div>

              {/* Net Cash */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <p className="text-sm font-medium text-slate-600 mb-2">
                  Net Cash
                </p>
                <p className="text-2xl font-semibold tracking-tight text-indigo-600">
                  ৳{(summaryData.totalInflow - summaryData.totalOutflow).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>

        <DailyReport data={summaryData} reportDate={selectedDate} loading={loading} />
    </main>
  );
}
