"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdmissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    year: "1st" as "1st" | "2nd",
    formNumber: "",
    moneyReceiptNumber: "",
    amountPaid: "",
    totalAgreedFee: "13000",
    paymentType: "Partial" as "Partial" | "Full",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleYearChange = (year: "1st" | "2nd") => {
    setFormData((prev) => ({
      ...prev,
      year,
    }));
  };

  const handlePaymentTypeChange = (type: "Partial" | "Full") => {
    setFormData((prev) => ({
      ...prev,
      paymentType: type,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (
      !formData.name ||
      !formData.phone ||
      !formData.formNumber ||
      !formData.moneyReceiptNumber ||
      !formData.amountPaid ||
      !formData.totalAgreedFee
    ) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          year: formData.year,
          formNumber: formData.formNumber,
          moneyReceiptNumber: formData.moneyReceiptNumber,
          amountPaid: parseFloat(formData.amountPaid),
          totalAgreedFee: parseFloat(formData.totalAgreedFee),
          paymentType: formData.paymentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to register student");
        return;
      }

      setSuccess(true);
      // Reset form
      setFormData({
        name: "",
        phone: "",
        year: "1st",
        formNumber: "",
        moneyReceiptNumber: "",
        amountPaid: "",
        totalAgreedFee: "13000",
        paymentType: "Partial",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while registering student"
      );
    } finally {
      setLoading(false);
    }
  };

  const showDiscountHint =
    formData.year === "2nd" && formData.paymentType === "Full";

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-8">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Student Admission
          </h1>
          <p className="text-slate-500 mt-2">
            Register a new student and collect admission fees
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-600">
                  ✓ Student registered successfully! Redirecting...
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Phone - 2 Column Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter student name"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+880 1234567890"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Year Selection - Segmented Button */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Academic Year
                </label>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(["1st", "2nd"] as const).map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearChange(year)}
                      className={`px-6 py-2 rounded-md font-medium transition-all text-sm ${
                        formData.year === year
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {year} Year
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Number and Receipt Number */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Form Number
                  </label>
                  <input
                    type="text"
                    name="formNumber"
                    value={formData.formNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., F12345"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Money Receipt Number
                  </label>
                  <input
                    type="text"
                    name="moneyReceiptNumber"
                    value={formData.moneyReceiptNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., R12345"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Payment Mode - Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Payment Mode
                </label>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(["Partial", "Full"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        handlePaymentTypeChange(
                          mode === "Partial" ? "Partial" : "Full"
                        )
                      }
                      className={`px-6 py-2 rounded-md font-medium transition-all text-sm ${
                        formData.paymentType === mode
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {mode} Payment
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Agreed Fee */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Agreed Fee (৳)
                </label>
                <input
                  type="number"
                  name="totalAgreedFee"
                  value={formData.totalAgreedFee}
                  onChange={handleInputChange}
                  placeholder="Enter total agreed fee"
                  step="100"
                  min="1000"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">Default: ৳13,000</p>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount Paid (৳)
                </label>
                <input
                  type="number"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  step="100"
                  min="0"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Discount Hint */}
              {showDiscountHint && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm font-medium text-emerald-700">
                    ✓ ৳3,000 Early Bird Discount Applied
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Total fee will be ৳10,000 for 2nd year with full payment
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Registering..." : "Register Student"}
                </button>
              </div>
            </form>
          </div>
      </div>
    </main>
  );
}
