"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ReceiptPDF } from "@/components/ReceiptPDF";

interface ExistingStudent {
  _id: string;
  studentId: string;
  name: string;
  phone?: string;
  year?: "1st" | "2nd";
  totalPaid: number;
  totalAgreedFee: number;
}

export default function AdmissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Lookup state
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [existingStudent, setExistingStudent] = useState<ExistingStudent | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    studentId: "",
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

    // Trigger lookup when studentId changes
    if (name === "studentId") {
      triggerLookup(value);
      // If studentId is cleared, clear auto-filled fields
      if (!value.trim()) {
        setFormData((prev) => ({
          ...prev,
          name: "",
          phone: "",
          year: "1st",
        }));
      }
    }
  };

  const triggerLookup = (studentIdValue: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = studentIdValue.trim();
    if (!trimmed) {
      setExistingStudent(null);
      setLookupError(null);
      return;
    }

    setLookupLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students/lookup?studentId=${encodeURIComponent(trimmed)}`);
        const data = await res.json();

        if (!res.ok) {
          setLookupError(null);
          setExistingStudent(null);
        } else {
          setExistingStudent(data.student);
          setLookupError(null);
        }
      } catch {
        setLookupError("Network error checking for existing student");
        setExistingStudent(null);
      } finally {
        setLookupLoading(false);
      }
    }, 600);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Auto-fill form when existing student is found
  useEffect(() => {
    if (existingStudent) {

      setFormData((prev) => ({
        ...prev,
        name: String(existingStudent.name || ""),
        phone: String(existingStudent.phone || ""),
        year: existingStudent.year || "1st",
        totalAgreedFee: String(existingStudent.totalAgreedFee || "13000"),
        formNumber: String(existingStudent.studentId || ""),
      }));
    }
  }, [existingStudent]);
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
      !formData.studentId ||
      !formData.name ||
      !formData.formNumber ||
      !formData.moneyReceiptNumber ||
      !formData.amountPaid ||
      !formData.totalAgreedFee
    ) {
      setError("Please fill in all required fields (Student ID, Name, Form No, Receipt No, Amount)");
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
          studentId: formData.studentId,
          name: formData.name,
          phone: formData.phone || undefined,
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
      // Capture the exact submitted data for the PDF receipt before resetting the form
      setSubmittedData({
        ...formData,
        existingPaidAmount: existingStudent?.totalPaid || 0,
        date: new Date().toLocaleDateString("en-GB")
      });

      // Reset form
      setFormData({
        studentId: "",
        name: "",
        phone: "",
        year: "1st",
        formNumber: "",
        moneyReceiptNumber: "",
        amountPaid: "",
        totalAgreedFee: "13000",
        paymentType: "Partial",
      });

      // Note: Removed the auto-redirect so the user has time to download the receipt.
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

            {success && submittedData && (
              <div className="mb-6 p-6 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    ✓ Student registered successfully!
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">
                    You can now download the payment receipt.
                  </p>
                </div>
                
                <PDFDownloadLink
                  document={
                    <ReceiptPDF
                      receiptNumber={submittedData.moneyReceiptNumber || "N/A"}
                      studentId={submittedData.studentId}
                      name={submittedData.name}
                      amountPaid={parseFloat(submittedData.amountPaid) || 0}
                      totalAgreedFee={parseFloat(submittedData.totalAgreedFee) || 13000}
                      date={submittedData.date}
                      existingPaidAmount={submittedData.existingPaidAmount}
                    />
                  }
                  fileName={`Receipt_${submittedData.studentId}_${submittedData.moneyReceiptNumber || "N/A"}.pdf`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all whitespace-nowrap shadow-sm"
                >
                  {({ loading }) => (loading ? "Generating PDF..." : "Download Receipt")}
                </PDFDownloadLink>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Student ID - 2 Column Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    placeholder="Enter student name"
                    readOnly={existingStudent !== null}
                    className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                      existingStudent ? "bg-slate-50 text-slate-600 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Student ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId || ""}
                      onChange={handleInputChange}
                      placeholder="e.g., ZCC-2024-001"
                      className="w-full px-4 py-3 pr-10 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    {/* Lookup status icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {lookupLoading && (
                        <Loader2 size={18} className="text-indigo-500 animate-spin" />
                      )}
                      {!lookupLoading && existingStudent && (
                        <CheckCircle2 size={18} className="text-amber-500" />
                      )}
                    </div>
                  </div>

                  {/* Existing student warning */}
                  {existingStudent && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        ⚠️ Student Already Registered
                      </p>
                      <p className="text-xs text-amber-800">
                        <span className="font-medium">{existingStudent.name}</span> (Year: {existingStudent.year || "1st"})
                        {existingStudent.phone && ` • Phone: ${existingStudent.phone}`}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Paid: ৳{existingStudent.totalPaid.toLocaleString()} / ৳{existingStudent.totalAgreedFee.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Phone Number - Optional */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number <span className="text-slate-400 font-normal">(optional — for SMS)</span>
                </label>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                      placeholder="+880 1234567890"
                      readOnly={existingStudent !== null}
                      className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                        existingStudent ? "bg-slate-50 text-slate-600 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  {/* Display remaining due when student exists */}
                  {existingStudent && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-center whitespace-nowrap">
                      <p className="text-xs font-medium text-indigo-600 mb-1">Remaining Due</p>
                      <p className="text-lg font-bold text-indigo-900">
                        ৳{Math.max(existingStudent.totalAgreedFee - existingStudent.totalPaid, 0).toLocaleString()}
                      </p>
                    </div>
                  )}
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
                      disabled={existingStudent !== null} // Disable year selection
                      className={`px-6 py-2 rounded-md font-medium transition-all text-sm ${
                        formData.year === year
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      } ${
                        existingStudent ? "opacity-50 cursor-not-allowed" : ""
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
                    value={formData.formNumber || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., F12345"
                    readOnly={existingStudent !== null} // Make formNumber readOnly
                    className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                      existingStudent ? "bg-slate-50 text-slate-600 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Money Receipt Number
                  </label>
                  <input
                    type="text"
                    name="moneyReceiptNumber"
                    value={formData.moneyReceiptNumber || ""}
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
                  value={formData.totalAgreedFee || ""}
                  onChange={handleInputChange}
                  onKeyDown={(e) => { if (e.key === '.' || e.key === '-') e.preventDefault(); }}
                  placeholder="Enter total agreed fee"
                  step="1"
                  min="0"
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
                  value={formData.amountPaid || ""}
                  onChange={handleInputChange}
                  onKeyDown={(e) => { if (e.key === '.' || e.key === '-') e.preventDefault(); }}
                  placeholder="Enter amount"
                  step="1"
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
