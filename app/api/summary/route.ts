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

    // Fetch students for the selected day
    const students = await Student.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).lean();

    // Fetch expenses for the selected day
    const expenses = await Expense.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).lean();

    const totalInflow = students.reduce((sum, student) => {
      const paidToday = (student.payments || [])
        .filter((p: any) => {
          const paymentDate = new Date(p.date);
          paymentDate.setHours(0, 0, 0, 0);
          return paymentDate.getTime() === startOfDay.getTime();
        })
        .reduce((s, p) => s + (p.amount || 0), 0);
      return sum + paidToday;
    }, 0);
    const totalOutflow = expenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );

    const studentData = students.map((student) => {
      const totalPaid = (student.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const paidToday = (student.payments || [])
        .filter((p: any) => {
          const paymentDate = new Date(p.date);
          paymentDate.setHours(0, 0, 0, 0);
          return paymentDate.getTime() === startOfDay.getTime();
        })
        .reduce((s, p) => s + (p.amount || 0), 0);
      const totalAgreedFee = student.totalAgreedFee ?? student.totalFee ?? student.courseFee ?? 0;
      const remainingDue = Math.max(totalAgreedFee - totalPaid, 0);
      
      return {
        _id: student._id?.toString(),
        name: student.name,
        formNumber: student.formNumber,
        receiptNumber: student.moneyReceiptNumber ?? "-",
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
      category: expense.type,
      recipient: expense.category,
      amount: expense.amount,
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
