import mongoose from "mongoose";

let cachedDb = null;

export async function connectToDB() {
    if (cachedDb) {
        return cachedDb;
    }

    try {
        const connection = await mongoose.connect(
            process.env.NEXT_PUBLIC_MONGODB_URL,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );

        cachedDb = connection;
        return connection;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw new Error("Error connecting to MongoDB");
    }
}
