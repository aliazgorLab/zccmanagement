import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Student from "@/models/Student";

// Admin password (should be in environment variables in production)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@zcc2024";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { newFee, adminPassword } = body;
    const studentId = params.id;

    // Validate inputs
    if (!studentId || !newFee || !adminPassword) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, newFee, adminPassword" },
        { status: 400 }
      );
    }

    // Verify admin password
    if (adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid admin password" },
        { status: 403 }
      );
    }

    const parsedFee = Number(newFee);
    if (Number.isNaN(parsedFee) || parsedFee <= 0) {
      return NextResponse.json(
        { error: "New fee must be a valid positive number" },
        { status: 400 }
      );
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if fee is locked (already admitted)
    if (student.feeLockedAt) {
      return NextResponse.json(
        {
          error: "Fee is locked and cannot be changed after admission without admin unlock",
          feeLockedAt: student.feeLockedAt,
        },
        { status: 403 }
      );
    }

    // Update the fee
    student.totalAgreedFee = parsedFee;
    student.totalFee = parsedFee;
    
    // Calculate new status
    const totalPaid = (student.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const remainingDue = Math.max(parsedFee - totalPaid, 0);
    student.status = remainingDue <= 0 ? "PAID" : "DUE";

    await student.save();

    return NextResponse.json(
      {
        success: true,
        message: "Total agreed fee updated successfully",
        student: {
          id: student._id,
          name: student.name,
          totalAgreedFee: student.totalAgreedFee,
          status: student.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating student fee:", error);

    return NextResponse.json(
      {
        error: "Failed to update student fee",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
