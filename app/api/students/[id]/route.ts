import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Student from "@/models/Student";

// Admin password (should be in environment variables in production)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@zcc2024";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { newFee, adminPassword } = body;
    const params = await context.params;
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

    // Existing agreed/actual fee used to derive historical paid amount for legacy docs
    const existingTargetFee = Number(student.totalAgreedFee || student.totalFee || 0);

    // Compute current totalPaid robustly:
    // Prefer explicit totalPaid, otherwise derive from existingTargetFee - currentDue, otherwise fall back to sum(payments)
    const previousPaid = ((): number => {
      if (student.totalPaid != null && !Number.isNaN(Number(student.totalPaid))) {
        return Number(student.totalPaid);
      }
      if (student.currentDue != null && !Number.isNaN(Number(student.currentDue))) {
        return Math.max(existingTargetFee - Number(student.currentDue), 0);
      }
      if (Array.isArray(student.payments) && student.payments.length > 0) {
        return student.payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      }
      return 0;
    })();

    // For fee updates, targetFee is the newly requested fee
    const targetFee = Number(parsedFee || student.totalAgreedFee || student.totalFee || 0);
    const newTotalPaid = previousPaid;
    const newDue = Math.max(targetFee - newTotalPaid, 0);
    const newStatus = newDue <= 0 ? "PAID" : "DUE";

    // Use findByIdAndUpdate to avoid triggering full-document validators for legacy records
    const updated = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          totalAgreedFee: parsedFee,
          totalFee: parsedFee,
          currentDue: newDue,
          status: newStatus,
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Failed to update student fee" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Total agreed fee updated successfully",
        student: {
          id: updated._id,
          name: updated.name,
          totalAgreedFee: updated.totalAgreedFee,
          status: updated.status,
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
