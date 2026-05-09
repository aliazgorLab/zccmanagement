/**
 * TEMPORARY ADMIN ROUTE — DELETE THIS FILE AFTER USE.
 *
 * DELETE /api/admin/clear-students
 *
 * Deletes every document in the `students` collection and resets any
 * auto-increment counter that may exist for that collection.
 * The `expenses` collection is never touched.
 *
 * Body (JSON):
 *   { "adminPassword": "<value of ADMIN_PASSWORD env var>" }
 */

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Student from "@/models/Student";
import mongoose from "mongoose";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@zcc2024";

export async function DELETE(request: NextRequest) {
  try {
    // ── 1. Authenticate ──────────────────────────────────────────────────────
    // Check ADMIN_KEY header first (for authorized services)
    const adminKeyHeader = request.headers.get("X-ADMIN-KEY");
    const adminKeyEnv = process.env.ADMIN_KEY;
    
    let isAuthenticated = false;
    
    // Method 1: Check header-based ADMIN_KEY
    if (adminKeyHeader && adminKeyEnv && adminKeyHeader === adminKeyEnv) {
      isAuthenticated = true;
    }
    
    // Method 2: Check body password (fallback)
    if (!isAuthenticated) {
      const body = await request.json();
      const { adminPassword } = body ?? {};
      if (adminPassword && adminPassword === ADMIN_PASSWORD) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized — invalid admin credentials." },
        { status: 403 }
      );
    }

    // ── 2. Connect ───────────────────────────────────────────────────────────
    await connectToDatabase();

    // ── 3. Delete ONLY the students collection ───────────────────────────────
    const result = await Student.deleteMany({});

    // ── 4. Reset auto-increment counters (if any) ────────────────────────────
    // mongoose-sequence stores counters in a `counters` collection with an `_id`
    // matching "<collection_name>_<field>".  We reset the serial number for
    // "students" if that document exists.  This is a no-op if your project
    // does not use mongoose-sequence.
    let counterReset = false;
    try {
      const db = mongoose.connection.db;
      if (db) {
        const countersCollection = db.collection("counters");
        const updateResult = await countersCollection.updateOne(
          { _id: "students_serialNumber" as any },
          { $set: { seq: 0 } }
        );
        // seq is set to 0 so the NEXT inserted document gets seq 1.
        counterReset = updateResult.matchedCount > 0;
      }
    } catch {
      // Counter collection may not exist — that is fine.
      counterReset = false;
    }

    // ── 5. Respond ───────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: `All student records have been deleted. Expenses collection was NOT affected.`,
      deletedCount: result.deletedCount,
      counterReset,
      note: counterReset
        ? "Auto-increment counter reset to 0 (next student will get SL 1)."
        : "No counter document found — serial numbers are display-only (no reset needed).",
      reminder:
        "⚠️  Delete app/api/admin/clear-students/route.ts immediately after use.",
    });
  } catch (error) {
    console.error("[clear-students] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to clear students collection.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
