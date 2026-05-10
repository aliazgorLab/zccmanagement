import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// Prefer .env.local for local Next.js development, then fallback to .env.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const ADMIN_NAME = "Md Ali Azgor";
const ADMIN_EMAIL = "admin@zccmanagement.com";

async function readPasswordFromTerminal() {
  const rl = createInterface({ input, output });
  try {
    const value = await rl.question("Enter secure admin password: ");
    const password = value.trim();
    if (!password) {
      throw new Error("Password cannot be empty.");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    return password;
  } finally {
    rl.close();
  }
}

async function createOrUpdateAdmin() {
  const email = ADMIN_EMAIL;
  const passwordFromEnv = process.env.ADMIN_PASSWORD?.trim();
  const password = passwordFromEnv || (await readPasswordFromTerminal());

  await connectToDatabase();

  const hashedPassword = await bcrypt.hash(password, 12);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    existingUser.name = ADMIN_NAME;
    existingUser.password = hashedPassword;
    existingUser.role = "admin";
    await existingUser.save();
    console.log(`Updated admin user: ${email}`);
    return;
  }

  await User.create({
    name: ADMIN_NAME,
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log(`Created admin user: ${email}`);
}

createOrUpdateAdmin()
  .then(() => {
    console.log("Admin setup complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exit(1);
  });
