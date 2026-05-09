import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";

const ALLOWED_TYPES = ["Breakfast", "Lunch", "Evening", "Office"] as const;
const ALLOWED_CATEGORIES = ["Staff", "Teacher", "Guest", "Others"] as const;

type ExpenseType = (typeof ALLOWED_TYPES)[number];
type ExpenseCategory = (typeof ALLOWED_CATEGORIES)[number];

export async function POST(request: NextRequest) {
  try {
    try {
      await connectDB();
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
    const { type, category, amount, note } = body as {
      type?: string;
      category?: string;
      amount?: number | string;
      note?: string;
    };
    const parsedAmount = Number(amount);

    if (!type || !category || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(type as ExpenseType)) {
      return NextResponse.json(
        { error: "Invalid expense type" },
        { status: 400 }
      );
    }

    if (!ALLOWED_CATEGORIES.includes(category as ExpenseCategory)) {
      return NextResponse.json(
        { error: "Invalid expense category" },
        { status: 400 }
      );
    }

    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: "Amount must be a valid non-negative number" },
        { status: 400 }
      );
    }

    let savedExpense;
    try {
      const newExpense = new Expense({
        type,
        category,
        amount: Number(parsedAmount),
        note: typeof note === "string" ? note.trim() : "",
        date: new Date(),
      });

      console.log("Creating expense with:", { type, category, amount: parsedAmount, note });
      savedExpense = await newExpense.save();
      console.log("Expense saved successfully:", savedExpense);
    } catch (error) {
      console.error("FULL ERROR:", error);
      if (error instanceof Error) {
        console.error("Validation Error:", error.message);
      }
      return NextResponse.json(
        {
          error: "Expense save failed",
          details: error instanceof Error ? error.message : "Unknown save error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Expense recorded successfully",
        expense: {
          id: savedExpense._id,
          type: savedExpense.type,
          category: savedExpense.category,
          amount: savedExpense.amount,
          note: savedExpense.note,
          date: savedExpense.date,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to save expense",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    try {
      await connectDB();
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const expenses = await Expense.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const total = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    return NextResponse.json(
      {
        total,
        expenses: expenses.map((item) => ({
          _id: item._id?.toString(),
          type: item.type,
          category: item.category,
          amount: item.amount,
          note: item.note || "",
          date: item.date,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch expenses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
