import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Student from "@/models/Student";

/**
 * GET /api/students/lookup?studentId=ZCC-2024-001
 *
 * Returns the minimal student record needed for fee collection:
 *   _id, studentId, name, formNumber, totalAgreedFee, totalPaid, remainingDue
 *
 * Returns 404 when no matching student is found.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId")?.trim();

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId query parameter is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const student = await Student.findOne({ studentId }).lean();

    if (!student) {
      return NextResponse.json(
        { error: "No student found with this Student ID" },
        { status: 404 }
      );
    }

    const totalPaid = Number(
      student.totalPaid ??
        (student.payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0) ??
        0
    );
    const totalAgreedFee =
      student.totalAgreedFee ?? student.totalFee ?? student.courseFee ?? 0;
    const currentDue = Number(
      student.currentDue ?? Math.max(totalAgreedFee - totalPaid, 0)
    );
    const status = totalPaid >= totalAgreedFee || currentDue <= 0 ? "PAID" : student.status;

    return NextResponse.json({
      success: true,
      student: {
        _id: student._id?.toString(),
        studentId: student.studentId,
        name: student.name,
        formNumber: student.formNumber,
        totalAgreedFee,
        totalPaid,
        currentDue,
        amountPaid: totalPaid,
        remainingDue: currentDue,
        status,
      },
    });
  } catch (error) {
    console.error("[lookup] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to look up student",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
