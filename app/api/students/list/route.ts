import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Student from "@/models/Student";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Fetch all students
    const students = await Student.find({}).sort({ createdAt: -1 }).lean();
    console.log("Sample Student from DB:", students[0]);

    const studentData = students.map((student) => {
      const totalPaid = Number(
        student.totalPaid ??
          student.amountPaid ??
          (student.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0) ??
          0
      );
      const totalAgreedFee = student.totalAgreedFee ?? student.totalFee ?? student.courseFee ?? 0;
      const currentDue = Number(
        student.currentDue ??
          student.remainingDue ??
          Math.max(totalAgreedFee - totalPaid, 0)
      );

      // Fall back to studentName for records imported via bulk script
      const resolvedName: string = (student.name || (student as any).studentName || "").trim();

      const status =
        totalPaid >= totalAgreedFee || currentDue <= 0
          ? "PAID"
          : student.status ?? "DUE";

      return {
        _id: student._id?.toString(),
        studentId: (student.studentId ?? "").toString(),
        name: resolvedName,
        phone: student.phone ?? "",
        remarks: student.remarks ?? "",
        year: student.year ?? "2nd",
        formNumber: (student.formNumber ?? student.studentId ?? "").toString(),
        totalAgreedFee: totalAgreedFee,
        totalPaid,
        currentDue,
        amountPaid: totalPaid,
        remainingDue: currentDue,
        status,
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
