"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AddPaymentModal from "../dashboard/AddPaymentModal";

interface Student {
  _id: string;
  name: string;
  formNumber: string;
  phone: string;
  year: "1st" | "2nd";
  totalAgreedFee: number;
  amountPaid: number;
  remainingDue: number;
  status: "PAID" | "DUE";
  payments?: Array<{ amount: number; date: string; receiptNo: string }>;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch("/api/students/list");
        const data = await response.json();

        if (response.ok) {
          setStudents(data.students || []);
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

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.formNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone.includes(searchTerm)
  );

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
            placeholder="Search by name, form number, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
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
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Year
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
                    <td colSpan={9} className="px-6 py-4 text-center text-slate-500">
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-slate-500">
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
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.year} Year
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">
                        ৳{student.totalAgreedFee.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-emerald-600">
                        ৳{student.amountPaid.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-right font-medium ${
                          student.remainingDue > 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        ৳{student.remainingDue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            student.status === "PAID"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.remainingDue > 0 && (
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
                ৳{filteredStudents.reduce((sum, s) => sum + s.amountPaid, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-600 mb-1">Total Pending</p>
              <p className="text-2xl font-semibold text-rose-600">
                ৳{filteredStudents.reduce((sum, s) => sum + s.remainingDue, 0).toLocaleString()}
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
    </main>
  );
}
