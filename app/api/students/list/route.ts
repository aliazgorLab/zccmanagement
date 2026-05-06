import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Student from "@/models/Student";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Fetch all students
    const students = await Student.find({}).sort({ createdAt: -1 }).lean();

    const studentData = students.map((student) => {
      const totalPaid = (student.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalAgreedFee = student.totalAgreedFee ?? student.totalFee ?? student.courseFee ?? 0;
      const remainingDue = Math.max(totalAgreedFee - totalPaid, 0);

      return {
        _id: student._id?.toString(),
        name: student.name,
        phone: student.phone,
        year: student.year,
        formNumber: student.formNumber,
        totalAgreedFee: totalAgreedFee,
        amountPaid: totalPaid,
        remainingDue: remainingDue,
        status: student.status,
        payments: student.payments || [],
      };
    });

    return NextResponse.json(
      {
        success: true,
        students: studentData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching students:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch students",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
