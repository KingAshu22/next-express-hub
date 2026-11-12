import mongoose from "mongoose";

// Connection string comes from the environment - never hard-code credentials.
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "test";

// Re-use one connection across hot reloads / serverless invocations
const cached = globalThis.__koMongoose || (globalThis.__koMongoose = { promise: null });

export const connectToDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to your environment (.env / hosting dashboard).");
  }

  try {
    cached.promise ||= mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
    await cached.promise;
  } catch (err) {
    cached.promise = null; // allow a retry on the next request
    console.error("Error connecting to MongoDB:", err.message);
    throw err;
  }
};
