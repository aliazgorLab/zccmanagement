import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/models/Student";
import Expense from "@/models/Expense";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Parse date from query parameter or default to today
    const dateParam = request.nextUrl.searchParams.get("date");
    let targetDate = new Date();

    if (dateParam) {
      // Parse date in YYYY-MM-DD format
      const [year, month, day] = dateParam.split("-").map(Number);
      targetDate = new Date(year, month - 1, day);
    }

    // Get date range for the selected day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const isSameDay = (dateValue: string | Date | undefined) => {
      if (!dateValue) return false;
      const date = new Date(dateValue);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === startOfDay.getTime();
    };

    // Fetch students created today OR students with at least one payment dated today
    const query = {
      $or: [
        { createdAt: { $gte: startOfDay, $lte: endOfDay } },
        { "payments.date": { $gte: startOfDay, $lte: endOfDay } },
      ],
    };

    const students = await Student.find(query).lean();

    // Fetch expenses for the selected day
    const expenses = await Expense.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).lean();

    const totalInflow = students.reduce((sum: number, student: any) => {
      const admissionToday = isSameDay(student.createdAt);
      const paymentEntries = Array.isArray(student.payments) ? student.payments : [];

      let paidToday = 0;

      if (admissionToday && paymentEntries.length > 0) {
        // For admissions, count the initial payment that came with the admission
        paidToday = Number(paymentEntries[0]?.amount || 0);
      } else {
        // For legacy/older students, count only today's due payment(s)
        paidToday = paymentEntries
          .filter((p: any) => isSameDay(p?.date))
          .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
      }

      return sum + paidToday;
    }, 0);
    const totalOutflow = expenses.reduce(
      (sum: number, expense: any) => sum + (expense.amount || 0),
      0
    );

    const studentData = students.map((student) => {
      const paymentEntries = Array.isArray(student.payments) ? student.payments : [];
      const admissionToday = isSameDay(student.createdAt);
      const totalPaid = paymentEntries.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      const totalAgreedFee = student.totalAgreedFee ?? student.totalFee ?? student.courseFee ?? 0;
      const currentDue = Number(student.currentDue ?? Math.max(totalAgreedFee - totalPaid, 0));

      let paidToday = 0;
      let receiptNumber = student.moneyReceiptNumber ?? "-";

      if (admissionToday) {
        const firstPayment = paymentEntries[0];
        paidToday = Number(firstPayment?.amount || 0);
        receiptNumber = firstPayment?.receiptNo ?? receiptNumber;
      } else {
        const todaysPayments = paymentEntries.filter((p: any) => isSameDay(p?.date));
        paidToday = todaysPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        receiptNumber = todaysPayments[0]?.receiptNo ?? receiptNumber;
      }

      const remainingDue = currentDue;
      
      return {
        _id: student._id?.toString(),
        studentId: student.studentId ?? "-",
        name: student.name,
        formNumber: student.formNumber,
        receiptNumber,
        totalFee: totalAgreedFee,
        totalAgreedFee: totalAgreedFee,
        paidToday: paidToday,
        remainingDue: remainingDue,
        amountPaid: totalPaid,
        status: student.status,
      };
    });

    const expenseData = expenses.map((expense) => ({
      _id: expense._id?.toString(),
      type: expense.type,
      category: expense.category,
      amount: expense.amount,
      note: expense.note || "",
      by: "Admin",
    }));

    return NextResponse.json(
      {
        students: studentData,
        totalInflow,
        totalOutflow,
        expenses: expenseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in summary API:", error);

    return NextResponse.json(
      {
        totalInflow: 0,
        totalOutflow: 0,
        students: [],
        expenses: [],
      },
      { status: 200 }
    );
  }
}
