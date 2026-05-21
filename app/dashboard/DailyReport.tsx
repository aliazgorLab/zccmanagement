"use client";

type SummaryStudent = {
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
};

type SummaryExpense = {
  _id: string;
  category: string;
  recipient: string;
  amount: number;
  type?: string;
  note?: string;
  by?: string;
};

type SummaryData = {
  totalInflow: number;
  totalOutflow: number;
  students: SummaryStudent[];
  expenses: SummaryExpense[];
};

type DailyReportProps = {
  data: SummaryData;
  reportDate?: string;
  loading?: boolean;
};

const DailyReport = ({ data, reportDate, loading }: DailyReportProps) => {
  const formattedDate = reportDate
    ? new Date(`${reportDate}T00:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString();

  return (
    <div className="bg-white p-6 max-w-[210mm] mx-auto print:p-0 print:max-w-none" id="printable-report">
      <div className="text-center border-b border-slate-300 pb-3 mb-4 print:pb-2 print:mb-3">
        <h1 className="text-xl font-bold text-slate-900 print:text-lg">Zahids Chem Clinic</h1>
        <p className="text-base font-medium text-slate-700 print:text-sm">
          <span className="bangla-font">জাহিদ স্যার (রসায়ন)</span>
        </p>
        <p className="text-xs text-slate-500 print:text-[10px]">
          <span className="bangla-font">৪র্থ তলা, গুলজার টাওয়ার, চকবাজার, চট্টগ্রাম</span>
        </p>
        <div className="text-[10px] text-slate-400 mt-1">
          Help Line: +8801841783983 | Email: info@zahidschemclinic.com
        </div>
      </div>

      <div className="mb-4 flex justify-between items-end text-xs print:text-[10px]">
        <div>
          <p className="font-semibold text-slate-800">
            Date: <span className="font-normal" suppressHydrationWarning>{formattedDate}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-mono">Serial: 576123456789</p>
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 mb-2 print:mb-2">
          Student Admission Statement
        </h3>
        <table className="w-full table-fixed text-left text-[10px] border-collapse border border-slate-300 print:border-slate-300">
          <colgroup>
            <col className="w-[4%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[28%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-300">
              <th className="py-2 px-3 border border-slate-300">SL</th>
              <th className="py-2 px-3 border border-slate-300">Form No</th>
              <th className="py-2 px-3 border border-slate-300">Receipt No</th>
              <th className="py-2 px-3 border border-slate-300">Student Name</th>
              <th className="py-2 px-3 border border-slate-300 text-right">Total Fee</th>
              <th className="py-2 px-3 border border-slate-300 text-right">Paid Today</th>
              <th className="py-2 px-3 border border-slate-300 text-right">Remaining Due</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-4 px-3 border border-slate-300 text-center" colSpan={7}>
                  Loading report...
                </td>
              </tr>
            ) : (
              data.students.map((student, index) => (
                <tr key={student._id} className="border-b border-slate-300">
                  <td className="py-2 px-3 border border-slate-300 text-center align-top">{index + 1}</td>
                  <td className="py-2 px-3 border border-slate-300 align-top">{student.formNumber}</td>
                  <td className="py-2 px-3 border border-slate-300 align-top">{student.receiptNumber ?? "-"}</td>
                  <td className="py-2 px-3 border border-slate-300 align-top">
                    <span className="block font-medium">{student.name}</span>
                    <span className="block text-[9px] font-mono text-slate-400 mt-0.5">
                      ID: {student.studentId ?? "-"}
                    </span>
                  </td>
                  <td className="py-2 px-3 border border-slate-300 text-right align-top whitespace-nowrap">
                    ৳{Number(student.totalFee || 0).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 border border-slate-300 text-right align-top whitespace-nowrap">
                    ৳{Number(student.paidToday || 0).toLocaleString()}
                  </td>
                  <td
                    className={`py-2 px-3 border border-slate-300 text-right align-top whitespace-nowrap font-bold ${
                      Number(student.remainingDue || 0) > 0 ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    ৳{Number(student.remainingDue || 0).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-slate-50">
              <td colSpan={4} className="py-2 px-3 border border-slate-300 text-right">
                Total Collection
              </td>
              <td colSpan={3} className="py-2 px-3 border border-slate-300 text-right">
                ৳{Number(data.totalInflow || 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 mb-2">
          Daily Expense Statement
        </h3>
        <table className="w-full text-left text-[10px] border-collapse border border-slate-300 print:border-slate-300">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-2 px-2 border border-slate-300">SL</th>
              <th className="py-2 px-2 border border-slate-300">Expense Name</th>
              <th className="py-2 px-2 border border-slate-300">Sub Expense</th>
              <th className="py-2 px-2 border border-slate-300">Expense By</th>
              <th className="py-2 px-2 border border-slate-300">Note</th>
              <th className="py-2 px-2 border border-slate-300 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-4 px-2 border border-slate-300 text-center" colSpan={6}>
                  Loading report...
                </td>
              </tr>
            ) : (
              data.expenses.map((exp, index) => (
                <tr key={exp._id} className="border-b border-slate-300">
                  <td className="py-2 px-2 border border-slate-300 text-center">{index + 1}</td>
                  <td className="py-2 px-2 border border-slate-300">{exp.type ?? "-"}</td>
                  <td className="py-2 px-2 border border-slate-300">{exp.category ?? "-"}</td>
                  <td className="py-2 px-2 border border-slate-300 text-slate-600">{exp.by ?? "Admin"}</td>
                  <td className="py-2 px-2 border border-slate-300 italic text-[10px] bangla-font">{exp.note || "-"}</td>
                  <td className="py-2 px-2 border border-slate-300 text-right">
                    ৳{Number(exp.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-slate-50 text-sm">
              <td colSpan={5} className="py-2 px-2 border border-slate-300 text-right">
                Total Expense
              </td>
              <td className="py-2 px-2 border border-slate-300 text-right">
                ৳{Number(data.totalOutflow || 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 border-2 border-slate-900 p-3 rounded-lg w-80 ml-auto bg-slate-50 print:mt-4">
        <h4 className="text-center font-bold border-b border-slate-300 pb-2 mb-2 uppercase text-[10px]">
          Financial Summary
        </h4>
        <div className="flex justify-between text-sm py-1 print:text-xs">
          <span>Total Inflow:</span>
          <span>৳{Number(data.totalInflow || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-slate-300 print:text-xs">
          <span>Total Outflow:</span>
          <span className="text-rose-600">- ৳{Number(data.totalOutflow || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-2 print:text-sm">
          <span>Net Cash:</span>
          <span className="text-indigo-700">
            ৳{Number((data.totalInflow || 0) - (data.totalOutflow || 0)).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="report-footer mt-20 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-300 pt-2">
        <p>Powered By: ZCC TECH TEAM</p>
        <p>4th floor, Gulzar Tower, Chawkbazar, Chattogram</p>
        <p>Page 1</p>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm;
          }

          body * {
            visibility: hidden;
          }

          body {
            margin: 0;
            padding: 0;
          }

          #printable-report,
          #printable-report * {
            visibility: visible;
          }

          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding-bottom: 56px;
            box-sizing: border-box;
          }

          .report-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            margin-top: 0;
            padding: 8px 12mm 0;
            border-top: 1px solid #cbd5e1;
            background-color: #ffffff;
            color: #94a3b8;
            font-size: 10px;
            line-height: 1.2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 10;
          }

          nav,
          aside,
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyReport;