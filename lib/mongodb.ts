import mongoose from "mongoose";
import dns from "node:dns";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// Some local DNS providers reject SRV lookups used by mongodb+srv URIs.
// Switching Node's resolvers to public DNS helps avoid querySrv ECONNREFUSED.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable.");
  }

  console.log(
    "Attempting to connect with URI:",
    process.env.MONGODB_URI?.split("@")[1]
  );

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).catch((error) => {
      // Allow retries after a failed initial connection attempt.
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;
  console.log("🚀 Database successfully linked to Zahids Chem Clinic");
  return cached.conn;
}

export default connectToDatabase;