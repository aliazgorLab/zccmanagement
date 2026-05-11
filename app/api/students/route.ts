import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Student from "@/models/Student";
import { sendPaymentSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    try {
      await connectToDatabase();
    } catch (error) {
      console.error("FULL ERROR:", error);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: error instanceof Error ? error.message : "Unknown database error",
        },
        { status: 500 }
      );
    }

    // Get request body
    const body = await request.json();
    const {
      studentId,
      name,
      phone,
      remarks,
      year,
      formNumber,
      moneyReceiptNumber,
      amountPaid,
      paymentType,
      totalAgreedFee: totalAgreedFeeInput,
    } = body;
    const parsedAmountPaid = Number(amountPaid);
    const parsedTotalAgreedFee = Number(totalAgreedFeeInput);

    // Validate required fields
    if (!studentId || !name || !year || !formNumber || !moneyReceiptNumber || amountPaid === undefined || !paymentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["1st", "2nd"].includes(year)) {
      return NextResponse.json(
        { error: "Invalid year value" },
        { status: 400 }
      );
    }

    if (!["Full", "Partial"].includes(paymentType)) {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      );
    }

    if (Number.isNaN(parsedAmountPaid) || parsedAmountPaid < 0) {
      return NextResponse.json(
        { error: "amountPaid must be a valid non-negative number" },
        { status: 400 }
      );
    }

    // Check if studentId already exists
    const existingById = await Student.findOne({ studentId });
    if (existingById) {
      return NextResponse.json(
        { error: "A student with this Student ID already exists" },
        { status: 409 }
      );
    }

    // Check if form number already exists
    const existingStudent = await Student.findOne({ formNumber });
    if (existingStudent) {
      return NextResponse.json(
        { error: "Student with this Form Number already exists" },
        { status: 409 }
      );
    }

    // Initialize variables
    let discount = 0;
    const totalAgreedFee =
      Number.isFinite(parsedTotalAgreedFee) && parsedTotalAgreedFee > 0
        ? parsedTotalAgreedFee
        : year === "2nd" && paymentType === "Full"
          ? 10000
          : 13000;

    // Calculate totalFee based on discount
    let totalFee = totalAgreedFee;
    if (year === "2nd" && paymentType === "Full") {
      discount = Math.max(13000 - totalAgreedFee, 0);
      totalFee = totalAgreedFee;
    } else {
      totalFee = totalAgreedFee;
    }

    const totalPaid = Number(parsedAmountPaid);

    // Create payment entry with today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const payments = [
      {
        amount: parsedAmountPaid,
        date: today,
        receiptNo: String(moneyReceiptNumber).trim(),
      },
    ];

    const remainingDue = Math.max(totalFee - totalPaid, 0);
    const status = remainingDue <= 0 ? "PAID" : "DUE";

    let savedStudent;
    try {
      // Create new student document
      const newStudent = new Student({
        studentId: String(studentId).trim(),
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : undefined,
        remarks: String(remarks ?? "").trim(),
        year,
        formNumber: String(formNumber).trim(),
        moneyReceiptNumber: String(moneyReceiptNumber).trim(),
        totalAgreedFee,
        totalFee,
        courseFee: 13000,
        totalPaid,
        payments,
        discount,
        paymentType,
        status,
        feeLockedAt: new Date(),
      });

      // Save to database
      savedStudent = await newStudent.save();

      try {
        await sendPaymentSMS(
          phone ? String(phone).trim() : "", // Safely handle missing phone
          String(name).trim(),
          parsedAmountPaid,
          remainingDue,
          String(studentId).trim()
        );
      } catch (smsError) {
        console.error("SMS sending failed, but continuing response:", smsError);
      }
    } catch (error) {
      console.error("FULL ERROR:", error);
      return NextResponse.json(
        {
          error: "Student save failed",
          details: error instanceof Error ? error.message : "Unknown save error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Student admission record created successfully",
        student: {
          id: savedStudent._id,
          studentId: savedStudent.studentId,
          name: savedStudent.name,
          phone: savedStudent.phone,
          remarks: savedStudent.remarks,
          year: savedStudent.year,
          formNumber: savedStudent.formNumber,
          moneyReceiptNumber: savedStudent.moneyReceiptNumber,
          totalAgreedFee: savedStudent.totalAgreedFee,
          totalFee: savedStudent.totalFee,
          courseFee: savedStudent.courseFee,
          totalPaid: savedStudent.totalPaid,
          payments: savedStudent.payments,
          discount: savedStudent.discount,
          paymentType: savedStudent.paymentType,
          status: savedStudent.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create student admission record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    try {
      await connectToDatabase();
    } catch (error) {
      console.error("FULL ERROR:", error);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: error instanceof Error ? error.message : "Unknown database error",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { studentId, amount, receiptNo, adminPassword } = body;

    // Validate required fields
    if (!studentId || !amount || !receiptNo) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, amount, receiptNo" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a valid positive number" },
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

    // Ensure payments array exists for legacy records
    if (!Array.isArray(student.payments)) {
      student.payments = [] as any;
    }

    // Today's date normalized
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use agreed/actual fee as the single source of truth for due math
    const targetFee = Number(student.totalAgreedFee || student.totalFee || 0);

    // Determine previous paid amount robustly:
    // Prefer explicit totalPaid, otherwise derive from targetFee - currentDue when available, else 0
    const previousPaid = ((): number => {
      if (student.totalPaid != null && !Number.isNaN(Number(student.totalPaid))) {
        return Number(student.totalPaid);
      }
      if (student.currentDue != null && !Number.isNaN(Number(student.currentDue))) {
        return Math.max(targetFee - Number(student.currentDue), 0);
      }
      // Fallback to sum of payments if present
      if (Array.isArray(student.payments) && student.payments.length > 0) {
        return student.payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      }
      return 0;
    })();

    const newTotalPaid = previousPaid + parsedAmount;
    const newDue = Math.max(targetFee - newTotalPaid, 0);
    const newStatus = newDue <= 0 ? "PAID" : "DUE";

    // Use atomic update to avoid triggering full-document validators on legacy records
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        $push: {
          payments: {
            amount: parsedAmount,
            date: today,
            receiptNo: String(receiptNo).trim(),
          },
        },
        $set: {
          totalPaid: newTotalPaid,
          currentDue: newDue,
          status: newStatus,
        },
      },
      { new: true }
    );

    if (!updatedStudent) {
      return NextResponse.json({ error: "Failed to update student record" }, { status: 500 });
    }

    try {
      await sendPaymentSMS(
        updatedStudent.phone ? String(updatedStudent.phone).trim() : "", // Safely handle missing phone
        String(updatedStudent.name).trim(),
        parsedAmount,
        newDue,
        updatedStudent.studentId ? String(updatedStudent.studentId).trim() : ""
      );
    } catch (smsError) {
      console.error("SMS sending failed, but continuing response:", smsError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment added successfully",
        student: {
          id: updatedStudent._id,
          name: updatedStudent.name,
          totalAgreedFee: updatedStudent.totalAgreedFee,
          totalPaid: updatedStudent.totalPaid ?? newTotalPaid,
          payments: updatedStudent.payments || [],
          status: updatedStudent.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to add payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
