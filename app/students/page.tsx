"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import AddPaymentModal from "../dashboard/AddPaymentModal";

interface Student {
  _id: string;
  studentId: string;
  name: string;
  formNumber: string;
  phone?: string;
  remarks?: string;
  year: "1st" | "2nd";
  totalAgreedFee: number;
  totalPaid: number;
  currentDue: number;
  amountPaid: number;
  remainingDue: number;
  status: "PAID" | "DUE";
  payments?: Array<{
    amount: number;
    date: string | Date;
    receiptNo: string;
    remarks?: string;
  }>;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "DUE">("ALL");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatPaymentDate = (dateValue: string | Date) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch("/api/students/list");
        const data = await response.json();

        if (response.ok) {
          const normalizedStudents: Student[] = (data.students || []).map(
            (student: Student & {
              totalPaid?: number;
              currentDue?: number;
            }) => {
              const totalPaid = Number(student.totalPaid ?? student.amountPaid ?? 0);
              const currentDue = Number(
                student.currentDue ??
                  student.remainingDue ??
                  Math.max((student.totalAgreedFee ?? 0) - totalPaid, 0)
              );

              return {
                ...student,
                totalPaid,
                currentDue,
                amountPaid: totalPaid,
                remainingDue: currentDue,
                status: totalPaid >= student.totalAgreedFee ? "PAID" : student.status,
                remarks: student.remarks ?? "",
              };
            }
          );

          setStudents(normalizedStudents);
          setError(null);
        } else {
          setError(data.error || "Failed to fetch students");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An error occurred while fetching students"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handlePaymentAdded = () => {
    // Refresh the student list
    window.location.reload();
  };

  const q = searchTerm.toLowerCase();
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      (student.name ?? "").toLowerCase().includes(q) ||
      (student.formNumber ?? "").toLowerCase().includes(q) ||
      (student.studentId ?? "").toLowerCase().includes(q) ||
      (student.phone ?? "").includes(searchTerm);

    const resolvedStatus =
      student.status === "PAID" || student.currentDue === 0 ? "PAID" : "DUE";

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PAID" && resolvedStatus === "PAID") ||
      (statusFilter === "DUE" && resolvedStatus === "DUE");

    return matchesSearch && matchesStatus;
  });

  const totalCount = students.length;
  const paidCount = students.filter(
    (s) => s.status === "PAID" || s.currentDue === 0
  ).length;
  const dueCount = students.filter(
    (s) => s.status === "DUE" || s.currentDue > 0
  ).length;

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-8">
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Student Management
          </h1>
          <p className="text-slate-500 mt-2">
            View all students and collect additional payments
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, student ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="inline-flex flex-wrap gap-2 rounded-full bg-slate-100 p-1">
            {[
              { key: "ALL", label: `All Students (${totalCount})` },
              { key: "PAID", label: `Fully Paid (${paidCount})` },
              { key: "DUE", label: `Payment Due (${dueCount})` },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setStatusFilter(option.key as "ALL" | "PAID" | "DUE")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === option.key
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Form No
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                    Total Fee
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                    Due
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                      <td colSpan={10} className="px-6 py-4 text-center text-slate-500">
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center text-slate-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr
                      key={student._id}
                      className={`border-b border-slate-200 hover:bg-slate-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.formNumber}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.year} Year
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                        {student.remarks ? (
                          <span className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 truncate">
                            {student.remarks}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">
                        ৳{student.totalAgreedFee.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-emerald-600">
                        ৳{student.totalPaid.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-right font-medium ${
                          student.currentDue > 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        ৳{student.currentDue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(() => {
                          const status =
                            student.totalPaid >= student.totalAgreedFee
                              ? "PAID"
                              : student.status;

                          return (
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                              status === "PAID"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                            {status}
                          </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {student.currentDue > 0 && (
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Plus size={16} />
                              Add Payment
                            </button>
                          )}
                          <button
                            onClick={() => setViewStudent(student)}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-all"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        {!loading && filteredStudents.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-600 mb-1">Total Students</p>
              <p className="text-2xl font-semibold text-slate-900">
                {filteredStudents.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-600 mb-1">Total Collection</p>
              <p className="text-2xl font-semibold text-emerald-600">
                ৳{filteredStudents.reduce((sum, s) => sum + s.totalPaid, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-600 mb-1">Total Pending</p>
              <p className="text-2xl font-semibold text-rose-600">
                ৳{filteredStudents.reduce((sum, s) => sum + s.currentDue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onPaymentAdded={handlePaymentAdded}
      />

      {viewStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setViewStudent(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Student Details
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {viewStudent.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  ID: {viewStudent.studentId} · Phone: {viewStudent.phone || "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewStudent(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close student details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total Fee</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    ৳{viewStudent.totalAgreedFee.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Total Paid</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-700">
                    ৳{viewStudent.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-rose-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Current Due</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-700">
                    ৳{viewStudent.currentDue.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                      Payment History
                    </h3>
                    <p className="text-sm text-slate-500">
                      Dates, receipts, and recorded notes for this student.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount Paid</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Receipt Number</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {(viewStudent.payments && viewStudent.payments.length > 0) ? (
                        viewStudent.payments.map((payment, index) => (
                          <tr key={`${payment.receiptNo}-${index}`} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-700">
                              {formatPaymentDate(payment.date)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600">
                              ৳{Number(payment.amount || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600">
                              {payment.receiptNo || "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {payment.remarks || viewStudent.remarks || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                            No payment history available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
