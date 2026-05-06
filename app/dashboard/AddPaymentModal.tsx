"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    _id: string;
    name: string;
    formNumber: string;
    totalAgreedFee: number;
    amountPaid: number;
  } | null;
  onPaymentAdded?: () => void;
}

export default function AddPaymentModal({
  isOpen,
  onClose,
  student,
  onPaymentAdded,
}: AddPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<"2000" | "3000" | "custom">("2000");
  const [customAmount, setCustomAmount] = useState("");
  const [receiptNo, setReceiptNo] = useState("");

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const paymentAmount =
      amount === "custom"
        ? parseFloat(customAmount)
        : parseFloat(amount);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student._id,
          amount: paymentAmount,
          receiptNo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add payment");
        return;
      }

      // Reset form and close
      setAmount("2000");
      setCustomAmount("");
      setReceiptNo("");
      
      if (onPaymentAdded) {
        onPaymentAdded();
      }
      
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const remainingDue = student.totalAgreedFee - student.amountPaid;
  const paymentAmount =
    amount === "custom" ? parseFloat(customAmount) : parseFloat(amount);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Add Payment</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Student Info */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-sm font-medium text-slate-700">{student.name}</p>
          <p className="text-xs text-slate-500">Form: {student.formNumber}</p>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-slate-600">Remaining Due:</span>
            <span className="font-semibold text-slate-900">
              ৳{remainingDue.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Amount Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Amount
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  value="2000"
                  checked={amount === "2000"}
                  onChange={(e) => setAmount(e.target.value as "2000")}
                  className="mr-3"
                />
                <span className="text-sm text-slate-700">৳2,000</span>
              </label>
              <label className="flex items-center p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  value="3000"
                  checked={amount === "3000"}
                  onChange={(e) => setAmount(e.target.value as "3000")}
                  className="mr-3"
                />
                <span className="text-sm text-slate-700">৳3,000</span>
              </label>
              <label className="flex items-center p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  value="custom"
                  checked={amount === "custom"}
                  onChange={(e) => setAmount(e.target.value as "custom")}
                  className="mr-3"
                />
                <span className="text-sm text-slate-700">Custom Amount</span>
              </label>
            </div>
          </div>

          {/* Custom Amount Input */}
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
                min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Receipt Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Receipt Number *
            </label>
            <input
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              placeholder="e.g., R12345"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Amount Display */}
          {!isNaN(paymentAmount) && paymentAmount > 0 && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-xs text-indigo-600">Payment Amount</p>
              <p className="text-lg font-semibold text-indigo-900">
                ৳{paymentAmount.toLocaleString()}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
