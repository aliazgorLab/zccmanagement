import mongoose, { type Document, Schema } from "mongoose";

export type StudentYear = "1st" | "2nd";
export type PaymentType = "Full" | "Partial";
export type StudentStatus = "PAID" | "DUE";

export interface Payment {
  amount: number;
  date: Date;
  receiptNo: string;
}

export interface StudentDocument extends Document {
  name: string;
  phone: string;
  year: StudentYear;
  formNumber: string;
  moneyReceiptNumber: string;
  totalAgreedFee: number;
  totalFee: number;
  courseFee: number;
  totalPaid: number;
  payments: Payment[];
  discount: number;
  paymentType: PaymentType;
  status: StudentStatus;
  feeLockedAt?: Date;
}

const StudentSchema = new Schema<StudentDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      enum: ["1st", "2nd"],
    },
    formNumber: {
      type: String,
      required: true,
      trim: true,
    },
    moneyReceiptNumber: {
      type: String,
      required: true,
      trim: true,
    },
    totalAgreedFee: {
      type: Number,
      required: true,
      default: 13000,
      min: 0,
    },
    totalFee: {
      type: Number,
      required: true,
      default: 13000,
      min: 0,
    },
    courseFee: {
      type: Number,
      default: 13000,
      min: 0,
    },
    totalPaid: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    payments: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        receiptNo: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentType: {
      type: String,
      required: true,
      enum: ["Full", "Partial"],
      default: "Partial",
    },
    status: {
      type: String,
      enum: ["PAID", "DUE"],
      default: "DUE",
    },
    feeLockedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

StudentSchema.pre("validate", function () {
  if (this.year === "2nd" && this.paymentType === "Full") {
    this.discount = 3000;
  }

  if (this.totalAgreedFee == null) {
    this.totalAgreedFee = this.courseFee ?? 13000;
  }

  if (this.totalFee == null) {
    this.totalFee = this.courseFee ?? this.totalAgreedFee ?? 13000;
  }

  if (this.courseFee == null) {
    this.courseFee = this.totalFee ?? this.totalAgreedFee ?? 13000;
  }

  // Calculate totalPaid from payments array
  if (Array.isArray(this.payments) && this.payments.length > 0) {
    this.totalPaid = this.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  }

  const balance = (this.totalAgreedFee ?? 0) - (this.totalPaid ?? 0);
  this.status = balance <= 0 ? "PAID" : "DUE";
  
  // Lock the fee after first admission
  if (!this.feeLockedAt && this.payments && this.payments.length > 0) {
    this.feeLockedAt = new Date();
  }
});

const Student = mongoose.models.Student || mongoose.model<StudentDocument>("Student", StudentSchema);

export default Student;