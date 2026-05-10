"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FoundStudent {
  _id: string;
  studentId: string;
  name: string;
  phone?: string;
  year?: "1st" | "2nd";
  formNumber: string;
  totalAgreedFee: number;
  amountPaid: number;
  remainingDue: number;
  status: "PAID" | "DUE";
}

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-selected student — pass null to use the built-in search flow. */
  student?: FoundStudent | null;
  onPaymentAdded?: () => void;
}

export default function AddPaymentModal({
  isOpen,
  onClose,
  student: preselectedStudent = null,
  onPaymentAdded,
}: AddPaymentModalProps) {
  // ── Search state ────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundStudent, setFoundStudent] = useState<FoundStudent | null>(
    preselectedStudent
  );

  // ── Payment state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState<"2000" | "3000" | "custom">("2000");
  const [customAmount, setCustomAmount] = useState("");
  const [receiptNo, setReceiptNo] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // When modal opens, focus the search input and reset state
  useEffect(() => {
    if (isOpen) {
      setFoundStudent(preselectedStudent);
      setSearchInput("");
      setSearchError(null);
      setError(null);
      setSuccess(false);
      setAmount("2000");
      setCustomAmount("");
      setReceiptNo("");

      if (!preselectedStudent) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, preselectedStudent]);

  // Debounced lookup — fires 600 ms after the user stops typing
  useEffect(() => {
    if (preselectedStudent) return; // no search needed when pre-selected
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = searchInput.trim();
    if (!query) {
      setFoundStudent(null);
      setSearchError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      setFoundStudent(null);

      try {
        const res = await fetch(
          `/api/students/lookup?studentId=${encodeURIComponent(query)}`
        );
        const data = await res.json();

        if (!res.ok) {
          setSearchError(data.error ?? "Student not found");
        } else {
          setFoundStudent(data.student);
        }
      } catch {
        setSearchError("Network error — please try again");
      } finally {
        setSearching(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, preselectedStudent]);

  if (!isOpen) return null;

  const activeStudent = foundStudent;
  const remainingDue = activeStudent?.remainingDue ?? 0;
  const paymentAmount =
    amount === "custom" ? parseFloat(customAmount) : parseFloat(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activeStudent) {
      setError("Please search and select a student first");
      return;
    }

    if (!receiptNo.trim()) {
      setError("Please enter a receipt number");
      return;
    }

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: activeStudent._id, // MongoDB _id for the DB update
          amount: paymentAmount,
          receiptNo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add payment");
        return;
      }

      setSuccess(true);

      // Auto-close after 1.5 s and refresh parent list
      setTimeout(() => {
        setSuccess(false);
        onPaymentAdded?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* ── Header ── */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Collect Fee</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── Student ID Search (hidden when pre-selected) ── */}
          {!preselectedStudent && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student ID
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  {searching ? (
                    <Loader2
                      size={16}
                      className="text-indigo-500 animate-spin"
                    />
                  ) : (
                    <Search size={16} className="text-slate-400" />
                  )}
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. ZCC-2024-001"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm"
                />
              </div>

              {/* Search error */}
              {searchError && (
                <div className="mt-2 flex items-center gap-2 text-rose-600 text-xs">
                  <AlertCircle size={13} />
                  {searchError}
                </div>
              )}
            </div>
          )}

          {/* ── Auto-filled student info card ── */}
          {activeStudent ? (
            <div
              className={`rounded-lg border p-4 ${
                activeStudent.status === "PAID"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-indigo-50 border-indigo-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {activeStudent.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID: {activeStudent.studentId} &nbsp;·&nbsp; Year: {activeStudent.year}
                  </p>
                  {activeStudent.phone && (
                    <p className="text-xs text-slate-500 mt-1">
                      Phone: {activeStudent.phone}
                    </p>
                  )}
                </div>
                <CheckCircle2 size={18} className="text-indigo-500 mt-0.5 shrink-0" />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white/70 rounded-md p-2 text-center">
                  <p className="text-slate-500">Total Fee</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    ৳{activeStudent.totalAgreedFee.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/70 rounded-md p-2 text-center">
                  <p className="text-slate-500">Paid</p>
                  <p className="font-semibold text-emerald-700 mt-0.5">
                    ৳{activeStudent.amountPaid.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/70 rounded-md p-2 text-center">
                  <p className="text-slate-500">Remaining</p>
                  <p
                    className={`font-semibold mt-0.5 ${
                      remainingDue > 0 ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    ৳{remainingDue.toLocaleString()}
                  </p>
                </div>
              </div>

              {activeStudent.status === "PAID" && (
                <p className="mt-2 text-xs text-emerald-700 font-medium text-center">
                  ✓ This student has no outstanding dues
                </p>
              )}
            </div>
          ) : (
            !preselectedStudent && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400">
                Enter a Student ID above to load student details
              </div>
            )
          )}

          {/* ── Payment form (only shown when a student is loaded) ── */}
          {activeStudent && activeStudent.status === "DUE" && (
            <>
              {/* Error / Success banners */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700">
                    ✓ Payment recorded successfully!
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quick Amount Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Amount
                  </label>
                  <div className="space-y-2">
                    {(["2000", "3000", "custom"] as const).map((val) => (
                      <label
                        key={val}
                        className="flex items-center p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <input
                          type="radio"
                          value={val}
                          checked={amount === val}
                          onChange={() => setAmount(val)}
                          className="mr-3 accent-indigo-600"
                        />
                        <span className="text-sm text-slate-700">
                          {val === "custom" ? "Custom Amount" : `৳${parseInt(val).toLocaleString()}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                {amount === "custom" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Enter Amount (৳)
                    </label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0"
                      step="100"
                      min="1"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                )}

                {/* Receipt Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Receipt Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="e.g., R12345"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Amount preview */}
                {!isNaN(paymentAmount) && paymentAmount > 0 && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex justify-between items-center">
                    <p className="text-xs text-indigo-600">Payment Amount</p>
                    <p className="text-lg font-semibold text-indigo-900">
                      ৳{paymentAmount.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Add Payment"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* PAID student — only show close */}
          {activeStudent && activeStudent.status === "PAID" && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
