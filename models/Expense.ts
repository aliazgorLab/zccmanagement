import mongoose, { type Document, Schema } from "mongoose";

export type ExpenseType = "Breakfast" | "Lunch" | "Evening" | "Office";
export type ExpenseCategory = "Staff" | "Teacher" | "Guest" | "Others";

export interface ExpenseDocument extends Document {
  type: ExpenseType;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  date: Date;
}

const ExpenseSchema = new Schema<ExpenseDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Evening", "Office"],
    },
    category: {
      type: String,
      required: true,
      enum: ["Staff", "Teacher", "Guest", "Others"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Expense = mongoose.models.Expense || mongoose.model<ExpenseDocument>("Expense", ExpenseSchema);

export default Expense;