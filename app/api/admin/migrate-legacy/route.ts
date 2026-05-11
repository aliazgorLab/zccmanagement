import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Student from "@/models/Student";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Fetch minimal fields for all students
    const students = await Student.find({}, { totalPaid: 1, totalFee: 1, totalAgreedFee: 1, currentDue: 1, payments: 1, remarks: 1 }).lean();

    const bulkOps: any[] = [];

    for (const s of students) {
      const updates: any = {};

      // If totalPaid is missing or null/undefined, derive from totalFee - currentDue when possible
      if (s.totalPaid == null) {
        if (s.totalFee != null && s.currentDue != null) {
          updates.totalPaid = Number(s.totalFee) - Number(s.currentDue);
        } else if (s.totalAgreedFee != null && s.currentDue != null) {
          updates.totalPaid = Number(s.totalAgreedFee) - Number(s.currentDue);
        }
        // If neither available, we leave totalPaid undefined (don't set to 0 by default unless explicit)
      }

      // Ensure payments array exists
      if (!Array.isArray(s.payments)) {
        updates.payments = [];
      }

      // Ensure remarks exists
      if (s.remarks == null) {
        updates.remarks = "";
      }

      // If there are updates, push an updateOne operation
      if (Object.keys(updates).length > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: s._id },
            update: { $set: updates },
          },
        });
      }
    }

    if (bulkOps.length === 0) {
      return NextResponse.json({ success: true, message: "No legacy students needed migration", total: students.length, migrated: 0 }, { status: 200 });
    }

    const result = await Student.bulkWrite(bulkOps, { ordered: false });
    // bulkWrite result has modifiedCount in modern drivers
    const migratedDocumentsCount = result ? (result.modifiedCount || 0) : 0;

    return NextResponse.json({ success: true, message: "Legacy migration completed", total: students.length, migrated: migratedDocumentsCount, details: result }, { status: 200 });
  } catch (error) {
    console.error("[migrate-legacy] Error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
