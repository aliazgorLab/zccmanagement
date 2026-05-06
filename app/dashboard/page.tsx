"use client";

import { useEffect, useState } from "react";
import { Printer, Calendar } from "lucide-react";
import DailyReport from "./DailyReport";

interface SummaryData {
  totalInflow: number;
  totalOutflow: number;
  students: Array<{
    _id: string;
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
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const normalizeSummary = (result: Partial<SummaryData> | null | undefined) => ({
    totalInflow: Number(result?.totalInflow ?? 0),
    totalOutflow: Number(result?.totalOutflow ?? 0),
    students: Array.isArray(result?.students) ? result.students : [],
    expenses: Array.isArray(result?.expenses) ? result.expenses : [],
  });

  useEffect(() => {
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
              Financial overview and transactions for {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
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
