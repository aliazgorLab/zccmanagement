import mongoose, { type Document, Schema } from "mongoose";

export type UserRole = "admin";

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;
